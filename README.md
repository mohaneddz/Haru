# 🧠 HARU — The Intelligence Assistant

**A fully local, privacy-first desktop studying assistant that makes you smarter, faster, and more capable.**
Built with **Tauri + SolidJS + Rust + Multiple Local AI Models**.

---

# 🚀 Tech Stack

## **Frontend**

![SolidJS](https://img.shields.io/badge/SolidJS-446B9E?style=for-the-badge\&logo=solid)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge\&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite)

## **Backend**

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge\&logo=rust)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge\&logo=fastapi)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge\&logo=sqlite)
![Local Cache](https://img.shields.io/badge/Local_Caches-555555?style=for-the-badge)

## **AI / ML**

![GGUF](https://img.shields.io/badge/GGUF_LLMs-FFB000?style=for-the-badge)
![llama.cpp](https://img.shields.io/badge/llama--server-808080?style=for-the-badge)
![Whisper.cpp](https://img.shields.io/badge/Whisper.cpp-6A5ACD?style=for-the-badge)
![Piper](https://img.shields.io/badge/Piper_TTS-8A2BE2?style=for-the-badge)
![FastText](https://img.shields.io/badge/FastText-00599C?style=for-the-badge)
![Custom VLM](https://img.shields.io/badge/Custom_VLM-FF0066?style=for-the-badge)
![RAG](https://img.shields.io/badge/RAG_Pipeline-00BFA6?style=for-the-badge)

---

# ⚡ Overview

HARU is a **local AI assistant** powered by offline pipelines.

Core functionalities include:

* Chats & Voice Conversations
* Dynamic Courses and Material Syllabuses 
* Resources Search and AI Mindmaps
* Flashcards & Learning Tools
* Time Tracking & Productivity Analytics
* Notes & Whiteboard Workspace
* Videos & Media Management
* Goals & Milestones Tracking
* RAG & Web Search
* File Tools & Utilities
* Plugins & Brain-training Activities

Everything runs **100% locally** — zero cloud, zero tracking, zero limits.

---

# 🖼️ Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/achivements.avif" width="260"/><br/>Achievements System</td>
    <td align="center"><img src="screenshots/brain-sides.avif" width="260"/><br/>Brain Activity Visualization</td>
    <td align="center"><img src="screenshots/calculator.avif" width="260"/><br/>Smart Calculator Tool</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/chat.avif" width="260"/><br/>AI Chat Interface</td>
    <td align="center"><img src="screenshots/course.avif" width="260"/><br/>Course Viewer</td>
    <td align="center"><img src="screenshots/definitions.avif" width="260"/><br/>Definition Explorer</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/documents.avif" width="260"/><br/>Document Manager</td>
    <td align="center"><img src="screenshots/flashcards-stats.avif" width="260"/><br/>Flashcards Analytics</td>
    <td align="center"><img src="screenshots/flashcards.avif" width="260"/><br/>Flashcards Study Mode</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/goals.avif" width="260"/><br/>Goals & Milestones</td>
    <td align="center"><img src="screenshots/library.avif" width="260"/><br/>Library View</td>
    <td align="center"><img src="screenshots/new course.avif" width="260"/><br/>New Course Wizard</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/notes.avif" width="260"/><br/>Notes System</td>
    <td align="center"><img src="screenshots/plugins.avif" width="260"/><br/>Plugins Manager</td>
    <td align="center"><img src="screenshots/pomodoro.avif" width="260"/><br/>Pomodoro Focus Tool</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/progress.avif" width="260"/><br/>Personal Progress Overview</td>
    <td align="center"><img src="screenshots/quicknotes.avif" width="260"/><br/>Quick Notes Popup</td>
    <td align="center"><img src="screenshots/settings-advanced.avif" width="260"/><br/>Advanced Settings</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/settings-appearence.avif" width="260"/><br/>Appearance Settings</td>
    <td align="center"><img src="screenshots/settings-behavior.avif" width="260"/><br/>Behavior Customization</td>
    <td align="center"><img src="screenshots/settings-downloadspng.avif" width="260"/><br/>Downloads Settings</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/settings-paths.avif" width="260"/><br/>Local Paths Configuration</td>
    <td align="center"><img src="screenshots/syllabus.avif" width="260"/><br/>Course Syllabus Page</td>
    <td align="center"><img src="screenshots/time.avif" width="260"/><br/>Time Tracking Dashboard</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/tools.avif" width="260"/><br/>Utilities Panel</td>
    <td align="center"><img src="screenshots/transcribe-filepng.avif" width="260"/><br/>File Transcription Tool</td>
    <td align="center"><img src="screenshots/transcribe-folder.avif" width="260"/><br/>Folder Transcription</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/translations.avif" width="260"/><br/>Translation Tool</td>
    <td align="center"><img src="screenshots/typing.avif" width="260"/><br/>Typing Trainer</td>
    <td align="center"><img src="screenshots/videos.avif" width="260"/><br/>Videos Library</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/voice.avif" width="260"/><br/>Voice Assistant</td>
    <td align="center"><img src="screenshots/whiteboard.avif" width="260"/><br/>Whiteboard Workspace</td>
    <td></td>
  </tr>
</table>

---

# 🧠 Core Algorithms

| Feature       | Algorithm                   | Description                      |
| ------------- | --------------------------- | -------------------------------- |
| Flashcards    | Adaptive Interval SRS       | Adjusts difficulty automatically |
| RAG           | Multi-pass Vector Retrieval | High-accuracy context windows    |
| Time Tracking | Attention Metrics           | Measures focus & app usage       |
| Notes         | Semantic Graphing           | Topic clustering                 |
| Goals         | Milestone Dependency Graph  | Auto-generated progress path     |
| Voice         | Streamed Whisper.cpp        | Realtime local transcription     |
| Typing        | Stabilized WPM Scoring      | Filters noise & errors           |
| Tools         | Multi-pipeline Workers      | OCR, translation, embeddings     |

---

# 💽 Installation Guide

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Run the App

```bash
pnpm tauri dev
```

---

# 🧩 Backend Workers (Using **haru.bat**)

HARU uses multiple **FastAPI microservices**.

### **Commands**

```
haru.bat chat
haru.bat rag
haru.bat web
haru.bat tts
haru.bat stt
haru.bat misc
haru.bat home
haru.bat voice
```

### **What each one does**

| Command | Description                         | Port |
| ------- | ----------------------------------- | ---- |
| `chat`  | Main LLM chat logic                 | 5000 |
| `rag`   | Document search, embeddings         | 5001 |
| `web`   | Web utilities (summaries, scrapers) | 5002 |
| `tts`   | Text-to-speech worker               | 5003 |
| `stt`   | Whisper speech-to-text              | 5004 |
| `misc`  | OCR, file tools, misc features      | 3999 |
| `home`  | Dashboard counters                  | 4999 |
| `voice` | Voice conversation pipeline         | 5005 |

### **Recommended setup**

```bash
haru.bat chat
haru.bat rag
haru.bat stt
haru.bat tts
pnpm tauri dev
```

---

# 🤖 Local LLM Server (Using **llm.bat**)

### **Run the multimodal model (Gemma Vision)**

```
llm.bat v
```

### **Run Gemma chat model**

```
llm.bat g
```

### **Run Qwen Thinking**

```
llm.bat t
```

### **Default (Gemma 3 4B IT)**

```
llm.bat
```

Runs `llama-server.exe` with:

* GPU acceleration (`-ngl 99`)
* Large context windows
* Multimodal mmproj loaded correctly

# 🛡️ License & Usage

```
© 2025 Mohaned. All rights reserved.
Unauthorized use, reproduction, modification, or distribution of this project or its source code is strictly prohibited.
```

**⚠️ IMPORTANT:** This project is **beta**, **private**, and **fully restricted**.