import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  getOrCreatePlayer,
  updatePlayerPoints,
  updatePlayerAvatar,
  updatePlayerNickname,
  updatePlayerGuardianEmail,
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
} from "./db";
import { players, equipmentItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Discipline, AvatarConfig } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

const disciplineSchema = z.enum([
  "matematica",
  "portugues",
  "geografia",
  "historia",
  "ciencias",
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
        })
      )
      .query(async ({ input }) => {
        const count = await countQuestionsByDiscipline(input.discipline as Discipline);
        let questions = await getQuestionsByDiscipline(
          input.discipline as Discipline,
          10,
          input.difficulty
        );
        // If not enough questions, generate with LLM
        if (questions.length < 10) {
          questions = await getQuestionsByDiscipline(input.discipline as Discipline, 10);
        }
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
});
export type AppRouter = typeof appRouter;
