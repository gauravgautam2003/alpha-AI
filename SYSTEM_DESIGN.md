# Alpha AI — System Design & Architecture Specification

This document details the architectural blueprint, data flows, LangGraph execution graph, dynamic model tiering, session security, and microservices topology for the Alpha AI platform.

---

## 1. High-Level Component Topology

```mermaid
flowchart TB
    subgraph Client["Client Tier (React 19 + Vite)"]
        UI[Workspace SPA]
        Monaco[Monaco Editor & Sandboxed Sandbox]
        ReduxStore[Redux Toolkit Store]
    end

    subgraph GatewayTier["API Gateway (Express :8000)"]
        GW[Gateway Reverse Proxy]
        AuthMW[Session Middleware]
        UserCtrl[Current User Controller]
    end

    subgraph AuthTier["Auth Service (:8001)"]
        AuthApp[Auth API]
        FBAdmin[Firebase Admin SDK]
        UserDB[(MongoDB: users)]
    end

    subgraph ChatTier["Chat Service (:8002)"]
        ChatApp[Chat API]
        ConvDB[(MongoDB: conversations)]
        MsgDB[(MongoDB: messages)]
    end

    subgraph AgentTier["Agent Service (:8003)"]
        AgentApp[Agent Controller]
        GraphEngine[LangGraph Multi-Agent Engine]
        ShortMem[(Redis: 24h Conversation Memory)]
    end

    subgraph BillingTier["Billing Service (:8004)"]
        BillingApp[Billing Controller]
        PayDB[(MongoDB: payments)]
        RazorpayEngine[Razorpay Payment Gateway]
    end

    subgraph AIProviders["External AI & Storage Infrastructure"]
        GroqLLM[Groq: Llama 3.3 70B & 3.1 8B]
        GeminiLLM[Google: Gemini 2.0 Flash & Text-Embedding-004]
        DeepSeekLLM[OpenRouter: DeepSeek V3 / R1]
        TavilyAPI[Tavily Search Engine]
        QdrantDB[Qdrant Cloud Vector Store]
        CloudinaryCDN[Cloudinary Media CDN]
    end

    UI -->|HTTP / WithCredentials| GW
    GW --> AuthMW
    AuthMW -->|Session Lookup| ShortMem
    GW -->|/api/auth| AuthApp
    GW -->|/api/me| UserCtrl
    GW -->|Protected /api/chat + x-user-id + x-user-plan| ChatApp
    GW -->|Protected /api/agent + x-user-id + x-user-plan| AgentApp
    GW -->|Protected /api/billing + x-user-id + x-user-plan| BillingApp

    AuthApp --> FBAdmin
    AuthApp --> UserDB
    AuthApp --> ShortMem

    ChatApp --> ConvDB
    ChatApp --> MsgDB

    AgentApp --> GraphEngine
    GraphEngine --> GroqLLM
    GraphEngine --> GeminiLLM
    GraphEngine --> DeepSeekLLM
    GraphEngine --> TavilyAPI
    GraphEngine --> QdrantDB
    GraphEngine --> CloudinaryCDN

    BillingApp --> RazorpayEngine
    BillingApp --> PayDB
    BillingApp -->|Sync Plan & Credits| AuthApp
```

---

## 2. Multi-Agent Graph Architecture (LangGraph)

The Agent microservice orchestrates autonomous specialist agents inside a compiled `StateGraph`:

