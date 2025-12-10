// 1.import and envireonment

require('dotenv').config(); //load config files

const express = require('express');
const cors = require('cors');
const { createCleint } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. initialize core services

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

//initialize supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

// fetch receent messages from DB

async function getConversationMessages(conversationId, limit =20) {
    const { data, error} = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching messages:", error);
        throw new Error("failed to fetch messages from DB");
    }

    if (data.length > limit) {
        return data.slice(data.length - limit);
    }

    return data;
}

function buildGeminiContentFromMessages(messages) {
    const contents = [];

    // system instruction AI ke liye
    const systemInstruction = `
You are an English interview tutor.

Goals:
- Act like a realistic job interviewer.
- Ask relevant interview or follow-up questions based on the user's answers.
- Help the user practice spoken English for interviews.
- Gently correct grammar, vocabulary, and clarity.
- After each user answer, respond with:
  1) A short interviewer-style reply or next question.
  2) Very brief feedback on their English (1–3 sentences).
- Keep responses under 6–8 sentences overall.
- Be friendly and encouraging.
  `.trim();

    contents.push({
        role: "user",
        parts: [{ text: systemInstruction }],
    });

    // map DB messages to Gimini format

    for (const msg of messages){
        if (msg.sender === "user") {
            contents.push({
                role: "user",
                parts: [{ text: msg.text }],
            });
        } else if (msg.sender === "bot"){
            contents.push({
                role: "model",
                parts: [{text: msg.text}],
            });
        }
    }

    return contents;
}

