# Alpha AI — Autonomous Multi-Agent AI Workspace & Productivity Suite

Alpha AI is an enterprise-grade, full-stack, multi-agent AI workspace designed for lightning-fast reasoning, intelligent document analysis, automated ATS resume generation, computer vision, full-stack software development with local Model Context Protocol (MCP) workspace execution, presentation creation, and web search intelligence. Available as both a high-performance Web application and an Electron Desktop companion.

---

## 🚀 Key Highlights & Specialist AI Agents

Alpha AI features a dynamic LangGraph multi-agent execution pipeline with automatic intent classification and specialized agents:

| Agent / Mode | Technology / Model | Core Capability |
| :--- | :--- | :--- |
| **🧭 Auto Router** | Groq `llama-3.1-8b-instant` | Classifies user intent with zero latency and routes to the optimal specialist agent. |
| **💬 General Chat** | Groq `llama-3.3-70b-versatile` / `3.1-8b` | Context-aware reasoning with 24-hour Redis memory and Markdown formatting. |
| **💻 Coding Engineer (Web & Local MCP)** | DeepSeek V3 (`deepseek/deepseek-chat`) + MCP SDK | Produces sandboxed web applications (Monaco Editor) or directly manipulates real local project files via Model Context Protocol (MCP). |
| **🖥️ Desktop Companion** | Electron + VS Code Automation | Select local workspace folders with native OS pickers and auto-launch VS Code sessions with synchronized context. |
| **📄 Resume Architect** | Gemini 2.0 Flash / Groq 70B | Generates ATS-compliant, executive PDF resumes and uploads to Cloudinary with secure download links. |
| **🖼️ Image Analyzer** | Google Gemini 2.0 Flash | Multimodal computer vision for high-accuracy OCR, chart analysis, architecture diagrams, and screenshot debugging. |
| **📑 PDF RAG Analyzer** | Google `text-embedding-004` + Qdrant | Retrieval-Augmented Generation (RAG) providing strictly grounded answers with document citations. |
| **📊 Presentation Architect** | Groq `llama-3.3-70b-versatile` + PptxGenJS | Generates 6-slide executive PowerPoint (.pptx) decks ready for download. |
| **📑 Document Architect** | Groq `llama-3.3-70b-versatile` + PDFKit | Crafts structured, publication-grade PDF documents. |
| **🌐 Web Search Agent** | Tavily Search + Groq | Live real-time internet search and synthesis. |
| **🎨 Image Generation** | Pollinations.ai / SD Engine | Text-to-image prompt synthesis with Cloudinary CDN delivery. |

---

## 💎 Subscription Tiers & Unit Economics

Alpha AI features dynamic plan-aware model routing maximizing developer profit while delivering top-tier performance:

| Plan | Price (INR) | Credits | Model Capabilities | Profit Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | ₹0 | 100 Credits | Groq Llama 3.1 8B, Groq 70B, Gemini 2.0 Flash | High speed, zero marginal cost |
| **Starter** | ₹299 / mo | 500 Credits | DeepSeek V3, Groq Llama 3.3 70B, Gemini 2.0 Flash | **₹280+ profit/user (93%+ margin)** |
| **Pro** | ₹499 / mo | 1000 Credits | DeepSeek V3/R1, Gemini 2.0 Flash, Groq 70B | **₹450+ profit/user (90%+ margin)** |

---

## 🏗️ System Architecture

Alpha AI is built as a microservices architecture coordinated through an API Gateway, integrated with an Electron desktop layer and an extensible Model Context Protocol (MCP) server:

```text
┌───────────────────────────────────────┐      ┌───────────────────────────────────────┐
│     React 19 + Vite Web Client        │      │   Electron Desktop Companion (OS GUI) │
│ (Monaco Editor, Motion, Tailwind v4)  │      │   - Native Folder Picker & VS Code    │
└───────────────────┬───────────────────┘      └───────────────────┬───────────────────┘
                    │                                              │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / Cookie Session
                                           ▼
                    ┌─────────────────────────────────────────┐
                    │           API Gateway (Port 8000)       │
                    │   - Redis Session Authentication         │
                    │   - Header Injection (x-user-id, plan)  │
                    └─────┬──────────┬──────────┬───────────┬─┘
                          │          │          │           │
      ┌───────────────────┘          │          │           └────────────────────┐
      ▼                              ▼          ▼                                ▼
┌──────────────────┐    ┌──────────────────┐┌──────────────────┐    ┌─────────────────────────┐
│   Auth Service   │    │   Chat Service   ││ Billing Service  │    │      Agent Service      │
│   (Port 8001)    │    │   (Port 8002)    ││   (Port 8004)    │    │       (Port 8003)       │
│ - Firebase / OTP │    │ - Conversations  ││ - Razorpay HMAC  │    │ - LangGraph Graph       │
│ - MongoDB Users  │    │ - Message Store  ││ - Plan Upgrade   │    │ - Specialist AI Agents  │
│ - Credit Balance │    │ - History Sync   ││ - MongoDB Payment│    │ - Redis 24h Mem Cache   │
└──────────────────┘    └──────────────────┘└──────────────────┘    └───────────┬─────────────┘
                                                                                │ Stdio Protocol
                                                                                ▼
                                                                    ┌─────────────────────────┐
                                                                    │    MCP Server Engine    │
                                                                    │   (Model Context Proto) │
                                                                    │ - File / Dir Operations │
                                                                    │ - Git Tools & Status    │
                                                                    │ - Safe Root Boundaries  │
                                                                    │ - Local Workspace Sync  │
                                                                    └─────────────────────────┘
```

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for sequence diagrams and deep architectural specifications.

