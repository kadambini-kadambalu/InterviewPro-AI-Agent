/**
 * InterviewPro - Kalia Edition
 */

const API_URL = "http://localhost:8000"; 

const state = {
    sessionId: null,
    isProcessing: false,
    timerInterval: null,
    timeLeft: 300,
    silenceTimer: null 
};

const screens = {
    setup: document.getElementById('setup-section'),
    chat: document.getElementById('chat-section'),
    feedback: document.getElementById('feedback-section')
};

const elements = {
    nameInput: document.getElementById('nameInput'),
    roleInput: document.getElementById('roleInput'),
    timeInput: document.getElementById('timeInput'),
    resumeInput: document.getElementById('resumeInput'),
    chatWindow: document.getElementById('chatWindow'),
    typing: document.getElementById('typingIndicator'),
    endBtn: document.getElementById('end-btn'),
    feedbackContent: document.getElementById('feedback-content'),
    timerDisplay: document.getElementById('timer-display'),
    micBtn: document.getElementById('mic-btn')
};

function startTimer(minutes) {
    state.timeLeft = minutes * 60; 
    updateTimerDisplay();
    
    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    elements.timerDisplay.innerText = 
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    elements.timerDisplay.style.color = state.timeLeft < 60 ? "#EF4444" : "#2563EB";
}

async function handleTimeUp() {
    clearInterval(state.timerInterval);
    clearTimeout(state.silenceTimer);
    
    addMessageToUI('user', "*(Time Expired)*");
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                session_id: state.sessionId, 
                message: "TIME_UP_SIGNAL",
                seconds_left: 0
            })
        });
        
        const data = await response.json();
        addMessageToUI('ai', data.message);
        speakText(data.message, () => endInterview());

    } catch (e) {
        endInterview();
    }
}

// --- Silence Detection Logic ---

function startSilenceCheck() {
    if (state.silenceTimer) clearTimeout(state.silenceTimer);

    state.silenceTimer = setTimeout(() => {
        if (!state.isProcessing && state.timeLeft > 0) {
            triggerSilenceNudge();
        }
    }, 5000);
}

function stopSilenceCheck() {
    if (state.silenceTimer) clearTimeout(state.silenceTimer);
}

async function triggerSilenceNudge() {
    console.log("User is silent...");
    state.isProcessing = true;
    showTyping(true);

    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                session_id: state.sessionId, 
                message: "SILENCE_DETECTED",
                seconds_left: state.timeLeft
            })
        });

        const data = await response.json();
        addMessageToUI('ai', data.message);
        speakText(data.message);

    } catch (error) {
        console.error("Nudge failed");
    } finally {
        state.isProcessing = false;
        showTyping(false);
    }
}

// --- Initialization ---

async function startInterview() {
    const role = elements.roleInput.value.trim();
    const name = elements.nameInput.value.trim();
    const mins = parseInt(elements.timeInput.value) || 5;
    
    // FILE CHECK
    const fileInput = elements.resumeInput;
    if (!role || !name || fileInput.files.length === 0) {
        alert("Please enter Name, Role, and upload a PDF Resume.");
        return;
    }

    const startBtn = document.querySelector('.btn-primary');
    const originalText = startBtn.innerText;
    startBtn.innerText = "Validating...";
    startBtn.disabled = true;

    // --- USE FORMDATA FOR FILE UPLOAD ---
    const formData = new FormData();
    formData.append("role", role);
    formData.append("name", name);
    formData.append("duration_minutes", mins);
    formData.append("resume", fileInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            body: formData 
        });

        // --- THE FIX IS HERE ---
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Backend connection failed");
        }

        const data = await response.json();
        state.sessionId = data.session_id;

        switchScreen('chat');
        elements.endBtn.classList.remove('hidden');
        
        startTimer(mins);
        
        addMessageToUI('ai', data.message);
        speakText(data.message);

    } catch (error) {
        alert(error.message);
    } finally {
        startBtn.innerText = originalText;
        startBtn.disabled = false;
    }
}
// --- Chat Logic ---

async function sendVoiceMessage(text) {
    if (state.isProcessing || state.timeLeft <= 0) return;

    addMessageToUI('user', text);
    stopSilenceCheck();

    state.isProcessing = true;
    showTyping(true);

    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                session_id: state.sessionId, 
                message: text,
                seconds_left: state.timeLeft 
            })
        });

        const data = await response.json();
        addMessageToUI('ai', data.message);
        speakText(data.message);

    } catch (error) {
        addMessageToUI('ai', "Error connecting.");
    } finally {
        state.isProcessing = false;
        showTyping(false);
    }
}

// --- Feedback Logic ---

async function endInterview() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    stopSilenceCheck();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    switchScreen('feedback');
    elements.endBtn.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: state.sessionId })
        });
        const data = await response.json();
        elements.feedbackContent.innerHTML = data.feedback;
    } catch (error) {
        elements.feedbackContent.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    }
}

// --- UI Utilities ---

function switchScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function addMessageToUI(role, text) {
    const div = document.createElement('div');
    div.classList.add('message', role);
    div.innerHTML = text.replace(/\n/g, '<br>');
    elements.chatWindow.appendChild(div);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

function showTyping(show) {
    elements.typing.classList.toggle('hidden', !show);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

// --- Voice Interaction Logic ---

// 1. Setup Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

// 2. Handle Microphone Input
function startVoiceInput() {
    stopSilenceCheck();
    elements.micBtn.style.backgroundColor = "#EF4444"; 
    recognition.start();
}

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    elements.micBtn.style.backgroundColor = "#2563EB"; 
    sendVoiceMessage(transcript);
};

recognition.onerror = (event) => {
    console.error("Speech error", event.error);
    elements.micBtn.style.backgroundColor = "#2563EB"; 
    startSilenceCheck(); // Resume waiting if they failed to speak
};

// 3. Text-to-Speech with Auto-Silence Trigger
function speakText(text, onEndCallback = null) {
    window.speechSynthesis.cancel();
    stopSilenceCheck();

    const cleanText = text.replace(/<[^>]*>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
        if (onEndCallback) onEndCallback();
        if (state.timeLeft > 0) startSilenceCheck();
    };

    window.speechSynthesis.speak(utterance);
}