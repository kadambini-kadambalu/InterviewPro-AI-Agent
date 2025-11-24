🤖 InterviewPro - Agentic AI Interviewer

InterviewPro is an intelligent, voice-enabled AI agent designed to conduct rigorous mock interviews. Unlike standard chatbots, this agent maintains a specific persona ("Kalia"), manages time constraints, enforces interview rigor, and adapts its strategy based on user behavior and resume context.

 🚀 Features
* Agentic Behavior: Enforces rules, manages time, and refuses off-topic distractions.
* Resume Analysis: Upload a PDF resume, and the AI generates questions specific to your skills.
* Voice-First Interface: Full speech-to-text and text-to-speech integration for a realistic experience.
* Dynamic Pacing: The AI shortens its responses as the timer runs down.
* Silence Detection: Automatically nudges the user if they hesitate for too long.

 🛠️ Tech Stack
* Backend: Python, FastAPI, Google Gemini 2.5 Flash
* Frontend: HTML5, CSS3, Vanilla JavaScript (Web Speech API)
* PDF Processing: PyPDF

 ⚙️ How to Run Locally

Since this project uses a Python backend, you cannot run it directly in the browser via GitHub Pages. Follow these steps:

1.  Clone the repository:
    git clone [https://github.com/YOUR_USERNAME/InterviewPro-AI-Agent.git](https://github.com/YOUR_USERNAME/InterviewPro-AI-Agent.git)
    cd InterviewPro-AI-Agent

2.  Install Dependencies:
    pip install -r requirements.txt

3.  Set up API Key:
    * Open main.py.
    * Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key from [Google AI Studio](https://aistudio.google.com/).

4.  Run the Server:
    python main.py

5.  Start the Interview:
    Open 'index.html' in your browser.

## 🧠 Design Decisions & Architecture
* **Model Selection (Gemini 2.5 Flash):** Chosen for low latency and high instruction adherence.
* **State Management:** In-memory session storage was chosen for speed and simplicity in this MVP.
* **Client-Side Voice Processing:** We use the browser's Web Speech API to ensure zero-latency voice interaction, which is critical for maintaining conversational flow.
