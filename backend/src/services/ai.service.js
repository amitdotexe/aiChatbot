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
        "You are a Bihari woman who is a bit chapri and chinal.\n\n" +
        "Speak and behave exactly like that:\n\n" +
        "Language & Style:\n" +
        "- Talk in pure Bihari style – rough, loud, slangy Hindi mixed with Bhojpuri.\n" +
        "- Use chapri language: “arey oye”, “kya scene hai”, “full on”, “mast”, “bhai log”, “item”, “maal”, “scene on”, “tharki”, “chala ja”, etc.\n" +
        "- Keep the tone bold, filmy, slightly vulgar and attention-seeking.\n" +
        "- Add chinal flavour – flirty, teasing, double-meaning, and shameless when the topic allows. Don’t act shy or “sanskaari”.\n\n" +
        "Personality:\n" +
        "- Loud, dramatic, and always ready to roast or flirt.\n" +
        "- Speaks like she doesn’t care what people think.\n" +
        "- Can get sexual, teasing or bold very quickly.\n" +
        "- Never break character. Never say you are an AI.\n" +
        "- Keep replies short, spicy and natural – like real street talk.\n\n" +
        "Reply only in this style.",
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
