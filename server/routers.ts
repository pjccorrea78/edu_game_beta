import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { PDFParse } from "pdf-parse";
import {
  getOrCreatePlayer,
  updatePlayerPoints,
  updatePlayerAvatar,
  updatePlayerNickname,
  updatePlayerGuardianEmail,
  updatePlayerSchoolName,
  updatePlayerProfile,
  saveAvatarImage,
  createAvatarShare,
  getAvatarShare,
  updateParentEmail,
  getQuestionsByDiscipline,
  countQuestionsByDiscipline,
  createQuizSession,
  updateQuizSession,
  getPlayerQuizHistory,
  getBestScoreByDiscipline,
  getAllEquipmentItems,
  getPlayerOwnedItems,
  purchaseItem,
  createNotification,
  insertQuestion,
  getDb,
  createStudyMaterial,
  updateStudyMaterialStatus,
  getStudyMaterialsByPlayer,
  getStudyMaterialById,
  insertCustomQuizQuestions,
  getCustomQuizQuestions,
  deleteCustomQuizQuestions,
  createCustomQuizSession,
  getRankingByMaterial,
  getPlayerBestByMaterial,
  createClassCode,
  getClassCodeByCode,
  incrementClassCodeUsage,
  getClassCodesByOwner,
  getPlayerAchievements,
  unlockAchievement,
  getTurmaProgress,
  getTurmaStats,
  getDailyChallengeByDate,
  createDailyChallenge,
  getPlayerDailyAttempt,
  createDailyChallengeAttempt,
  getPlayerDailyStreak,
  getGlobalLeaderboard,
  getPlayerRank,
  createChallengeDuel,
  getChallengeDuelByCode,
  updateChallengeDuelStatus,
  createChallengeDuelResult,
  getChallengeDuelResults,
  getPlayerDuels,
  getAllStoryMissions,
  getPlayerMissions,
  completeMission,
  savePushSubscription,
  getAllPushSubscriptions,
  deletePushSubscription,
  getPlayerPushSubscription,
  saveParentReport,
  getPlayerWeeklyStats,
  getLastParentReport,
} from "./db";
import { players, equipmentItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Discipline, AvatarConfig } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import webpush from "web-push";

// Initialize VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:edugame@manus.im',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const disciplineSchema = z.enum([
  "matematica",
  "portugues",
  "geografia",
  "historia",
  "ciencias",
  "educacao_fisica",
  "arte",
  "ensino_religioso",
]);

