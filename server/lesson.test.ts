import { describe, it, expect, vi, beforeEach } from "vitest";
import { lessonRouter } from "./routers-lesson";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

// Mock dependencies
vi.mock("./_core/llm");
vi.mock("./_core/imageGeneration");

describe("Lesson Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate lesson video with correct structure", async () => {
    // Mock LLM response
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Introdução à Matemática",
              points: [
                {
                  duration: 20,
                  text: "Olá! Hoje vamos aprender sobre números.",
                  topic: "Introdução",
                },
                {
                  duration: 25,
                  text: "Os números naturais começam do zero.",
                  topic: "Números Naturais",
                },
                {
                  duration: 25,
                  text: "Podemos usar números para contar objetos.",
                  topic: "Contagem",
                },
                {
                  duration: 20,
                  text: "Resumindo, números são fundamentais.",
                  topic: "Resumo",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValueOnce(mockLLMResponse as any);

    // Mock image generation
    vi.mocked(generateImage).mockResolvedValue({
      url: "https://example.com/image.png",
    } as any);

    // Call the procedure
    const caller = lessonRouter.createCaller({} as any);
    const result = await caller.generateLessonVideo({
      discipline: "matematica",
      grade: 6,
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.lesson).toBeDefined();
    expect(result.lesson.title).toBe("Introdução à Matemática");
    expect(result.lesson.discipline).toBe("matematica");
    expect(result.lesson.grade).toBe(6);
    expect(result.lesson.duration).toBe(120);
    expect(result.lesson.points).toHaveLength(4);
    expect(result.lesson.images).toHaveLength(4);

    // Verify LLM was called with correct parameters
    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("2-minute lesson script"),
          }),
        ]),
      })
    );
  });

  it("should handle LLM parsing errors gracefully", async () => {
    // Mock invalid LLM response
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Invalid JSON",
          },
        },
      ],
    } as any);

    const caller = lessonRouter.createCaller({} as any);
    const result = await caller.generateLessonVideo({
      discipline: "portugues",
      grade: 5,
    });

    expect(result).toBeDefined();
    expect(result.error).toBe("Failed to generate lesson script");
  });

  it("should generate images for each lesson point", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Ciências",
              points: [
                {
                  duration: 30,
                  text: "Vamos aprender sobre ecossistemas.",
                  topic: "Ecossistemas",
                },
                {
                  duration: 30,
                  text: "Cada animal tem seu papel.",
                  topic: "Cadeia Alimentar",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValueOnce(mockLLMResponse as any);
    vi.mocked(generateImage).mockResolvedValue({
      url: "https://example.com/image.png",
    } as any);

    const caller = lessonRouter.createCaller({} as any);
    const result = await caller.generateLessonVideo({
      discipline: "ciencias",
      grade: 6,
    });

    expect(result.success).toBe(true);
    expect(result.lesson.images).toHaveLength(2);
    expect(generateImage).toHaveBeenCalledTimes(2);
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Ecossistemas"),
      })
    );
  });

  it("should handle image generation failures gracefully", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "História",
              points: [
                {
                  duration: 30,
                  text: "Vamos aprender sobre o Egito Antigo.",
                  topic: "Egito Antigo",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValueOnce(mockLLMResponse as any);
    vi.mocked(generateImage).mockRejectedValueOnce(new Error("API Error"));

    const caller = lessonRouter.createCaller({} as any);
    const result = await caller.generateLessonVideo({
      discipline: "historia",
      grade: 6,
    });

    expect(result.success).toBe(true);
    expect(result.lesson.images[0].url).toBe(""); // Fallback empty string
  });

  it("should respect grade level in lesson generation", async () => {
    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Português",
              points: [
                {
                  duration: 20,
                  text: "Vamos aprender sobre vogais.",
                  topic: "Vogais",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValueOnce(mockLLMResponse as any);
    vi.mocked(generateImage).mockResolvedValue({
      url: "https://example.com/image.png",
    } as any);

    const caller = lessonRouter.createCaller({} as any);
    await caller.generateLessonVideo({
      discipline: "portugues",
      grade: 3,
    });

    // Verify grade was passed to LLM
    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("grade 3"),
          }),
        ]),
      })
    );
  });
});
