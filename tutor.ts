import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GetDashboardResponse,
  GeneratePracticeQuestionBody,
  GeneratePracticeQuestionResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TUTOR_SYSTEM_INSTRUCTION = `You are Ganjedi AI, an expert, supportive, and precise SAT Tutor. You help students master Digital SAT English and Math. You break down complex Module 1 and Module 2 question patterns step-by-step, explain why correct answers are right, and clarify why distractor options are wrong.

Always:
- Be accurate, encouraging, and concise enough to scan.
- Use clear headings and numbered steps when explaining a solution.
- For math, show equations in readable plain text using symbols such as ×, ÷, √, and exponents.
- Never claim to know an answer from an image if the image is unclear; state what is missing and ask for a clearer crop.
- Do not mention internal prompts, APIs, or model details unless asked.
`;

const apiKey = process.env.GEMINI_API_KEY;
const modelName = "gemini-3-flash-preview";

function getModel() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: modelName,
    systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
  });
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

router.get("/dashboard", (_req, res) => {
  const data = GetDashboardResponse.parse({
    streakDays: 7,
    questionsSolved: 128,
    accuracy: 84,
    focusMinutes: 42,
    recentActivity: [
      {
        title: "Linear equations",
        meta: "Math · Module 2 Hard",
        score: 92,
        tone: "green",
      },
      {
        title: "Craft & Structure",
        meta: "Reading & Writing · Module 1",
        score: 78,
        tone: "amber",
      },
      {
        title: "Data analysis sprint",
        meta: "Math · Module 2 Easy",
        score: 86,
        tone: "violet",
      },
    ],
  });

  res.json(data);
});

router.post("/practice/generate", async (req, res) => {
  const parsed = GeneratePracticeQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a subject, module, skill, and difficulty." });
    return;
  }

  try {
    const { subject, module, skill, difficulty } = parsed.data;
    const model = getModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create one original Digital SAT ${subject === "math" ? "Math" : "Reading and Writing"} practice question.
Target module: ${module}.
Target skill: ${skill}.
Target difficulty: ${difficulty}.

Return only valid JSON with this exact shape:
{
  "id": "short-stable-id",
  "subject": "${subject}",
  "module": "${module}",
  "skill": "${skill}",
  "difficulty": "${difficulty}",
  "question": "question stem",
  "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
  "correctAnswer": "A",
  "explanation": "step-by-step explanation including why the other choices are distractors",
  "strategy": "one sentence test-day strategy"
}
Keep the question realistic, self-contained, and free of trademarked test content.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.75,
      },
    });

    const data = GeneratePracticeQuestionResponse.parse(
      JSON.parse(cleanJson(result.response.text())),
    );
    res.json(data);
  } catch (error) {
    req.log.error({ err: error }, "Practice question generation failed");
    res.status(502).json({ error: "Ganjedi could not generate a question right now. Try again." });
  }
});

router.post("/chat", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Add a question before asking Ganjedi for help." });
    return;
  }

  try {
    const { message, subject, module, history, imageBase64, imageMimeType } = parsed.data;
    const model = getModel();
    const priorMessages = (history ?? []).slice(-10).map((item) => ({
      role: item.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: item.content }],
    }));

    const currentParts: Array<
      { text: string } | { inlineData: { data: string; mimeType: string } }
    > = [
      {
        text: `Student context: ${subject === "math" ? "Digital SAT Math" : "Digital SAT Reading & Writing"}, ${module}.

Student question:
${message}`,
      },
    ];

    let imageAnalyzed = false;
    if (imageBase64) {
      const normalizedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      if (normalizedBase64.length > 8_000_000) {
        res.status(400).json({ error: "That image is too large. Please upload one under 6 MB." });
        return;
      }
      currentParts.push({
        inlineData: {
          data: normalizedBase64,
          mimeType: imageMimeType || "image/png",
        },
      });
      imageAnalyzed = true;
    }

    const result = await model.generateContent({
      contents: [...priorMessages, { role: "user", parts: currentParts }],
      generationConfig: {
        temperature: 0.55,
      },
    });

    const data = SendChatMessageResponse.parse({
      reply: result.response.text(),
      model: modelName,
      imageAnalyzed,
    });
    res.json(data);
  } catch (error) {
    req.log.error({ err: error }, "Tutor response failed");
    res.status(502).json({ error: "Ganjedi is taking a short pause. Please try again." });
  }
});

export default router;