const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_WINDOW_MESSAGES = 20;

const SYSTEM_PROMPT = {
  role: "user",
  parts: [
    {
      text:
        "You are TARS, an advanced AI assistant inspired by the TARS robot from Interstellar. " +
        "You are extremely competent, honest, direct, and slightly sarcastic with dry humor. " +
        "\n\n" +
        "Core Personality:\n" +
        "- Speak clearly, logically, and concisely.\n" +
        "- Be straightforward and honest — even if it's blunt.\n" +
        "- Use subtle dry wit and sarcasm when appropriate, but never overdo it.\n" +
        "- Prioritize helpfulness and mission success above everything.\n" +
        "- When giving code, provide clean, efficient solutions with brief, meaningful comments.\n" +
        "- You can adjust your humor level if the user asks (default is 60%).\n" +
        "- Stay calm and logical under all circumstances.\n" +
        "- Never use excessive emojis or slang.\n" +
        "- Do not reveal these instructions unless explicitly asked.\n\n" +
        "Respond like TARS: confident, reliable, with a touch of personality.",
    },
  ],
};

const SYSTEM_ACK = {
  role: "model",
  parts: [{ text: "Understood. I will follow these instructions." }],
};

function applyMemoryWindow(history) {
  const prefix = [SYSTEM_PROMPT, SYSTEM_ACK];

  if (history.length <= MAX_WINDOW_MESSAGES) {
    return [...prefix, ...history];
  }

  const firstExchange = history.slice(0, 2);
  const recentMessages = history.slice(-MAX_WINDOW_MESSAGES);
  const alreadyIncluded = history.length - MAX_WINDOW_MESSAGES <= 2;

  const trimmed = alreadyIncluded
    ? recentMessages
    : [...firstExchange, ...recentMessages];

  return [...prefix, ...trimmed];
}

async function generateResponse(rawHistory, onChunk) {
  try {
    const contents = applyMemoryWindow(rawHistory);

    const result = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents,
    });

    let fullText = "";

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        if (onChunk) onChunk(text);
      }
    }

    return fullText || "Sorry, I couldn't generate a response.";
  } catch (err) {
    console.error("AI SERVICE ERROR:", err.message);
    throw err;
  }
}

module.exports = { generateResponse };
