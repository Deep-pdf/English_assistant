// =========================================
// 0. EARLY ENV LOAD (VERY IMPORTANT)
// =========================================
import "dotenv/config";

// =========================================
// 1. IMPORTS
// =========================================
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// =========================================
// 2. BASIC CHECKPOINT: ENV VALIDATION
// =========================================
console.log("✅ CHECKPOINT 0: Server booting");

if (!process.env.SUPABASE_URL) {
  throw new Error("❌ SUPABASE_URL missing in .env");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY missing in .env");
}
if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing in .env");
}

console.log("✅ CHECKPOINT 1: Environment variables loaded");

// =========================================
// 3. APP SETUP
// =========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

console.log("✅ CHECKPOINT 2: Express initialized");

// =========================================
// 4. SUPABASE SERVER CLIENT
// =========================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("✅ CHECKPOINT 3: Supabase client initialized");

// =========================================
// 5. GEMINI SDK CLIENT (WORKING VERSION)
// =========================================
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log("✅ CHECKPOINT 3.5: Gemini SDK initialized");

// =========================================
// 6. FETCH CONVERSATION MESSAGES
// =========================================
async function getConversationMessages(conversationId, limit = 15) {
  console.log("➡️ CHECKPOINT 4: Fetching messages");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ CHECKPOINT 4 FAILED: Supabase fetch");
    console.error(error);
    throw error;
  }

  console.log("✅ CHECKPOINT 4 PASSED: Messages fetched =", data.length);
  return data.slice(-limit);
}

// =========================================
// 7. BUILD PROMPT FROM DB (SDK-FRIENDLY)
// =========================================
function buildPromptFromMessages(messages) {
  console.log("➡️ CHECKPOINT 5: Building Gemini prompt");

  let prompt = `
You are Madam July, an English interview tutor.
Ask interview questions, gently correct grammar,
and encourage the user.
`;

  for (const msg of messages) {
    if (msg.sender === "user") {
      prompt += `\nUser: ${msg.text}`;
    } else if (msg.sender === "bot") {
      prompt += `\nTutor: ${msg.text}`;
    }
  }

  console.log("✅ CHECKPOINT 5 PASSED: Prompt built");
  return prompt;
}

// =========================================
// 8. CHAT ENDPOINT
// =========================================
app.post("/api/chat", async (req, res) => {
  console.log("🟢 CHECKPOINT 6: /api/chat HIT");
  console.log("REQ BODY:", req.body);

  try {
    const { conversationId, userText } = req.body;

    // -------------------------------
    // VALIDATION
    // -------------------------------
    console.log("➡️ CHECKPOINT 7: Validating request");

    if (!conversationId || !userText || !userText.trim()) {
      console.error("❌ CHECKPOINT 7 FAILED: Invalid input");
      return res.status(400).json({ error: "Invalid input" });
    }

    console.log("✅ CHECKPOINT 7 PASSED");

    // -------------------------------
    // SAVE USER MESSAGE
    // -------------------------------
    console.log("➡️ CHECKPOINT 8: Saving user message");

    const { error: userErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender: "user",
        text: userText.trim(),
      });

    if (userErr) {
      console.error("❌ CHECKPOINT 8 FAILED");
      console.error(userErr);
      throw userErr;
    }

    console.log("✅ CHECKPOINT 8 PASSED");

    // -------------------------------
    // FETCH HISTORY
    // -------------------------------
    const messages = await getConversationMessages(conversationId);

    // -------------------------------
    // BUILD PROMPT
    // -------------------------------
    const prompt = buildPromptFromMessages(messages);

    console.log("➡️ CHECKPOINT 9: Sending to Gemini");

    // -------------------------------
    // GEMINI SDK CALL (STABLE)
    // -------------------------------
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const botText =
      response?.text ||
      "Sorry, could you repeat that?";

    console.log("➡️ CHECKPOINT 10: Bot reply:", botText);

    // -------------------------------
    // SAVE BOT MESSAGE
    // -------------------------------
    console.log("➡️ CHECKPOINT 11: Saving bot message");

    const { error: botErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender: "bot",
        text: botText,
      });

    if (botErr) {
      console.error("❌ CHECKPOINT 11 FAILED");
      console.error(botErr);
      throw botErr;
    }

    console.log("✅ CHECKPOINT 11 PASSED");

    // -------------------------------
    // RESPOND
    // -------------------------------
    console.log("✅ CHECKPOINT 12: Responding to frontend");
    res.json({ botText });

  } catch (err) {
    console.error("🔥 FINAL CRASH 🔥");
    console.error(err);

    res.json({
      botText:
        "Sorry, I'm having trouble generating a response right now. Please try again.",
    });
  }
});

// =========================================
// 9. HEALTH CHECK
// =========================================
app.get("/", (_, res) => {
  res.send("✅ Madam July backend running");
});

// =========================================
// 10. START SERVER
// =========================================
app.listen(PORT, () => {
  console.log(`🚀 CHECKPOINT FINAL: Server running on http://localhost:${PORT}`);
});
