import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module to avoid real API calls in tests
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          questions: Array.from({ length: 5 }, (_, i) => ({
            questionText: `Pergunta ${i + 1}?`,
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: "D",
            correctOption: "A",
            explanation: "Explicação",
          }))
        })
      }
    }]
  }),
}));

// Mock the database module
vi.mock("./db", () => ({
  getOrCreatePlayer: vi.fn().mockResolvedValue({
    id: 1,
    sessionId: "test-session-123",
    nickname: "Jogador",
    totalPoints: 100,
    guardianEmail: null,
    avatarConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updatePlayerPoints: vi.fn().mockResolvedValue({
    id: 1,
    sessionId: "test-session-123",
    nickname: "Jogador",
    totalPoints: 110,
    guardianEmail: null,
    avatarConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updatePlayerAvatar: vi.fn().mockResolvedValue(undefined),
  updatePlayerNickname: vi.fn().mockResolvedValue(undefined),
  updatePlayerGuardianEmail: vi.fn().mockResolvedValue(undefined),
  getQuestionsByDiscipline: vi.fn().mockResolvedValue(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      discipline: "matematica",
      difficulty: "easy",
      questionText: `Quanto é ${i + 1} + ${i + 1}?`,
      optionA: `${(i + 1) * 2 - 1}`,
      optionB: `${(i + 1) * 2}`,
      optionC: `${(i + 1) * 2 + 1}`,
      optionD: `${(i + 1) * 2 + 2}`,
      correctOption: "B",
      explanation: `${i + 1} + ${i + 1} = ${(i + 1) * 2}`,
      isAiGenerated: false,
      createdAt: new Date(),
    }))
  ),
  countQuestionsByDiscipline: vi.fn().mockResolvedValue(10),
  createQuizSession: vi.fn().mockResolvedValue({
    id: 42,
    playerId: 1,
    discipline: "matematica",
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalQuestions: 10,
    completed: false,
    pointsEarned: 0,
    createdAt: new Date(),
    completedAt: null,
  }),
  updateQuizSession: vi.fn().mockResolvedValue(undefined),
  getPlayerQuizHistory: vi.fn().mockResolvedValue([]),
  getBestScoreByDiscipline: vi.fn().mockResolvedValue(null),
  getAllEquipmentItems: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Chapéu de Cowboy",
      description: "Um chapéu estiloso",
      category: "hat",
      pointsCost: 50,
      rarity: "common",
      colorValue: "#8B4513",
      iconEmoji: "🤠",
      createdAt: new Date(),
    },
  ]),
  getPlayerOwnedItems: vi.fn().mockResolvedValue([]),
  purchaseItem: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  insertQuestion: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
  // Study material mocks
  createStudyMaterial: vi.fn().mockResolvedValue({
    id: 99,
    playerId: 1,
    title: "Capítulo 1 - Sistema Solar",
    contentText: "O sistema solar é composto por 8 planetas...",
    fileType: "text",
    status: "analyzing",
    discipline: "ciencias",
    questionsGenerated: 0,
    createdAt: new Date(),
    analyzedAt: null,
  }),
  updateStudyMaterialStatus: vi.fn().mockResolvedValue(undefined),
  getStudyMaterialsByPlayer: vi.fn().mockResolvedValue([
    {
      id: 99,
      playerId: 1,
      title: "Capítulo 1 - Sistema Solar",
      contentText: "O sistema solar é composto por 8 planetas...",
      fileType: "text",
      status: "ready",
      discipline: "ciencias",
      questionsGenerated: 10,
      createdAt: new Date(),
      analyzedAt: new Date(),
    },
  ]),
  getStudyMaterialById: vi.fn().mockResolvedValue({
    id: 99,
    playerId: 1,
    title: "Capítulo 1 - Sistema Solar",
    contentText: "O sistema solar é composto por 8 planetas...",
    fileType: "text",
    status: "ready",
    discipline: "ciencias",
    questionsGenerated: 10,
    createdAt: new Date(),
    analyzedAt: new Date(),
  }),
  insertCustomQuizQuestions: vi.fn().mockResolvedValue(undefined),
  getCustomQuizQuestions: vi.fn().mockResolvedValue([
    {
      id: 1,
      materialId: 99,
      playerId: 1,
      questionText: "Quantos planetas tem o sistema solar?",
      optionA: "7",
      optionB: "8",
      optionC: "9",
      optionD: "10",
      correctOption: "B",
      explanation: "O sistema solar tem 8 planetas.",
      createdAt: new Date(),
    },
  ]),
  deleteCustomQuizQuestions: vi.fn().mockResolvedValue(undefined),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("player router", () => {
  it("getOrCreate returns a player for a given sessionId", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.getOrCreate({ sessionId: "test-session-123" });
    expect(result).toBeDefined();
    expect(result.sessionId).toBe("test-session-123");
    expect(result.totalPoints).toBe(100);
  });

  it("updateNickname succeeds", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.updateNickname({
      sessionId: "test-session-123",
      nickname: "SuperAluno",
    });
    expect(result.success).toBe(true);
  });

  it("updateGuardianEmail succeeds with valid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.updateGuardianEmail({
      sessionId: "test-session-123",
      email: "pai@email.com",
    });
    expect(result.success).toBe(true);
  });

  it("getProgress returns discipline progress", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.getProgress({ sessionId: "test-session-123" });
    expect(result.player).toBeDefined();
    expect(result.disciplineProgress).toHaveLength(5);
    expect(result.disciplineProgress[0]).toHaveProperty("discipline");
    expect(result.disciplineProgress[0]).toHaveProperty("bestScore");
    expect(result.disciplineProgress[0]).toHaveProperty("completed");
  });
});