---

## 📱 Responsive Layout & Sidebar Navigation Design

Alpha AI provides an adaptive layout built for both mobile screens and ultra-wide desktop monitors:

- **Small Devices (Viewport < 1024px / Mobile & Tablets)**:
  - Off-canvas overlay drawer sliding gracefully with backdrop blur.
  - Sidebar header displays the dedicated **`LuX` close button** (`!flex lg:!hidden`) to easily dismiss the menu.
  - The desktop collapse panel control (`LuPanelLeft`) is strictly suppressed (`!hidden lg:!flex`), guaranteeing only **one** close action is visible and eliminating visual clutter.
- **Large Devices (Viewport ≥ 1024px / Desktop & Laptops)**:
  - Sidebar expands as a permanent panel or collapses into a space-efficient 56px icon dock.
  - The mobile close button **`LuX` is strictly hidden** (`lg:!hidden`).
  - The desktop **`LuPanelLeft` collapse toggle** is active (`!hidden lg:!flex`), allowing instant folding into a mini sidebar with `LuPanelRight` restore control.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS v4, Motion, Monaco Editor, React Markdown, Remark GFM, Prism |
| **Desktop Companion** | Electron 44, `electron-store`, Node.js IPC, child_process VS Code bridge |
| **Model Context Protocol** | `@modelcontextprotocol/sdk`, Stdio Client/Server Transport, Workspace Tools, Git Tools |
| **API Gateway** | Express, `express-http-proxy`, Redis session validator, CORS, Cookie-Parser, Morgan |
| **AI Orchestration** | LangChain Core, LangGraph, Groq SDK, Google Generative AI, OpenRouter (DeepSeek V3 / R1) |
| **Vector Store & Embeddings** | Qdrant Cloud Vector Database, Google `text-embedding-004` |
| **Databases & Cache** | MongoDB (Mongoose ODM), Redis (ioredis) |
| **Media & Generation** | Cloudinary API, PDFKit, PptxGenJS, pdf-parse, Pollinations |
| **Authentication & Payments** | Firebase Auth / Admin SDK, Nodemailer (OTP), Razorpay Payments SDK |

---

## 📂 Repository Layout

```text
desktop/                  Electron desktop companion app with workspace bridge
  electron/               Main process, preload script, native folder dialogs
  src/                    Workspace & VS Code bridge services
frontend/                 React + Vite web application
  src/components/         SideBar, ChatArea, ChatInput, BillingDrawer, Artifacts
  src/features/           API integration modules (verifyPayment, createOrder, etc.)
  src/redux/              User, conversation, message, and UI state slices
backend/
  gateway/                Central API Gateway with session verification & proxy
  services/
    auth/                 User provisioning, OTP/Firebase login, credit billing
    chat/                 Conversations and persistent message repository
    billing/              Razorpay order creation and HMAC verification
    agent/                LangGraph router, LLM configs, specialist agents & MCP client
  shared/redis/           Shared Redis connection instance
mcp-server/               Model Context Protocol (MCP) server for local tools
  src/tools/              fileTools, gitTools, terminalTools, workspaceTools
SYSTEM_DESIGN.md          Detailed architecture, data flows, MCP specs & security design
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

# Backend Microservices
cd ../backend/gateway && npm install
cd ../services/auth && npm install
cd ../chat && npm install
cd ../billing && npm install
cd ../agent && npm install
```

### 3. Configure Environment Variables
Create `.env` files in each service directory (see templates below).

### 4. Run Development Servers
```bash
# Start microservices in separate terminals:
cd backend/gateway && npm run dev
cd backend/services/auth && npm run dev
cd backend/services/chat && npm run dev
cd backend/services/billing && npm run dev
cd backend/services/agent && npm run dev

# Start Frontend (Web):
cd frontend && npm run dev

# Start Desktop Application (Optional):
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

## 🛡️ Security, SEO & Production Best Practices

1. **HMAC Signature Verification**: Razorpay verification is computed server-side (`sha256`) using strictly verified secrets.
2. **Session Isolation**: HTTP-only, `sameSite` secure session cookies with Redis key TTLs.
3. **Sandboxed Artifacts**: Monaco editor code rendering runs inside isolated iframe sandboxes (`sandbox="allow-scripts"`).
4. **Local Workspace Safety**: MCP server enforces strict root confinement; workspace root deletion is explicitly prevented.
5. **Responsive Integrity**: Responsive utilities enforce strict isolation between desktop collapse toggles and mobile drawer dismiss buttons to prevent icon collisions.
6. **Lighthouse & SEO Optimized**: Meta tags, Open Graph cards, Twitter previews, font preconnects, and defer scripts.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
