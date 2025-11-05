// Integration with OpenAI AI Integrations - reference: javascript_openai_ai_integrations blueprint
import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ModerationResult {
  isViolation: boolean;
  violationType: string;
  confidenceScore: number;
  reasoning: string;
}

export async function analyzeMessage(
  message: string,
  sensitivity: string
): Promise<ModerationResult> {
  const sensitivityPrompts = {
    low: "Only flag very obvious and severe violations that are clearly harmful.",
    medium: "Flag moderate violations including toxicity, harassment, spam, and inappropriate content.",
    high: "Flag violations more strictly, including subtle forms of harassment and borderline content.",
    strict: "Maximum sensitivity - flag any potentially problematic content, erring on the side of caution.",
  };

  const prompt = `You are a content moderation AI for Discord servers. Analyze this message for rule violations.

Sensitivity Level: ${sensitivity.toUpperCase()}
Guideline: ${sensitivityPrompts[sensitivity as keyof typeof sensitivityPrompts]}

Message to analyze: "${message}"

Evaluate if this message violates community guidelines. Consider:
- Toxicity (hostile, rude, disrespectful language)
- Harassment (targeted attacks, bullying)
- Spam (repetitive, promotional, off-topic)
- Inappropriate content (sexual content, graphic violence)
- Hate speech (discrimination, slurs, extremism)

Respond in JSON format:
{
  "isViolation": boolean,
  "violationType": "toxicity" | "harassment" | "spam" | "inappropriate" | "hate_speech" | "none",
  "confidenceScore": number (0-100),
  "reasoning": "brief explanation of why this is or isn't a violation"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      isViolation: result.isViolation || false,
      violationType: result.violationType || "none",
      confidenceScore: result.confidenceScore || 0,
      reasoning: result.reasoning || "No violation detected",
    };
  } catch (error) {
    console.error("Error analyzing message:", error);
    return {
      isViolation: false,
      violationType: "none",
      confidenceScore: 0,
      reasoning: "Error analyzing message",
    };
  }
}
