const SUPABASE_URL = "https://eeqkuibsrmxlkgmrvepw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWt1aWJzcm14bGtnbXJ2ZXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODIzMTQsImV4cCI6MjA4MDY1ODMxNH0.56pZKFzBj9xPtJFCwuM8avhka51NYLRaqTAHruFivkw";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let conversationId = null;
const DEMO_USER_ID = "demo-user-1";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const messageEl = document.getElementById("message");
const botAnsEl = document.getElementById("bot-ans");

let recognition = null;
let isListening = false;
let isRunning = false;
let finalTranscript = "";

function showBotAnswer(text) {
  botAnsEl.value = "Bot Answer: " + text;
  botAnsEl.scrollTop = botAnsEl.scrollHeight;
}


//start conversation with supabase

async function startConversationIfNeeded() {
  //if conversation exist do nothing
  if (conversationId) return;

  //insert a new row in conversations
  const { data, error } = await supabaseClient
    .from("conversations")
    .insert([
      {
        user_id: DEMO_USER_ID,
        topic: "interview_Practice",
        status: "active"
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error starting conversation:", error);
    messageEl.textContent = "Error starting conversation: ";
    return;
  }

  //save the conversation id for later messages
  conversationId = data.id;
  console.log("Conversation started with ID:", conversationId);
}

//send text to backend chatbot

async function sendToChatbot(userText) {
  if (!conversationId) {
    console.warn("No conversationId, cannot chat.");
    messageEl.textContent = "No active conversation. Please start again.";
    return;
  }

  try {
    statusEl.textContent = "Status: Tutor is thinking...";
    document.querySelector(".botthinking").textContent = "Thinking...";

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        userText,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Chat error:", data.error);
      messageEl.textContent = "Chatbot error: " + data.error;
      statusEl.textContent = "Status: Error from tutor.";
      return;
    }

    const botText = data.botText;

    // Show in bot-ans textarea
    showBotAnswer(botText);

    // Optional: TTS
    speakText(botText, () => {
      if (isRunning && recognition) {
        statusEl.textContent = "Status: Listening... (speak now)";
        finalTranscript = "";
        recognition.start();
      }
    });
  } catch (err) {
    console.error("sendToChatbot error:", err);
    messageEl.textContent = "Chat request failed: " + err.message;
    statusEl.textContent = "Status: Network error.";
  } finally {
    document.querySelector(".botthinking").textContent = "Idle";
  }
}


//save a user message into 'messages' table

// async function saveUserMessage(text) {
//     if (!conversationId) {
//         console.warn("No active conversation. Cannot save message.");
//         return;
//     }

//     //insert a new row into "messages"
//     const { data, error } = await supabaseClient
//         .from("messages")
//         .insert([
//             {
//                 conversation_id: conversationId,
//                 sender: "user",
//                 text: text
//             }
//         ])
//         .select()
//         .single();

//     if (error) {
//         console.error("Error saving user message:", error);
//         messageEl.textContent = "failed to save message in database";
//         return;
//     }
//     console.log("saved user message:", data);

// }

//TTS helper
function speakText(text, onEnd) {
  if (!window.speechSynthesis) {
    console.warn("SpeechSynthesis not supported.");
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

//setup web speech API

if (!SpeechRecognition) {
  statusEl.textContent = "Your browser does not support Speech Recognition.";
  statusEl.classList.add("error");
  startBtn.disabled = true;
}

else {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    statusEl.textContent = "Status: Listening...(speak now)";
    messageEl.textContent = "";
    startBtn.textContent = "Stop Listening...";
  };

  recognition.onend = () => {
    isListening = false;
    statusEl.textContent = "Status: Not listening.";
    startBtn.textContent = "Start Listening";

    const textToSend = finalTranscript.trim();

    if (textToSend.length > 0) {
      outputEl.value = textToSend;

      //send to backend tutor
      if (isRunning) {
        console.log("Sending to chatbot:", textToSend);
        sendToChatbot(textToSend);
      }
    }
  };

  recognition.onerror = (event) => {
    isListening = false;
    statusEl.textContent = "Status: Error occured - ";
    messageEl.textContent = "Error details: " + event.error;
    startBtn.textContent = "Start Listening";
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }

    }

    outputEl.value = finalTranscript + interimTranscript

  };
}


// start button
async function startRecognition() {
  if (!recognition) return;

  if (!isListening) {
    // START
    isRunning = true;

    await startConversationIfNeeded();
    if (!conversationId) return; // failed to create conversation

    finalTranscript = "";
    outputEl.value = "";
    botAnsEl.value = "";
    document.querySelector(".botthinking").textContent = "Listening...";

    recognition.start();
  } else {
    // STOP
    isRunning = false;
    recognition.stop();
    document.querySelector(".botthinking").textContent = "Stopped";
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

// Clear button

clearBtn.addEventListener("click", () => {
  finalTranscript = "";
  outputEl.value = "";
  botAnsEl.value = "";
  messageEl.textContent = "";
  statusEl.textContent = "Status: Not listening.";
  document.querySelector(".botthinking").textContent = "Idle";
});

