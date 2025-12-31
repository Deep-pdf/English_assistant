// 1. Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

// 2. Initialize app
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 3. Supabase SERVER client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 4. Fetch recent messages
async function getConversationMessages(conversationId, limit = 15) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.slice(-limit);
}

// 5. Build Gemini REST contents
function buildGeminiContents(messages) {
  const contents = [];

  contents.push({
    role: "user",
    parts: [
      {
        text:
          "You are Madam July, an English interview tutor. Ask interview questions, gently correct grammar, and encourage the user."
      }
    ]
  });

  for (const msg of messages) {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    });
  }

  return contents;
}

// 6. Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { conversationId, userText } = req.body;

    if (!conversationId || !userText?.trim()) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender: "user",
      text: userText.trim()
    });

    // Fetch conversation history
    const messages = await getConversationMessages(conversationId);

    const contents = buildGeminiContents(messages);

    console.log("Sending to Gemini:", JSON.stringify(contents, null, 2));

    // 🔥 Gemini REST v1 call (THIS IS THE FIX)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const raw = await geminiRes.text();

    if (!geminiRes.ok) {
      console.error("Gemini error:", raw);
      throw new Error("Gemini API failed");
    }

    const geminiData = JSON.parse(raw);

    const botText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, could you repeat that?";

    // Save bot message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender: "bot",
      text: botText
    });

    res.json({ botText });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Health check
app.get("/", (_, res) => {
  res.send("Madam July backend running 🚀");
});

// 8. Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
