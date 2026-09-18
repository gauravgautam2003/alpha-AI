# Alpha AI — Autonomous Multi-Agent AI Workspace & Productivity Suite

Alpha AI is an enterprise-grade, full-stack, multi-agent AI workspace designed for fast reasoning, intelligent document analysis, ATS-ready resume generation, computer vision, local workspace automation, and AI-assisted software delivery.

---

## 🚀 Key Highlights & Specialist AI Agents

Alpha AI uses a dynamic LangGraph multi-agent execution pipeline with automatic intent classification and specialist agents:

| Agent / Mode | Technology / Model | Core Capability |
| :--- | :--- | :--- |
| **🧭 Auto Router** | Groq `llama-3.1-8b-instant` | Classifies user intent with zero latency and routes to the optimal specialist agent. |
| **💬 General Chat** | Groq `llama-3.3-70b-versatile` / `3.1-8b` | Context-aware reasoning with 24-hour Redis memory and Markdown formatting. |
| **💻 Coding Engineer (Web & Local MCP)** | DeepSeek V3 + MCP SDK | Produces sandboxed web apps or directly manipulates local project files via secure workspace tools. |
| **🖥️ Desktop Companion** | Electron + VS Code automation | Select local workspace folders with native OS pickers and launch VS Code sessions with synchronized context. |
| **📄 Resume Architect** | Gemini 2.0 Flash / Groq 70B | Generates ATS-compliant PDF resumes and uploads to Cloudinary with secure download links. |
| **🖼️ Image Analyzer** | Google Gemini 2.0 Flash | Multimodal vision for OCR, chart analysis, screenshots, and debugging. |
| **📑 PDF RAG Analyzer** | Google `text-embedding-004` + Qdrant | Grounded document Q&A with retrieval and citations. |
| **📊 Presentation Architect** | Groq `llama-3.3-70b-versatile` + PptxGenJS | Generates presentation decks ready for download. |
| **📑 Document Architect** | Groq `llama-3.3-70b-versatile` + PDFKit | Creates structured, publication-grade PDF documents. |
| **🌐 Web Search Agent** | Tavily Search + Groq | Live real-time internet search and synthesis. |
| **🎨 Image Generation** | Pollinations.ai / SD Engine | Text-to-image prompt synthesis with Cloudinary delivery. |

---

## 💎 Subscription Tiers & Unit Economics

Alpha AI features plan-aware model routing designed to maximize quality while maintaining strong operating margins:

| Plan | Price (INR) | Credits | Model Capabilities | Profit Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | ₹0 | 100 Credits | Groq Llama 3.1 8B, Groq 70B, Gemini 2.0 Flash | High speed, zero marginal cost |
| **Starter** | ₹299 / mo | 500 Credits | DeepSeek V3, Groq Llama 3.3 70B, Gemini 2.0 Flash | **₹280+ profit/user (93%+ margin)** |
| **Pro** | ₹499 / mo | 1000 Credits | DeepSeek V3/R1, Gemini 2.0 Flash, Groq 70B | **₹450+ profit/user (90%+ margin)** |

---

## 🏗️ System Architecture

Alpha AI is built as a microservices architecture coordinated through an API Gateway, integrated with an Electron desktop layer and an extensible Model Context Protocol (MCP) server:

```text
┌──────────────────────────────────────────────┐     ┌──────────────────────────────────────┐
│ React 19 + Vite Web Client                  │     │ Electron Desktop Companion (OS GUI) │
│ (Monaco Editor, Motion, Tailwind v4)        │     │ - Native folder picker & VS Code    │
└──────────────────┬───────────────────────────┘     └──────────────────┬──────────────────────┘
                   │                                                    │
                   └───────────────────────┬────────────────────────────┘
                                           │ HTTP / Cookie Session
                                           ▼
                        ┌────────────────────────────────────────────┐
                        │ API Gateway (Port 8000)                   │
                        │ - Redis session auth                       │
                        │ - Header injection (x-user-id, x-user-plan)│
                        └───────┬───────────┬───────────┬─────────────┘
                                │           │           │
                 ┌──────────────┘           │           └──────────────┐
                 ▼                          ▼                          ▼
        ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
        │ Auth Service     │      │ Chat Service     │      │ Billing Service      │
        │ (Port 8001)      │      │ (Port 8002)      │      │ (Port 8004)          │
        │ - Firebase / OTP │      │ - Conversations  │      │ - Razorpay HMAC      │
        │ - MongoDB Users  │      │ - Message Store  │      │ - Plan upgrade       │
        │ - Credit Balance │      │ - History sync   │      │ - MongoDB payments   │
        └──────────────────┘      └──────────────────┘      └──────────────────────┘
                                                  │
                                                  │
                                                  ▼
                                        ┌──────────────────────────┐
                                        │ Agent Service            │
                                        │ (Port 8003)              │
                                        │ - LangGraph orchestrator │
                                        │ - Specialist AI agents   │
                                        │ - Redis memory cache     │
                                        └─────────────┬────────────┘
                                                      │ Stdio / MCP
                                                      ▼
                                            ┌──────────────────────────┐
                                            │ MCP Server Engine        │
                                            │ - File / dir tools       │
                                            │ - Git tools              │
                                            │ - Safe root boundaries   │
                                            │ - Local workspace sync   │
                                            └──────────────────────────┘
```

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for sequence diagrams and deeper architecture specifications.

