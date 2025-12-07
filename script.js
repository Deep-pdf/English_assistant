const SUPABASE_URL = "https://eeqkuibsrmxlkgmrvepw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWt1aWJzcm14bGtnbXJ2ZXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODIzMTQsImV4cCI6MjA4MDY1ODMxNH0.56pZKFzBj9xPtJFCwuM8avhka51NYLRaqTAHruFivkw";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let conversationId = null;
const DEMO_USER_ID = "demo-user-1";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const messageEl = document.getElementById("message");

let recognition = null;
let isListening = false;
let finalTranscript = "";

//start conversation with supabase

async function startConversationIfNeeded(){
    //if conversation exist do nothing
    if (conversationId) return;

    //insert a new row in conversations
    const {data, error} = await supabase
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

       if (error){
        console.error("Error starting conversation:", error);
        messageEl.textContent = "Error starting conversation: ";
        return;
       }
       
       //save the conversation id for later messages
         conversationId = data.id;
         console.log("Conversation started with ID:", conversationId);
} 

//save a user message into 'messages' table

async function saveUserMessage(text){
    if (!conversationId) {
        console.warn("No active conversation. Cannot save message.");
        return;
    }

    //insert a new row into "messages"
    const { data, error } = await supabase
    .from("messages")
    .insert([
        {
            conversation_id: conversationId,
            sender: "user",
            text: text
        }
    ])
    .select()
    .single();

    if (error) {
        console.error("Error saving user message:", error);
        messageEl.textContent = "failed to save message in database";
        return;
    }
    console.log("saved user message:", data);

}

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

//start /stop button
startBtn.addEventListener("click", () => {
    if (!recognition) return;

    if (!isListening) {
        //start listening
        finalTranscript ="";
        outputEl.value = "";
        recognition.start();
    }

    else{
        //stop listening
        recognition.stop();
    }
});

//  clearbutton
clearBtn.addEventListener("click", () => {
    finalTranscript ="";
    outputEl.value = "";
    statusEl.textContent = "Status: Not listening.";
    statusEl.classList.remove("error");
});