```mermaid
flowchart TD
    Start([__start__]) --> Router[Router / Intent Classifier]

    Router -->|chat| ChatAgent[Chat Agent<br/>Groq Llama 3.3/3.1]
    Router -->|search| SearchAgent[Search Agent<br/>Tavily Search]
    Router -->|coding| CodingAgent[Coding Agent<br/>DeepSeek V3 / Groq 70B]
    Router -->|pdf| PdfAgent[PDF Document Agent<br/>PDFKit]
    Router -->|ppt| PptAgent[Presentation Agent<br/>PptxGenJS]
    Router -->|image / imageGen| ImageGenAgent[Image Gen Agent<br/>Pollinations / Cloudinary]
    Router -->|pdfRag / PDF file| PdfRagAgent[PDF RAG Agent<br/>text-embedding-004 + Qdrant]
    Router -->|imageAnalyzer / Image file| ImageAnalyzerAgent[Image Vision Agent<br/>Gemini 2.0 Flash]
    Router -->|resume| ResumeAgent[Resume Architect<br/>ATS Schema + Cloudinary]

    SearchAgent -->|Augmented Context| ChatAgent
    ChatAgent --> End([__end__])
    CodingAgent --> End
    PdfAgent --> End
    PptAgent --> End
    ImageGenAgent --> End
    PdfRagAgent --> End
    ImageAnalyzerAgent --> End
    ResumeAgent --> End
```

---

## 3. Dynamic Model Tiering & Margin Architecture

| User Tier | Routing & Chat | Coding Engine | Vision & RAG | Document & Resumes | Marginal Unit Profit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | Groq `llama-3.1-8b-instant` | Groq `llama-3.3-70b-versatile` | Gemini 2.0 Flash | Groq 8B / 70B | High Speed / Zero Cost |
| **Starter (₹299)** | Groq `llama-3.3-70b-versatile` | OpenRouter DeepSeek V3 | Gemini 2.0 Flash | Groq 70B + Cloudinary | **93%+ (₹280+ Net Profit)** |
| **Pro (₹499)** | Groq `llama-3.3-70b-versatile` | OpenRouter DeepSeek V3/R1 | Gemini 2.0 Flash | Gemini 2.0 Flash / Groq 70B | **90%+ (₹450+ Net Profit)** |

---

## 4. End-to-End Billing & Real-Time Sync Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Client Browser
    participant Gateway as API Gateway (:8000)
    participant Billing as Billing Service (:8004)
    participant Razorpay as Razorpay API
    participant Auth as Auth Service (:8001)
    participant Redis as Redis Session Cache
    participant Mongo as MongoDB

    User->>Gateway: POST /api/billing/create-order { plan: "starter" }
    Gateway->>Billing: Proxy with x-user-id
    Billing->>Razorpay: orders.create({ amount: 29900, currency: "INR" })
    Razorpay-->>Billing: order object
    Billing->>Mongo: Store Payment Record (status: "created")
    Billing-->>User: { order, plan }

    User->>Razorpay: Open Razorpay Checkout Modal
    Razorpay-->>User: Returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }

    User->>Gateway: POST /api/billing/verify-payment { order_id, payment_id, signature }
    Gateway->>Billing: Proxy verification request
    Billing->>Billing: crypto.createHmac("sha256").update(order_id + "|" + payment_id).digest("hex")
    Billing->>Mongo: Mark payment status as "paid"
    Billing->>Auth: POST /update-plan { userId, plan, credits }
    Auth->>Mongo: Update user.plan, user.credits, user.planExpiresAt
    Auth->>Redis: Update cached user session in Redis
    Billing-->>User: { success: true, message: "Payment verified" }

    User->>Gateway: POST /api/me (Fetch fresh profile)
    Gateway-->>User: { user: { plan: "starter", credits: 500, ... } }
    User->>User: Redux dispatch(setUserData), update badge & close drawer
```

---

## 5. Security & Isolation Matrix

1. **Authentication & Identity**:
   - HTTP-only session cookie set with strict expiry (7 days) and sanitized session UUID keys.
   - Gateway verifies sessions against Redis and dynamically injects `x-user-id` and `x-user-plan` to protected downstream services.
2. **Payment Integrity**:
   - Razorpay HMAC verification is calculated server-side. No client-supplied credit or plan values are ever trusted.
3. **Execution Sandboxing**:
   - Code artifacts generated by the coding agent run strictly in a sandboxed iframe (`sandbox="allow-scripts"`).
4. **Rate Limiting & Abuse Prevention**:
   - Redis-backed rate limiting per user per agent with exponential TTL backoff.