---

## 📱 Responsive Layout & Sidebar Navigation Design

Alpha AI provides an adaptive layout built for both mobile screens and large desktop monitors:

- **Small Devices (Viewport < 1024px / Mobile & Tablets)**:
  - Off-canvas overlay drawer sliding with a backdrop blur.
  - Sidebar header displays a dedicated **`LuX` close button** (`!flex lg:!hidden`) for quick dismissal.
  - Desktop collapse controls are suppressed (`!hidden lg:!flex`) to keep only one action visible.
- **Large Devices (Viewport ≥ 1024px / Desktop & Laptops)**:
  - The sidebar expands as a persistent panel or collapses into a compact icon dock.
  - The mobile close button **`LuX` is hidden** (`lg:!hidden`).
  - The desktop collapse control remains active (`!hidden lg:!flex`) for fast toggling.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS v4, Motion, Monaco Editor, React Markdown, Remark GFM |
| **Desktop Companion** | Electron 44, `electron-store`, Node.js IPC, child_process VS Code bridge |
| **Model Context Protocol** | `@modelcontextprotocol/sdk`, stdio transport, workspace tools, git tools |
| **API Gateway** | Express, Redis session validation, CORS, cookie parsing |
| **AI Orchestration** | LangChain Core, LangGraph, Groq SDK, Google Generative AI, OpenRouter |
| **Vector Store & Embeddings** | Qdrant Cloud Vector Database, Google `text-embedding-004` |
| **Databases & Cache** | MongoDB, Redis |
| **Media & Generation** | Cloudinary API, PDFKit, PptxGenJS, pdf-parse, Pollinations |
| **Authentication & Payments** | Firebase Auth / Admin SDK, Razorpay Payment SDK |

---

## 📂 Repository Layout

```text
backend/
  gateway/                Central API Gateway with session verification and proxying
  services/
    auth/                 User provisioning, OTP/Firebase login, credit billing
    chat/                 Conversations and persistent message storage
    billing/              Razorpay order creation and HMAC verification
    agent/                LangGraph router, LLM configs, specialist agents, MCP client
  shared/redis/           Shared Redis connection instance

desktop/                 Electron desktop companion app with workspace bridge
  electron/               Main process, preload script, native dialogs
  src/                    Workspace and VS Code bridge services

frontend/                React + Vite web application
  src/                    App screens, components, Redux slices, services

mcp-server/              Model Context Protocol (MCP) server for local tools
  src/tools/              fileTools, gitTools, terminalTools, workspaceTools

SYSTEM_DESIGN.md         Detailed architecture, data flows, MCP specs, and security design
```

---

## ⚡ Local Development Setup

### 1. Start Redis
```bash
cd backend
docker compose up -d redis
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Desktop App
cd ../desktop && npm install

# MCP Server
cd ../mcp-server && npm install

# Backend microservices
cd ../backend/gateway && npm install
cd ../services/auth && npm install
cd ../chat && npm install
cd ../billing && npm install
cd ../agent && npm install
```

### 3. Configure Environment Variables
Create `.env` files in each service directory as needed.

### 4. Run Development Servers
```bash
# Start microservices in separate terminals:
cd backend/gateway && npm run dev
cd backend/services/auth && npm run dev
cd backend/services/chat && npm run dev
cd backend/services/billing && npm run dev
cd backend/services/agent && npm run dev

# Start frontend (web):
cd frontend && npm run dev

# Start desktop app (optional):
cd desktop && npm start
```

---

## 🔐 Environment Variables Configuration

### Frontend (`frontend/.env`)
```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### API Gateway (`backend/gateway/.env`)
```env
PORT=8000
FRONTEND_URL=http://localhost:3000
AUTH_SERVICE=http://localhost:8001
CHAT_SERVICE=http://localhost:8002
AGENT_SERVICE=http://localhost:8003
BILLING_SERVICE=http://localhost:8004
REDIS_URL=redis://localhost:6379
```

### Agent Service (`backend/services/agent/.env`)
```env
PORT=8003
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_ai_studio_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_search_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
QDRANT_URL=your_qdrant_cluster_url
QDRANT_API_KEY=your_qdrant_api_key
CHAT_SERVICE=http://localhost:8002
AUTH_SERVICE=http://localhost:8001
REDIS_URL=redis://localhost:6379
```

### MCP Server (`mcp-server/.env`)
```env
WORKSPACE_ROOT=c:/Users/This PC/OneDrive/Desktop/PROJECTS/ALPHA AI
```

---

## 🛡️ Security & Production Best Practices

1. **HMAC Signature Verification**: Razorpay verification is computed server-side using `sha256` and verified secrets.
2. **Session Isolation**: HTTP-only, secure session cookies with Redis-backed TTL and strict validation.
3. **Sandboxed Artifacts**: Monaco editor code rendering runs inside isolated iframe sandboxes.
4. **Local Workspace Safety**: MCP enforces strict root confinement and blocks unsafe path traversal.
5. **Responsive Integrity**: Sidebar utilities enforce desktop/mobile visibility rules to avoid collisions.
6. **Rate Limiting & Abuse Prevention**: Redis-backed per-user rate limiting helps prevent abuse.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