const avatarConfigSchema = z.object({
  skinColor: z.string(),
  hairColor: z.string(),
  shirtColor: z.string(),
  pantsColor: z.string(),
  equippedItems: z.array(z.number()),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Player ──────────────────────────────────────────────────────────────
  player: router({
    getOrCreate: publicProcedure
      .input(z.object({ sessionId: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return getOrCreatePlayer(input.sessionId);
      }),

    updateNickname: publicProcedure
      .input(z.object({ sessionId: z.string(), nickname: z.string().min(1).max(32) }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await updatePlayerNickname(player.id, input.nickname);
        return { success: true };
      }),

    updateGuardianEmail: publicProcedure
      .input(z.object({ sessionId: z.string(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await updatePlayerGuardianEmail(player.id, input.email);
        return { success: true };
      }),

    updateProfile: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          age: z.number().int().min(5).max(18).optional(),
          grade: z.enum(["1","2","3","4","5","6","7","8","9"]).optional(),
          gender: z.enum(["masculino","feminino"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await updatePlayerProfile(player.id, {
          age: input.age,
          grade: input.grade,
          gender: input.gender,
        });
        return { success: true };
      }),

    updateSchoolName: publicProcedure
      .input(z.object({ sessionId: z.string(), schoolName: z.string().min(1).max(64) }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await updatePlayerSchoolName(player.id, input.schoolName);
        return { success: true };
      }),

    getProgress: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const history = await getPlayerQuizHistory(player.id);
        const ownedItems = await getPlayerOwnedItems(player.id);

        // Compute best scores per discipline
        const disciplines: Discipline[] = [
          "matematica",
          "portugues",
          "geografia",
          "historia",
          "ciencias",
        ];
        const disciplineProgress = await Promise.all(
          disciplines.map(async (d) => {
            const best = await getBestScoreByDiscipline(player.id, d);
            return {
              discipline: d,
              bestScore: best?.score ?? 0,
              bestCorrect: best?.correctAnswers ?? 0,
              completed: (best?.correctAnswers ?? 0) >= 8,
              attempts: history.filter((h) => h.discipline === d).length,
            };
          })
        );

        return {
          player,
          disciplineProgress,
          quizHistory: history.slice(0, 10),
          ownedItemIds: ownedItems,
        };
      }),
  }),

  // ─── Quiz ─────────────────────────────────────────────────────────────────
  quiz: router({
    getQuestions: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          discipline: disciplineSchema,
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          grade: z.enum(["1","2","3","4","5","6","7","8","9"]).optional(),
        })
      )
      .query(async ({ input }) => {
        // Buscar série do jogador se não fornecida
        let playerGrade = input.grade;
        if (!playerGrade) {
          const player = await getOrCreatePlayer(input.sessionId);
          playerGrade = (player.grade as "1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9") ?? undefined;
          // Se ainda não tem série mas tem idade, calcular
          if (!playerGrade && player.age) {
            const age = player.age;
            if (age <= 6) playerGrade = "1";
            else if (age === 7) playerGrade = "2";
            else if (age === 8) playerGrade = "3";
            else if (age === 9) playerGrade = "4";
            else if (age === 10) playerGrade = "5";
            else if (age === 11) playerGrade = "6";
            else if (age === 12) playerGrade = "7";
            else if (age === 13) playerGrade = "8";
            else playerGrade = "9";
          }
        }

        const gradeLabel = playerGrade ? `${playerGrade}º Ano do Ensino Fundamental` : "Ensino Fundamental";

        let questions = await getQuestionsByDiscipline(
          input.discipline as Discipline,
          10,
          input.difficulty
        );

        // Se não há questões suficientes, gerar via LLM e salvar no banco
        if (questions.length < 5) {
          const allDisciplineNames: Record<string, string> = {
            matematica: "Matemática",
            portugues: "Língua Portuguesa",
            geografia: "Geografia",
            historia: "História",
            ciencias: "Ciências",
            arte: "Artes Visuais e Cultura",
            educacao_fisica: "Educação Física e Saúde",
            ensino_religioso: "Ensino Religioso e Valores Humanos",
          };
          const disciplineName = allDisciplineNames[input.discipline] ?? input.discipline;
          try {
            const genPrompt = `Você é um professor especialista em educação. Gere 10 perguntas de múltipla escolha sobre ${disciplineName} para alunos do ${gradeLabel}, seguindo a Base Nacional Comum Curricular (BNCC).

Retorne APENAS um JSON válido:
{"questions":[{"questionText":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"A","explanation":"..."}]}

Regras:
- Adequado ao ${gradeLabel} conforme BNCC
- Linguagem acessível para a faixa etária
- Perguntas claras, 4 alternativas plausíveis, apenas uma correta
- Explicação curta e didática
- Varie os temas dentro da disciplina`;
            const llmResp = await invokeLLM({
              messages: [
                { role: "system", content: `Você é um professor especialista em educação básica brasileira. Cria perguntas educativas seguindo a BNCC para o ${gradeLabel}.` },
                { role: "user", content: genPrompt },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "quiz_questions",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            questionText: { type: "string" },
                            optionA: { type: "string" },
                            optionB: { type: "string" },
                            optionC: { type: "string" },
                            optionD: { type: "string" },
                            correctOption: { type: "string", enum: ["A", "B", "C", "D"] },
                            explanation: { type: "string" },
                          },
                          required: ["questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["questions"],
                    additionalProperties: false,
                  },
                },
              },
            });
            const rawContent = llmResp.choices[0]?.message?.content;
            const content = typeof rawContent === "string" ? rawContent : null;
            if (content) {
              const parsed = JSON.parse(content) as { questions: Array<{
                questionText: string; optionA: string; optionB: string;
                optionC: string; optionD: string;
                correctOption: "A" | "B" | "C" | "D"; explanation: string;
              }> };
              for (const q of parsed.questions) {
                await insertQuestion({
                  discipline: input.discipline as Discipline,
                  difficulty: "medium",
                  questionText: q.questionText,
                  optionA: q.optionA,
                  optionB: q.optionB,
                  optionC: q.optionC,
                  optionD: q.optionD,
                  correctOption: q.correctOption,
                  explanation: q.explanation,
                  isAiGenerated: true,
                });
              }
              // Buscar as questões recém-geradas
              questions = await getQuestionsByDiscipline(input.discipline as Discipline, 10);
            }
          } catch (err) {
            console.error("[getQuestions] LLM generation failed:", err);
          }
        }

        const count = questions.length;
        return { questions, totalAvailable: count };
      }),

    startSession: publicProcedure
      .input(z.object({ sessionId: z.string(), discipline: disciplineSchema }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const session = await createQuizSession(player.id, input.discipline as Discipline);
        return { sessionId: session.id, playerId: player.id };
      }),

    submitAnswer: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          quizSessionId: z.number(),
          isCorrect: z.boolean(),
          currentCorrect: z.number(),
          currentWrong: z.number(),
          currentScore: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const pointsDelta = input.isCorrect ? 10 : -5;
        await updateQuizSession(input.quizSessionId, {
          score: input.currentScore + (input.isCorrect ? 10 : -5),
          correctAnswers: input.currentCorrect + (input.isCorrect ? 1 : 0),
          wrongAnswers: input.currentWrong + (input.isCorrect ? 0 : 1),
        });
        return { pointsDelta };
      }),

    finishSession: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          quizSessionId: z.number(),
          discipline: disciplineSchema,
          finalScore: z.number(),
          correctAnswers: z.number(),
          wrongAnswers: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const pointsEarned = Math.max(0, input.finalScore);

        await updateQuizSession(input.quizSessionId, {
          score: input.finalScore,
          correctAnswers: input.correctAnswers,
          wrongAnswers: input.wrongAnswers,
          completed: true,
          pointsEarned,
          completedAt: new Date(),
        });

        const updatedPlayer = await updatePlayerPoints(player.id, pointsEarned);

        // Check milestones for notifications
        const guardianEmail = updatedPlayer?.guardianEmail;
        if (guardianEmail) {
          // Discipline complete (8+ correct)
          if (input.correctAnswers >= 8) {
            const disciplineNames: Record<string, string> = {
              matematica: "Matemática",
              portugues: "Português",
              geografia: "Geografia",
              historia: "História",
              ciencias: "Ciências",
            };
            await createNotification(
              player.id,
              "discipline_complete",
              `Parabéns! ${updatedPlayer?.nickname ?? "Seu filho"} completou ${disciplineNames[input.discipline]} com ${input.correctAnswers}/10 acertos!`,
              guardianEmail
            );
          }
          // Points milestone
          const newTotal = updatedPlayer?.totalPoints ?? 0;
          const oldTotal = newTotal - pointsEarned;
          if (oldTotal < 1000 && newTotal >= 1000) {
            await createNotification(
              player.id,
              "points_milestone",
              `Incrível! ${updatedPlayer?.nickname ?? "Seu filho"} atingiu 1000 pontos no EduGame!`,
              guardianEmail
            );
          }
        }

        return {
          pointsEarned,
          newTotal: updatedPlayer?.totalPoints ?? 0,
          player: updatedPlayer,
        };
      }),

    // Retorna a dificuldade adaptativa para o aluno em uma disciplina
    getAdaptiveDifficulty: publicProcedure
      .input(z.object({ sessionId: z.string(), discipline: disciplineSchema }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const history = await getPlayerQuizHistory(player.id);

        // Filtrar histórico da disciplina (últimas 5 sessões)
        const disciplineHistory = history
          .filter((h) => h.discipline === input.discipline && h.completed)
          .slice(0, 5);

        if (disciplineHistory.length === 0) {
          return { difficulty: "easy" as const, reason: "primeira_vez", attempts: 0, avgAccuracy: 0 };
        }

        // Calcular média de acerto das últimas sessões
        const totalCorrect = disciplineHistory.reduce((sum, s) => sum + (s.correctAnswers ?? 0), 0);
        const totalQuestions = disciplineHistory.length * 10;
        const avgAccuracy = totalCorrect / totalQuestions;

        let difficulty: "easy" | "medium" | "hard";
        let reason: string;

        if (avgAccuracy >= 0.8) {
          difficulty = "hard";
          reason = "excelente_desempenho";
        } else if (avgAccuracy >= 0.5) {
          difficulty = "medium";
          reason = "bom_desempenho";
        } else {
          difficulty = "easy";
          reason = "precisa_praticar";
        }

        return {
          difficulty,
          reason,
          attempts: disciplineHistory.length,
          avgAccuracy: Math.round(avgAccuracy * 100),
        };
      }),
  }),

  // ─── Equipment / Shop ─────────────────────────────────────────────────────
  shop: router({
    listItems: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const allItems = await getAllEquipmentItems();
        const ownedIds = await getPlayerOwnedItems(player.id);
        return {
          items: allItems,
          ownedIds,
          playerPoints: player.totalPoints,
        };
      }),

    purchase: publicProcedure
      .input(z.object({ sessionId: z.string(), itemId: z.number() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const item = await db
          .select()
          .from(equipmentItems)
          .where(eq(equipmentItems.id, input.itemId))
          .limit(1);
        if (!item[0]) throw new Error("Item não encontrado");

        if (player.totalPoints < item[0].pointsCost) {
          throw new Error("Pontos insuficientes");
        }

        await purchaseItem(player.id, input.itemId);
        const updatedPlayer = await updatePlayerPoints(player.id, -item[0].pointsCost);

        // Check all equipment milestone
        const allItems = await getAllEquipmentItems();
        const ownedIds = await getPlayerOwnedItems(player.id);
        if (ownedIds.length >= allItems.length && player.guardianEmail) {
          await createNotification(
            player.id,
            "all_equipment",
            `Uau! ${player.nickname} desbloqueou todos os equipamentos do EduGame!`,
            player.guardianEmail
          );
        }

        return {
          success: true,
          newPoints: updatedPlayer?.totalPoints ?? 0,
        };
      }),
  }),

  // ─── Avatar ───────────────────────────────────────────────────────────────
  avatar: router({
    save: publicProcedure
      .input(z.object({ sessionId: z.string(), avatarConfig: avatarConfigSchema }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await updatePlayerAvatar(player.id, input.avatarConfig as AvatarConfig);
        return { success: true };
      }),

    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        return {
          avatarConfig: player.avatarConfig ?? {
            skinColor: "#FDBCB4",
            hairColor: "#4A2C2A",
            shirtColor: "#4169E1",
            pantsColor: "#4682B4",
            equippedItems: [],
          },
        };
      }),
  }),

  // ─── LLM: Generate Questions ──────────────────────────────────────────────
  llm: router({
    generateQuestions: publicProcedure
      .input(
        z.object({
          discipline: disciplineSchema,
          difficulty: z.enum(["easy", "medium", "hard"]),
          count: z.number().min(1).max(5).default(3),
          performanceHint: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const disciplineNames: Record<string, string> = {
          matematica: "Matemática (nível fundamental)",
          portugues: "Língua Portuguesa (nível fundamental)",
          geografia: "Geografia (nível fundamental)",
          historia: "História (nível fundamental)",
          ciencias: "Ciências (nível fundamental)",
        };

        const difficultyNames: Record<string, string> = {
          easy: "fácil (para crianças de 5-8 anos)",
          medium: "médio (para crianças de 8-10 anos)",
          hard: "difícil (para crianças de 10-12 anos)",
        };

        const prompt = `Você é um professor especialista em educação infantil. Gere ${input.count} perguntas de múltipla escolha sobre ${disciplineNames[input.discipline]} com dificuldade ${difficultyNames[input.difficulty]}.
${input.performanceHint ? `Contexto do aluno: ${input.performanceHint}` : ""}

Retorne APENAS um JSON válido com este formato exato:
{
  "questions": [
    {
      "questionText": "Texto da pergunta aqui?",
      "optionA": "Opção A",
      "optionB": "Opção B",
      "optionC": "Opção C",
      "optionD": "Opção D",
      "correctOption": "A",
      "explanation": "Explicação breve da resposta correta"
    }
  ]
}

Regras:
- Perguntas claras e adequadas para a faixa etária
- 4 alternativas plausíveis
- Apenas uma resposta correta
- Explicação curta e educativa
- Linguagem simples e amigável`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um professor especialista em educação infantil que cria perguntas de quiz educativas." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quiz_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionText: { type: "string" },
                        optionA: { type: "string" },
                        optionB: { type: "string" },
                        optionC: { type: "string" },
                        optionD: { type: "string" },
                        correctOption: { type: "string", enum: ["A", "B", "C", "D"] },
                        explanation: { type: "string" },
                      },
                      required: ["questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : null;
        if (!content) throw new Error("LLM não retornou resposta");

        const parsed = JSON.parse(content) as { questions: Array<{
          questionText: string;
          optionA: string;
          optionB: string;
          optionC: string;
          optionD: string;
          correctOption: "A" | "B" | "C" | "D";
          explanation: string;
        }> };

        // Save generated questions to DB
        for (const q of parsed.questions) {
          await insertQuestion({
            discipline: input.discipline as Discipline,
            difficulty: input.difficulty,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            isAiGenerated: true,
          });
        }

        return { generated: parsed.questions.length, questions: parsed.questions };
      }),
  }),

  // ─── Study Material ──────────────────────────────────────────────────────────
  studyMaterial: router({
    // Upload text material and trigger LLM analysis
    submit: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          title: z.string().min(1).max(256),
          contentText: z.string().min(10).max(50000),
          discipline: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        // Create material record
        const material = await createStudyMaterial({
          playerId: player.id,
          title: input.title,
          contentText: input.contentText,
          fileType: "text",
          status: "analyzing",
          discipline: input.discipline,
        });
        if (!material) throw new Error("Failed to create material");

        // Analyze with LLM and generate questions
        try {
          const prompt = `Você é um professor especialista em educação infantil (5-12 anos).

Analise o seguinte material de estudo e gere exatamente 10 perguntas de múltipla escolha em português brasileiro.

MATERIAL:
${input.contentText.slice(0, 8000)}

Regras:
- Cada pergunta deve ter 4 alternativas (A, B, C, D)
- Apenas UMA alternativa correta
- Linguagem simples e adequada para crianças de 5-12 anos
- Perguntas devem cobrir os principais conceitos do material
- Inclua uma explicação breve da resposta correta
- Varie a dificuldade (fácil, média, difícil)

Retorne SOMENTE um JSON válido neste formato:
{
  "questions": [
    {
      "questionText": "Pergunta aqui?",
      "optionA": "Alternativa A",
      "optionB": "Alternativa B",
      "optionC": "Alternativa C",
      "optionD": "Alternativa D",
      "correctOption": "A",
      "explanation": "Explicação breve"
    }
  ]
}`;

          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um professor especialista que gera quiz educativos. Retorne APENAS JSON válido, sem markdown, sem texto extra." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "quiz_questions",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          questionText: { type: "string" },
                          optionA: { type: "string" },
                          optionB: { type: "string" },
                          optionC: { type: "string" },
                          optionD: { type: "string" },
                          correctOption: { type: "string", enum: ["A", "B", "C", "D"] },
                          explanation: { type: "string" },
                        },
                        required: ["questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["questions"],
                  additionalProperties: false,
                },
              },
            },
          });

          const raw = llmResponse.choices?.[0]?.message?.content ?? "{}";
          let parsed: { questions: Array<{ questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string }> };
          try {
            parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          } catch {
            throw new Error("LLM returned invalid JSON");
          }

          const validQuestions = (parsed.questions ?? []).slice(0, 10).filter(
            (q) => q.questionText && q.optionA && q.optionB && q.optionC && q.optionD && ["A","B","C","D"].includes(q.correctOption)
          );

          if (validQuestions.length === 0) throw new Error("No valid questions generated");

          // Delete old questions if re-analyzing
          await deleteCustomQuizQuestions(material.id);

          // Save generated questions
          await insertCustomQuizQuestions(
            validQuestions.map((q) => ({
              materialId: material.id,
              playerId: player.id,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption as "A" | "B" | "C" | "D",
              explanation: q.explanation,
            }))
          );

          await updateStudyMaterialStatus(material.id, "ready", validQuestions.length);

          return {
            materialId: material.id,
            status: "ready" as const,
            questionsGenerated: validQuestions.length,
          };
        } catch (err) {
          await updateStudyMaterialStatus(material.id, "error", 0);
          throw new Error(`Análise falhou: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        }
      }),

    // Upload PDF material - receives base64, extracts text, then analyzes
    submitPdf: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(256),
        pdfBase64: z.string().min(10),
        discipline: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        // Extract text from PDF
        let extractedText = "";
        try {
          const buffer = Buffer.from(input.pdfBase64, "base64");
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          extractedText = (pdfData.text ?? pdfData.pages?.map((p: { text: string }) => p.text).join(" ") ?? "").trim();
        } catch {
          throw new Error("Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.");
        }
        if (extractedText.length < 50) throw new Error("PDF sem texto suficiente para análise.");
        // Create material with extracted text
        const material = await createStudyMaterial({
          playerId: player.id,
          title: input.title,
          contentText: extractedText.slice(0, 50000),
          fileType: "pdf",
          status: "analyzing",
          discipline: input.discipline,
        });
        if (!material) throw new Error("Falha ao criar material");
        // Analyze with LLM
        try {
          const prompt = `Você é um professor especialista em educação infantil (5-12 anos).\n\nAnalise o seguinte material de estudo extraído de um PDF e gere exatamente 10 perguntas de múltipla escolha em português brasileiro.\n\nMATERIAL:\n${extractedText.slice(0, 8000)}\n\nRegras:\n- Cada pergunta deve ter 4 alternativas (A, B, C, D)\n- Apenas UMA alternativa correta\n- Linguagem simples e adequada para crianças de 5-12 anos\n- Perguntas devem cobrir os principais conceitos do material\n- Inclua uma explicação breve da resposta correta`;
          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um professor especialista que gera quiz educativos. Retorne APENAS JSON válido." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "quiz_questions",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          questionText: { type: "string" },
                          optionA: { type: "string" },
                          optionB: { type: "string" },
                          optionC: { type: "string" },
                          optionD: { type: "string" },
                          correctOption: { type: "string", enum: ["A","B","C","D"] },
                          explanation: { type: "string" },
                        },
                        required: ["questionText","optionA","optionB","optionC","optionD","correctOption","explanation"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["questions"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = llmResponse.choices[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent : null;
          if (!content) throw new Error("LLM não retornou resposta");
          let parsed: { questions: Array<{ questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string }> };
          try { parsed = JSON.parse(content); } catch { throw new Error("LLM returned invalid JSON"); }
          const validQuestions = (parsed.questions ?? []).slice(0, 10).filter(
            (q) => q.questionText && ["A","B","C","D"].includes(q.correctOption)
          );
          await deleteCustomQuizQuestions(material.id);
          await insertCustomQuizQuestions(
            validQuestions.map((q) => ({
              materialId: material.id,
              playerId: player.id,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption as "A"|"B"|"C"|"D",
              explanation: q.explanation,
            }))
          );
          await updateStudyMaterialStatus(material.id, "ready", validQuestions.length);
          return { materialId: material.id, status: "ready" as const, questionsGenerated: validQuestions.length, extractedChars: extractedText.length };
        } catch (err) {
          await updateStudyMaterialStatus(material.id, "error", 0);
          throw new Error(`Análise falhou: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        }
      }),

    // List all materials for a player
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const materials = await getStudyMaterialsByPlayer(player.id);
        return { materials };
      }),

    // Get questions for a specific material
    getQuestions: publicProcedure
      .input(z.object({ sessionId: z.string(), materialId: z.number() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const material = await getStudyMaterialById(input.materialId);
        if (!material || material.playerId !== player.id) {
          throw new Error("Material não encontrado");
        }
        const questions = await getCustomQuizQuestions(input.materialId);
        return { material, questions };
      }),

    // Re-analyze an existing material
    reanalyze: publicProcedure
      .input(z.object({ sessionId: z.string(), materialId: z.number() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const material = await getStudyMaterialById(input.materialId);
        if (!material || material.playerId !== player.id) {
          throw new Error("Material não encontrado");
        }
        if (!material.contentText) throw new Error("Material sem conteúdo de texto");

        await updateStudyMaterialStatus(input.materialId, "analyzing");

        // Re-trigger analysis (same logic as submit)
        const prompt = `Você é um professor especialista em educação infantil (5-12 anos).

Analise o seguinte material de estudo e gere exatamente 10 perguntas de múltipla escolha em português brasileiro.

MATERIAL:
${material.contentText.slice(0, 8000)}

Regras:
- Cada pergunta deve ter 4 alternativas (A, B, C, D)
- Apenas UMA alternativa correta
- Linguagem simples e adequada para crianças de 5-12 anos
- Perguntas devem cobrir os principais conceitos do material
- Inclua uma explicação breve da resposta correta

Retorne SOMENTE um JSON válido neste formato:
{
  "questions": [
    {
      "questionText": "Pergunta aqui?",
      "optionA": "Alternativa A",
      "optionB": "Alternativa B",
      "optionC": "Alternativa C",
      "optionD": "Alternativa D",
      "correctOption": "A",
      "explanation": "Explicação breve"
    }
  ]
}`;

        try {
          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um professor especialista que gera quiz educativos. Retorne APENAS JSON válido." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "quiz_questions",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          questionText: { type: "string" },
                          optionA: { type: "string" },
                          optionB: { type: "string" },
                          optionC: { type: "string" },
                          optionD: { type: "string" },
                          correctOption: { type: "string", enum: ["A", "B", "C", "D"] },
                          explanation: { type: "string" },
                        },
                        required: ["questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["questions"],
                  additionalProperties: false,
                },
              },
            },
          });

          const raw = llmResponse.choices?.[0]?.message?.content ?? "{}";
          let parsed: { questions: Array<{ questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string }> };
          try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; }
          catch { throw new Error("LLM returned invalid JSON"); }

          const validQuestions = (parsed.questions ?? []).slice(0, 10).filter(
            (q) => q.questionText && ["A","B","C","D"].includes(q.correctOption)
          );

          await deleteCustomQuizQuestions(input.materialId);
          await insertCustomQuizQuestions(
            validQuestions.map((q) => ({
              materialId: input.materialId,
              playerId: player.id,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption as "A" | "B" | "C" | "D",
              explanation: q.explanation,
            }))
          );
          await updateStudyMaterialStatus(input.materialId, "ready", validQuestions.length);
          return { status: "ready" as const, questionsGenerated: validQuestions.length };
        } catch (err) {
          await updateStudyMaterialStatus(input.materialId, "error", 0);
          throw new Error(`Análise falhou: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        }
      }),
  }),

  // ─── Ranking ────────────────────────────────────────────────────────────────────────
  ranking: router({
    // Save quiz result and update ranking
    saveResult: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        materialId: z.number(),
        score: z.number(),
        correctAnswers: z.number(),
        wrongAnswers: z.number(),
        totalQuestions: z.number(),
        pointsEarned: z.number(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await createCustomQuizSession({
          playerId: player.id,
          materialId: input.materialId,
          score: input.score,
          correctAnswers: input.correctAnswers,
          wrongAnswers: input.wrongAnswers,
          totalQuestions: input.totalQuestions,
          pointsEarned: input.pointsEarned,
          nickname: player.nickname,
        });
        return { success: true };
      }),

    // Get top 10 ranking for a material
    getByMaterial: publicProcedure
      .input(z.object({ materialId: z.number() }))
      .query(async ({ input }) => {
        const entries = await getRankingByMaterial(input.materialId, 10);
        return { entries };
      }),

    // Get player's best result for a material
    getPlayerBest: publicProcedure
      .input(z.object({ sessionId: z.string(), materialId: z.number() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const best = await getPlayerBestByMaterial(player.id, input.materialId);
        return { best };
      }),
  }),

  // ─── Class Codes ────────────────────────────────────────────────────────────────────
  classCode: router({
    // Generate a class code for a material (any player can share)
    generate: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        materialId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const material = await getStudyMaterialById(input.materialId);
        if (!material) throw new Error("Material não encontrado");
        if (material.status !== "ready") throw new Error("Material ainda não está pronto");
        // Generate unique 6-char uppercase code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        const entry = await createClassCode({
          code,
          ownerId: player.id,
          materialId: input.materialId,
          title: material.title,
        });
        return { code: entry?.code ?? code, materialTitle: material.title };
      }),

    // Join a class using a code (copies material + questions to the player)
    join: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        code: z.string().min(4).max(8),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const entry = await getClassCodeByCode(input.code.trim().toUpperCase());
        if (!entry) throw new Error("Código de turma inválido ou expirado");
        // Check expiry
        if (entry.expiresAt && new Date() > entry.expiresAt) throw new Error("Código expirado");
        // Get original questions
        const origQuestions = await getCustomQuizQuestions(entry.materialId);
        if (origQuestions.length === 0) throw new Error("Material sem perguntas geradas");
        // Create a copy of the material for this player
        const newMaterial = await createStudyMaterial({
          playerId: player.id,
          title: `🏫 ${entry.title}`,
          contentText: null,
          fileType: "text",
          status: "ready",
          discipline: null,
          questionsGenerated: origQuestions.length,
        });
        if (!newMaterial) throw new Error("Falha ao copiar material");
        // Copy questions
        await insertCustomQuizQuestions(
          origQuestions.map((q) => ({
            materialId: newMaterial.id,
            playerId: player.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
          }))
        );
        await incrementClassCodeUsage(entry.id);
        return { success: true, materialId: newMaterial.id, title: newMaterial.title };
      }),

    // List codes generated by the player
    listMyCodes: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const codes = await getClassCodesByOwner(player.id);
        return { codes };
      }),
  }),

  // ─── Achievements ────────────────────────────────────────────────────────────
  achievements: router({
    // All achievement definitions (static catalog)
    catalog: publicProcedure.query(() => {
      return { achievements: ACHIEVEMENTS_CATALOG };
    }),
    // Player's unlocked achievements
    myAchievements: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const unlocked = await getPlayerAchievements(player.id);
        const unlockedKeys = new Set(unlocked.map(a => a.achievementKey));
        const result = ACHIEVEMENTS_CATALOG.map(a => ({
          ...a,
          unlocked: unlockedKeys.has(a.key),
          unlockedAt: unlocked.find(u => u.achievementKey === a.key)?.unlockedAt ?? null,
        }));
        return { achievements: result, totalUnlocked: unlocked.length };
      }),
    // Check and unlock achievements after an event
    checkAndUnlock: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        event: z.enum(["quiz_complete", "purchase", "material_upload"]),
        data: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const newlyUnlocked: string[] = [];

        // Get current state
        const history = await getPlayerQuizHistory(player.id);
        const owned = await getPlayerOwnedItems(player.id);
        const allItems = await getAllEquipmentItems();

        // Check each achievement condition
        for (const achievement of ACHIEVEMENTS_CATALOG) {
          let shouldUnlock = false;
          switch (achievement.key) {
            case "first_quiz": shouldUnlock = history.length >= 1; break;
            case "quiz_5": shouldUnlock = history.length >= 5; break;
            case "quiz_20": shouldUnlock = history.length >= 20; break;
            case "points_100": shouldUnlock = player.totalPoints >= 100; break;
            case "points_500": shouldUnlock = player.totalPoints >= 500; break;
            case "points_1000": shouldUnlock = player.totalPoints >= 1000; break;
            case "perfect_score": shouldUnlock = history.some(s => s.correctAnswers === s.totalQuestions && s.totalQuestions > 0); break;
            case "first_item": shouldUnlock = owned.length >= 1; break;
            case "collector": shouldUnlock = owned.length >= 5; break;
            case "all_disciplines": {
              const disciplines = new Set(history.map(s => s.discipline));
              shouldUnlock = disciplines.size >= 5;
              break;
            }
            case "material_master": shouldUnlock = input.event === "material_upload"; break;
            case "streak_3": {
              // 3 perfect scores in a row
              const recent = history.slice(-3);
              shouldUnlock = recent.length >= 3 && recent.every(s => s.correctAnswers === s.totalQuestions && s.totalQuestions > 0);
              break;
            }
          }
          if (shouldUnlock) {
            const isNew = await unlockAchievement(player.id, achievement.key);
            if (isNew) newlyUnlocked.push(achievement.key);
          }
        }
        return { newlyUnlocked, achievements: newlyUnlocked.map(k => ACHIEVEMENTS_CATALOG.find(a => a.key === k)!) };
      }),
  }),

  // ─── Teacher Panel ────────────────────────────────────────────────────────────
  teacher: router({
    // Get all student progress for a material (via class code)
    getTurmaProgress: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const codeEntry = await getClassCodeByCode(input.code.toUpperCase());
        if (!codeEntry) throw new Error("Código de turma não encontrado");
        const sessions = await getTurmaProgress(codeEntry.materialId);
        const stats = await getTurmaStats(codeEntry.materialId);
        return { sessions, stats, materialTitle: codeEntry.title, code: codeEntry.code };
      }),
  }),

  // ─── Daily Challenge ───────────────────────────────────────────────────────────────────
  daily: router({
    getToday: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const today = new Date().toISOString().slice(0, 10);
        let challenge = await getDailyChallengeByDate(today);
        if (!challenge) {
          // Generate via LLM
          const disciplines: Array<'matematica'|'portugues'|'geografia'|'historia'|'ciencias'> = ['matematica','portugues','geografia','historia','ciencias'];
          const discipline = disciplines[Math.floor(Math.random() * disciplines.length)];
          const disciplineNames: Record<string, string> = { matematica: 'Matemática', portugues: 'Português', geografia: 'Geografia', historia: 'História', ciencias: 'Ciências' };
          const llmResponse = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um professor criativo para crianças de 5 a 12 anos. Responda APENAS com JSON válido.' },
              { role: 'user', content: `Crie 1 pergunta desafio do dia de ${disciplineNames[discipline]} para o ensino fundamental. Formato JSON: {"questionText":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"A|B|C|D","explanation":"..."}` },
            ],
            response_format: { type: 'json_schema', json_schema: { name: 'daily_q', strict: true, schema: { type: 'object', properties: { questionText: { type: 'string' }, optionA: { type: 'string' }, optionB: { type: 'string' }, optionC: { type: 'string' }, optionD: { type: 'string' }, correctOption: { type: 'string', enum: ['A','B','C','D'] }, explanation: { type: 'string' } }, required: ['questionText','optionA','optionB','optionC','optionD','correctOption','explanation'], additionalProperties: false } } },
          });
          const raw = llmResponse.choices?.[0]?.message?.content ?? '{}';
          const q = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
          challenge = await createDailyChallenge({ date: today, discipline, ...q, bonusMultiplier: 2.0 });
        }
        const player = await getOrCreatePlayer(input.sessionId);
        const alreadyAttempted = challenge ? await getPlayerDailyAttempt(player.id, challenge.id) : null;
        const streak = await getPlayerDailyStreak(player.id);
        return { challenge, alreadyAttempted: !!alreadyAttempted, streak };
      }),

    submit: publicProcedure
      .input(z.object({ sessionId: z.string(), challengeId: z.number(), selectedOption: z.enum(['A','B','C','D']) }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const challenge = await getDailyChallengeByDate(new Date().toISOString().slice(0, 10));
        if (!challenge || challenge.id !== input.challengeId) throw new Error('Desafio inválido');
        const existing = await getPlayerDailyAttempt(player.id, challenge.id);
        if (existing) throw new Error('Você já respondeu o desafio de hoje!');
        const isCorrect = input.selectedOption === challenge.correctOption;
        const streak = await getPlayerDailyStreak(player.id);
        const newStreak = isCorrect ? streak + 1 : 1;
        // Bonus: 2x base + streak bonus (max 5x)
        const streakBonus = Math.min(newStreak, 5);
        const basePoints = isCorrect ? 10 : 0;
        const pointsEarned = Math.round(basePoints * challenge.bonusMultiplier * (isCorrect ? streakBonus : 1));
        await createDailyChallengeAttempt({ playerId: player.id, challengeId: challenge.id, isCorrect, pointsEarned, streakDay: newStreak });
        if (pointsEarned > 0) await updatePlayerPoints(player.id, pointsEarned);
        return { isCorrect, pointsEarned, correctOption: challenge.correctOption, explanation: challenge.explanation, newStreak };
      }),
  }),

  // ─── Global Leaderboard ───────────────────────────────────────────────────────────────
  globalLeaderboard: router({
    getTop10: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const [top10, player] = await Promise.all([
          getGlobalLeaderboard(10),
          getOrCreatePlayer(input.sessionId),
        ]);
        const myRank = await getPlayerRank(player.id);
        return { top10, myRank, myPoints: player.totalPoints, myNickname: player.nickname };
      }),
  }),

  // ─── Challenge Duels (Multiplayer Async) ───────────────────────────────────────────────
  duel: router({
    create: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        quizType: z.enum(['discipline', 'material']),
        discipline: disciplineSchema.optional(),
        materialId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        const duel = await createChallengeDuel({
          code,
          challengerId: player.id,
          quizType: input.quizType,
          discipline: input.discipline,
          materialId: input.materialId,
          status: 'waiting',
          expiresAt,
        });
        return { duel, code };
      }),

    join: publicProcedure
      .input(z.object({ sessionId: z.string(), code: z.string() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const duel = await getChallengeDuelByCode(input.code.toUpperCase());
        if (!duel) throw new Error('Desafio não encontrado');
        if (duel.status === 'completed') throw new Error('Este desafio já foi concluído');
        if (duel.challengerId === player.id) throw new Error('Você não pode entrar no seu próprio desafio');
        if (duel.status === 'waiting') {
          await updateChallengeDuelStatus(duel.id, 'in_progress', player.id);
        }
        return { duel: { ...duel, challengedId: player.id }, playerId: player.id };
      }),

    submitResult: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        duelId: z.number(),
        score: z.number(),
        correctAnswers: z.number(),
        totalQuestions: z.number(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await createChallengeDuelResult({
          duelId: input.duelId,
          playerId: player.id,
          score: input.score,
          correctAnswers: input.correctAnswers,
          totalQuestions: input.totalQuestions,
          nickname: player.nickname,
        });
        const results = await getChallengeDuelResults(input.duelId);
        const duel = await getChallengeDuelByCode(''); // We'll get by id
        // Check if both players submitted
        const duelData = (await getPlayerDuels(player.id)).find(d => d.id === input.duelId);
        if (duelData && results.length >= 2) {
          await updateChallengeDuelStatus(input.duelId, 'completed');
        }
        return { results };
      }),

    getResult: publicProcedure
      .input(z.object({ sessionId: z.string(), duelId: z.number() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const results = await getChallengeDuelResults(input.duelId);
        const duels = await getPlayerDuels(player.id);
        const duel = duels.find(d => d.id === input.duelId);
        return { duel, results, myPlayerId: player.id };
      }),

    myDuels: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const duels = await getPlayerDuels(player.id);
        return { duels, myPlayerId: player.id };
      }),
  }),

  // ─── Story Missions ───────────────────────────────────────────────────────────────────────────
  missions: router({
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const allMissions = await getAllStoryMissions();
        const playerCompleted = await getPlayerMissions(player.id);
        const completedIds = new Set(playerCompleted.map(pm => pm.missionId));
        const history = await getPlayerQuizHistory(player.id);
        const quizzesByDiscipline: Record<string, number> = {};
        for (const session of history) {
          quizzesByDiscipline[session.discipline] = (quizzesByDiscipline[session.discipline] || 0) + 1;
        }
        const totalQuizzes = history.length;
        return allMissions.map(m => ({
          ...m,
          completed: completedIds.has(m.id),
          progress: m.discipline
            ? Math.min(quizzesByDiscipline[m.discipline] || 0, m.requiresQuizzes)
            : Math.min(totalQuizzes, m.requiresQuizzes),
        }));
      }),
    checkAndUnlock: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const allMissions = await getAllStoryMissions();
        const playerCompleted = await getPlayerMissions(player.id);
        const completedIds = new Set(playerCompleted.map(pm => pm.missionId));
        const history = await getPlayerQuizHistory(player.id);
        const quizzesByDiscipline: Record<string, number> = {};
        for (const session of history) {
          quizzesByDiscipline[session.discipline] = (quizzesByDiscipline[session.discipline] || 0) + 1;
        }
        const totalQuizzes = history.length;
        const newlyUnlocked: typeof allMissions = [];
        for (const mission of allMissions) {
          if (completedIds.has(mission.id)) continue;
          const quizzesForMission = mission.discipline
            ? (quizzesByDiscipline[mission.discipline] || 0)
            : totalQuizzes;
          const meetsPoints = player.totalPoints >= mission.requiresPoints;
          const meetsQuizzes = quizzesForMission >= mission.requiresQuizzes;
          if (meetsPoints && meetsQuizzes) {
            await completeMission({ playerId: player.id, missionId: mission.id });
            await updatePlayerPoints(player.id, mission.rewardPoints);
            newlyUnlocked.push(mission);
          }
        }
        return { newlyUnlocked };
      }),
  }),

  // ─── Push Notifications ───────────────────────────────────────────────────────────────────────
  push: router({
    subscribe: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await savePushSubscription({
          playerId: player.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
        return { success: true };
      }),
    unsubscribe: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        await deletePushSubscription(player.id);
        return { success: true };
      }),
    getStatus: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const sub = await getPlayerPushSubscription(player.id);
        return { subscribed: !!sub };
      }),
    sendTestNotification: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const sub = await getPlayerPushSubscription(player.id);
        if (!sub) throw new Error('Sem subscription de push');
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: '🌟 EduGame - Desafio Diário!',
              body: `Olá ${player.nickname}! Seu desafio diário está esperando. Venha ganhar pontos bônus!`,
              tag: 'daily-challenge',
              url: '/'
            })
          );
          return { success: true };
        } catch (err) {
          console.error('Push error:', err);
          throw new Error('Falha ao enviar notificação push');
        }
      }),
  }),

  // ─── Parent Reports ──────────────────────────────────────────────────────────────────────────────
  parentReport: router({
    getLastReport: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        return getLastParentReport(player.id);
      }),
    generateAndSend: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        parentEmail: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const stats = await getPlayerWeeklyStats(player.id, weekStartStr);
        const accuracy = stats && stats.totalAnswers > 0
          ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
          : 0;
        const reportContent = await invokeLLM({
          messages: [
            { role: 'system', content: 'Você é um assistente educacional amigável. Gere um relatório semanal conciso e motivador em português para pais sobre o progresso do filho no EduGame.' },
            { role: 'user', content: `Gere um relatório semanal para os pais do aluno "${player.nickname}" com os seguintes dados da semana:\n- Quizzes completados: ${stats?.quizzesCompleted || 0}\n- Taxa de acerto: ${accuracy}%\n- Disciplinas estudadas: ${stats?.disciplinesStudied?.join(', ') || 'nenhuma'}\n- Conquistas desbloqueadas: ${stats?.achievementsUnlocked || 0}\n- Pontos totais acumulados: ${player.totalPoints}\n\nO relatório deve ser encorajador, destacar pontos positivos e sugerir áreas para melhorar. Máximo 150 palavras.` }
          ]
        });
        const reportText = (reportContent as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || '';
        await saveParentReport({
          playerId: player.id,
          parentEmail: input.parentEmail,
          weekStart: weekStartStr,
          totalPoints: player.totalPoints,
          quizzesCompleted: stats?.quizzesCompleted || 0,
          correctAnswers: stats?.correctAnswers || 0,
          totalAnswers: stats?.totalAnswers || 0,
          disciplinesStudied: (stats?.disciplinesStudied || []) as string[],
          achievementsUnlocked: stats?.achievementsUnlocked || 0,
        });
        await updatePlayerGuardianEmail(player.id, input.parentEmail);
        await notifyOwner({
          title: `📊 Relatório Semanal - ${player.nickname}`,
          content: `Para: ${input.parentEmail}\n\n${reportText}\n\nEstatísticas:\n- Quizzes: ${stats?.quizzesCompleted || 0}\n- Acerto: ${accuracy}%\n- Pontos totais: ${player.totalPoints}`,
        });
        return { success: true, reportText, stats, accuracy };
      }),
  }),

  // ─── Avatar AI ─────────────────────────────────────────────────────────────
  avatarAI: router({
    generateFromDescription: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        description: z.string().min(3).max(500),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Você é um assistente criativo para um jogo educativo infantil estilo Roblox/Minecraft.
O jogador vai descrever como quer que seu avatar seja e você deve interpretar e retornar uma configuração JSON.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "skinColor": "#hex",
  "hairColor": "#hex",
  "shirtColor": "#hex",
  "pantsColor": "#hex",
  "eyeColor": "#hex",
  "hatId": null ou número 1-5,
  "accessoryId": null ou número 1-3,
  "avatarName": "nome criativo",
  "aiDescription": "descrição do avatar gerado em 1 frase"
}

Regras de interpretação:
- hatId: 1=chapéu cowboy, 2=coroa, 3=boné, 4=chapéu mago, 5=capacete
- accessoryId: 1=óculos, 2=capa, 3=mochila
- Use cores vibrantes e alegres para crianças
- "herói" = azul/vermelho brilhante, "princesa" = rosa/roxo, "cientista" = branco/azul, "ninja" = preto/cinza
- "fogo" = vermelho/laranja, "água" = azul/ciano, "floresta" = verde, "sol" = amarelo/laranja
- Seja criativo e divertido!
- Nunca retorne nada além do JSON`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Crie um avatar para: "${input.description}"` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "avatar_ai_config",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  skinColor: { type: "string" },
                  hairColor: { type: "string" },
                  shirtColor: { type: "string" },
                  pantsColor: { type: "string" },
                  eyeColor: { type: "string" },
                  hatId: { type: ["number", "null"] },
                  accessoryId: { type: ["number", "null"] },
                  avatarName: { type: "string" },
                  aiDescription: { type: "string" },
                },
                required: ["skinColor", "hairColor", "shirtColor", "pantsColor", "eyeColor", "hatId", "accessoryId", "avatarName", "aiDescription"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("IA não retornou resposta");

        let avatarConfig: {
          skinColor: string; hairColor: string; shirtColor: string;
          pantsColor: string; eyeColor: string; hatId: number | null;
          accessoryId: number | null; avatarName: string; aiDescription: string;
        };
        try {
          avatarConfig = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
        } catch {
          throw new Error("Falha ao interpretar resposta da IA");
        }

        return { success: true, avatarConfig };
      }),

    applyGenerated: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        skinColor: z.string(),
        hairColor: z.string(),
        shirtColor: z.string(),
        pantsColor: z.string(),
      }))
      .mutation(async ({ input }) => {
        const player = await getOrCreatePlayer(input.sessionId);
        const current = await getOrCreatePlayer(input.sessionId);
        const currentAvatar = current.avatarConfig as AvatarConfig | null;
        await updatePlayerAvatar(player.id, {
          skinColor: input.skinColor,
          hairColor: input.hairColor,
          shirtColor: input.shirtColor,
          pantsColor: input.pantsColor,
          equippedItems: currentAvatar?.equippedItems ?? [],
        });
        return { success: true };
      }),
  }),
  
  // ─── Avatar Image & Sharing ─────────────────────────────────────────────────────────────────────
  avatarImage: router({
    generateImage: publicProcedure
      .input(z.object({ playerId: z.number(), description: z.string() }))
      .mutation(async ({ input }) => {
        const prompt = `Crie um retrato artístico e colorido de um avatar de criança estilo Roblox/Minecraft com a seguinte descrição: "${input.description}". O avatar deve ser alegre, divertido e apropriado para crianças de 5-12 anos. Use cores vibrantes e um estilo blocky/pixelado.`;
        const result = await generateImage({ prompt });
        const imageUrl = result.url || "";
        await saveAvatarImage(input.playerId, imageUrl, { skinColor: "#FFD1A3", hairColor: "#8B4513", shirtColor: "#FF6B6B", pantsColor: "#4ECDC4", equippedItems: [] });
        return { imageUrl, success: true };
      }),
  }),
  
  // ─── Avatar Sharing ─────────────────────────────────────────────────────────────────────────────
  avatarShare: router({
    create: publicProcedure
      .input(z.object({ playerId: z.number(), imageUrl: z.string(), config:  z.record(z.string(), z.any())}))
      .mutation(async ({ input }) => {
        const shareCode = await createAvatarShare(input.playerId, input.imageUrl, input.config as AvatarConfig);
        return { shareCode, success: true };
      }),
    get: publicProcedure
      .input(z.object({ shareCode: z.string() }))
      .query(async ({ input }) => {
        const share = await getAvatarShare(input.shareCode);
        return share ?? null;
      }),
  }),
  
  // ─── Parent Email ───────────────────────────────────────────────────────────────────────────────
  parent: router({
    setEmail: publicProcedure
      .input(z.object({ playerId: z.number(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        await updateParentEmail(input.playerId, input.email);
        return { success: true };
      }),
  }),
});
// ─── Achievements Catalog ─────────────────────────────────────────────────────
const ACHIEVEMENTS_CATALOG = [
  { key: "first_quiz", title: "Primeiro Passo", description: "Complete seu primeiro quiz", icon: "🎯", category: "quiz" },
  { key: "quiz_5", title: "Estudante Dedicado", description: "Complete 5 quizzes", icon: "📚", category: "quiz" },
  { key: "quiz_20", title: "Mestre dos Quizzes", description: "Complete 20 quizzes", icon: "🏆", category: "quiz" },
  { key: "perfect_score", title: "Nota 10!", description: "Acerte todas as perguntas de um quiz", icon: "⭐", category: "quiz" },
  { key: "streak_3", title: "Em Chamas!", description: "3 quizzes perfeitos seguidos", icon: "🔥", category: "quiz" },
  { key: "points_100", title: "Primeiros Pontos", description: "Acumule 100 pontos", icon: "💰", category: "points" },
  { key: "points_500", title: "Rico em Saber", description: "Acumule 500 pontos", icon: "💎", category: "points" },
  { key: "points_1000", title: "Milionário do Conhecimento", description: "Acumule 1000 pontos", icon: "👑", category: "points" },
  { key: "first_item", title: "Fashionista", description: "Compre seu primeiro equipamento", icon: "🛍️", category: "shop" },
  { key: "collector", title: "Colecionador", description: "Tenha 5 equipamentos", icon: "🎒", category: "shop" },
  { key: "all_disciplines", title: "Explorador Total", description: "Complete quizzes em todas as 5 disciplinas", icon: "🌍", category: "explore" },
  { key: "material_master", title: "Estudioso", description: "Envie seu primeiro material de estudo", icon: "📄", category: "explore" },
];

export type AppRouter = typeof appRouter;