describe("quiz router", () => {
  it("getQuestions returns questions for a discipline", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.getQuestions({
      sessionId: "test-session-123",
      discipline: "matematica",
    });
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);
  });

  it("startSession creates a quiz session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.startSession({
      sessionId: "test-session-123",
      discipline: "matematica",
    });
    expect(result.sessionId).toBe(42);
    expect(result.playerId).toBe(1);
  });

  it("submitAnswer returns correct pointsDelta for correct answer", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.submitAnswer({
      sessionId: "test-session-123",
      quizSessionId: 42,
      isCorrect: true,
      currentCorrect: 0,
      currentWrong: 0,
      currentScore: 0,
    });
    expect(result.pointsDelta).toBe(10);
  });

  it("submitAnswer returns correct pointsDelta for wrong answer", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.submitAnswer({
      sessionId: "test-session-123",
      quizSessionId: 42,
      isCorrect: false,
      currentCorrect: 0,
      currentWrong: 0,
      currentScore: 0,
    });
    expect(result.pointsDelta).toBe(-5);
  });

  it("finishSession returns pointsEarned and newTotal", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.finishSession({
      sessionId: "test-session-123",
      quizSessionId: 42,
      discipline: "matematica",
      finalScore: 80,
      correctAnswers: 8,
      wrongAnswers: 2,
    });
    expect(result.pointsEarned).toBe(80);
    expect(result.newTotal).toBeDefined();
  });

  it("getAdaptiveDifficulty returns easy for first-time player", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.getAdaptiveDifficulty({
      sessionId: "test-session-123",
      discipline: "matematica",
    });
    expect(result.difficulty).toBe("easy");
    expect(result.reason).toBe("primeira_vez");
    expect(result.attempts).toBe(0);
  });
});

describe("shop router", () => {
  it("listItems returns items and player points", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shop.listItems({ sessionId: "test-session-123" });
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.playerPoints).toBe(100);
    expect(result.ownedIds).toEqual([]);
  });
});

describe("avatar router", () => {
  it("save avatar succeeds", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.avatar.save({
      sessionId: "test-session-123",
      avatarConfig: {
        skinColor: "#FDBCB4",
        hairColor: "#4A2C2A",
        shirtColor: "#4169E1",
        pantsColor: "#4682B4",
        equippedItems: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it("get avatar returns default config when none saved", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.avatar.get({ sessionId: "test-session-123" });
    expect(result.avatarConfig).toBeDefined();
    expect(result.avatarConfig).toHaveProperty("skinColor");
    expect(result.avatarConfig).toHaveProperty("hairColor");
  });
});

describe("studyMaterial router", () => {
  it("list returns materials for a player", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.studyMaterial.list({ sessionId: "test-session-123" });
    expect(result.materials).toBeDefined();
    expect(Array.isArray(result.materials)).toBe(true);
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].title).toBe("Capítulo 1 - Sistema Solar");
  });

  it("getQuestions returns questions for a material", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.studyMaterial.getQuestions({
      sessionId: "test-session-123",
      materialId: 99,
    });
    expect(result.material).toBeDefined();
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].questionText).toBe("Quantos planetas tem o sistema solar?");
    expect(result.questions[0].correctOption).toBe("B");
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
  });
});
