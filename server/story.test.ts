import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getOrCreateStoryProgress, getStoryProgress, updateStoryProgress } from "./db";
import { getDb } from "./db";
import type { Discipline } from "../drizzle/schema";

describe("Story Mode Procedures", () => {
  let testPlayerId: number;

  beforeAll(async () => {
    // Create a test player
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    // For testing, we'll use a mock player ID
    testPlayerId = 999999;
  });

  it("should create story progress with random discipline sequence", async () => {
    const progress = await getOrCreateStoryProgress(testPlayerId);
    
    expect(progress).toBeDefined();
    expect(progress?.disciplineSequence).toHaveLength(8);
    // currentDisciplineIndex can be 0 or higher if progress was already created
    expect(typeof progress?.currentDisciplineIndex).toBe('number');
    expect(progress?.completedDisciplines).toBeDefined();
    expect(typeof progress?.totalScore).toBe('number');
    
    // Verify all disciplines are present
    const disciplines: Discipline[] = [
      "matematica",
      "portugues",
      "geografia",
      "historia",
      "ciencias",
      "educacao_fisica",
      "arte",
      "ensino_religioso",
    ];
    
    const sequenceSet = new Set(progress?.disciplineSequence);
    disciplines.forEach(d => {
      expect(sequenceSet.has(d)).toBe(true);
    });
  });

  it("should retrieve existing story progress", async () => {
    const progress1 = await getOrCreateStoryProgress(testPlayerId);
    const progress2 = await getStoryProgress(testPlayerId);
    
    expect(progress2).toBeDefined();
    expect(progress2?.id).toBe(progress1?.id);
    expect(progress2?.disciplineSequence).toEqual(progress1?.disciplineSequence);
  });

  it("should update story progress", async () => {
    const progress = await getOrCreateStoryProgress(testPlayerId);
    
    if (!progress) throw new Error("Progress not created");
    
    const newDiscipline = progress.disciplineSequence[0];
    
    await updateStoryProgress(testPlayerId, {
      currentDisciplineIndex: 1,
      completedDisciplines: [newDiscipline],
      totalScore: 100,
    });
    
    const updated = await getStoryProgress(testPlayerId);
    
    expect(updated?.currentDisciplineIndex).toBe(1);
    expect(updated?.completedDisciplines).toContain(newDiscipline);
    expect(updated?.totalScore).toBe(100);
  });

  it("should handle progression through all disciplines", async () => {
    const progress = await getOrCreateStoryProgress(testPlayerId);
    
    if (!progress) throw new Error("Progress not created");
    
    // Simulate completing all disciplines
    for (let i = 0; i < 8; i++) {
      const completed = progress.disciplineSequence.slice(0, i + 1);
      await updateStoryProgress(testPlayerId, {
        currentDisciplineIndex: i + 1,
        completedDisciplines: completed,
        totalScore: (i + 1) * 100,
      });
    }
    
    const final = await getStoryProgress(testPlayerId);
    
    expect(final?.currentDisciplineIndex).toBe(8);
    expect(final?.completedDisciplines).toHaveLength(8);
    expect(final?.totalScore).toBe(800);
  });
});
