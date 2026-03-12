import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

export const lessonRouter = router({
  generateLessonVideo: publicProcedure
    .input(z.object({
      discipline: z.string(),
      grade: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { discipline, grade = 6 } = input;

      // Generate lesson script via LLM
      const scriptResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an experienced teacher creating a 2-minute lesson script for ${discipline}. The script should be engaging, clear, and appropriate for grade ${grade} students. Format: numbered points, each point ~15-20 seconds of speech.`,
          },
          {
            role: "user",
            content: `Create a 2-minute lesson script for ${discipline} (grade ${grade}). Include:
1. Hook/Introduction (15 sec)
2. Main concept 1 (25 sec)
3. Main concept 2 (25 sec)
4. Example/Application (25 sec)
5. Summary (15 sec)

Format as JSON with fields: title, points (array of {duration, text, topic})`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lesson_script",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                points: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      duration: { type: "number" },
                      text: { type: "string" },
                      topic: { type: "string" },
                    },
                    required: ["duration", "text", "topic"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "points"],
              additionalProperties: false,
            },
          },
        },
      });

      let scriptData;
      try {
        const content = scriptResponse.choices[0]?.message?.content;
        if (typeof content === "string") {
          scriptData = JSON.parse(content);
        }
      } catch (e) {
        console.error("Failed to parse lesson script", e);
        return { error: "Failed to generate lesson script" };
      }

      // Generate images for each point
      const images: Array<{ topic: string; url: string }> = [];
      for (const point of scriptData.points || []) {
        try {
          const imageResponse = await generateImage({
            prompt: `Educational illustration for ${discipline}: ${point.topic}. Simple, colorful, appropriate for grade ${grade} students.`,
          });
          images.push({
            topic: point.topic,
            url: imageResponse.url || "",
          });
        } catch (e) {
          // Fallback: use placeholder
          images.push({
            topic: point.topic,
            url: "",
          });
          console.error("Failed to generate image for", point.topic, e);
        }
      }

      return {
        success: true,
        lesson: {
          title: scriptData.title,
          discipline,
          grade,
          duration: 120, // 2 minutes in seconds
          points: scriptData.points,
          images,
        },
      };
    }),
});
