const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const messageEl = document.getElementById("message");

let recognition = null;
let isListening = false;
let finalTranscript = "";

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
