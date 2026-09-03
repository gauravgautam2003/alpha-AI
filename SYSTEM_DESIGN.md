# Alpha AI system design

This document describes the implemented request path between the React workspace, the API gateway, backend services, external providers, and persistence layers.

## Component diagram

```mermaid
flowchart LR
    U[User] --> F[React + Vite frontend]
    F -->|Google sign-in popup| FA[Firebase Authentication]
    F -->|HTTP requests with session cookie| G[Express API gateway]

    G -->|/api/auth| AU[Auth service]
    G -->|/api/me| GM[Current-user controller]
    G -->|Protected /api/chat<br/>x-user-id header| CH[Chat service]
    G -->|Protected /api/agent<br/>x-user-id header| AG[Agent service]
    G -->|Protected /api/billing<br/>x-user-id header| BI[Billing service]
    G -->|Validate session cookie| RS[(Redis)]

    AU -->|Verify ID token| FAA[Firebase Admin]
    AU --> US[(MongoDB: users)]
    AU -->|Create seven-day session| RS
    GM -->|Read session user| RS

    CH --> CO[(MongoDB: conversations)]
    CH --> ME[(MongoDB: messages)]

    AG --> LG[LangGraph workflow]
    LG --> RT[Router]
    RT --> CA[Chat agent]
    RT --> SA[Search agent]
    RT --> CDA[Coding agent]
    RT --> PA[PDF agent]
    RT --> PPA[Presentation agent]
    RT --> IGA[Image-generation agent]
    SA --> CA
    AG -->|Read/write last 20 messages| MEM[(Redis: 24-hour memory cache)]
    AG -->|Save user and assistant messages| CH
    SA --> TS[Tavily Search]
    IGA --> CL[Cloudinary]

    BI --> PAY[Razorpay]
    BI --> PM[(MongoDB: payments)]
    BI -->|Update plan and credits| AU
```

## Frontend composition

The frontend is a single React page assembled by `Home`:

| Area | Implementation responsibility |
| --- | --- |
| `Home` | Restores `/api/me`, shows the loading skeleton, and gates the workspace behind Google sign-in |
| `SideBar` | Loads conversations, creates a new-chat state, selects conversations, toggles collapse, opens billing, and logs out |
| `ChatArea` | Loads messages for the selected conversation and combines navigation, message list, and composer |
| `ChatInput` | Chooses `auto`, `chat`, `coding`, `pdf`, `ppt`, `image`, or `search`; creates a conversation on first send; submits prompts |
| `MessageBubble` | Renders Markdown/GFM, code blocks, images, lightbox viewing, external links, and artifact downloads |
| `Artifact` | Shows generated files in Monaco and previews `index.html` with related CSS and JavaScript in a sandboxed iframe |
| `BillingDrawer` | Displays plan/credit state and starts Razorpay upgrades |
| Redux store | Holds user, conversation, message, and artifact state |

The browser uses Axios with `withCredentials: true`, so the server-managed `session` cookie is sent to the gateway. The artifact panel is rendered only at the extra-large responsive breakpoint; message-level downloads remain available independently.

## Authentication and session flow

```mermaid
sequenceDiagram
    participant User
    participant Web as React frontend
    participant Firebase as Firebase Auth
    participant Gateway as API gateway
    participant Auth as Auth service
    participant Redis
    participant Mongo as MongoDB

    User->>Web: Selects Continue with Google
    Web->>Firebase: Google sign-in popup
    Firebase-->>Web: Firebase ID token
    Web->>Gateway: POST /api/auth/login { token }
    Gateway->>Auth: Proxy request
    Auth->>Firebase: Verify ID token with Firebase Admin
    Auth->>Mongo: Find or create user
    Auth->>Redis: Store user session for seven days
    Auth-->>Web: Set HTTP-only session cookie + user
    Web->>Gateway: Protected request with cookie
    Gateway->>Redis: Validate session
    Gateway->>Gateway: Attach trusted x-user-id for protected proxies
```

Unauthenticated protected requests receive `401`. The gateway also clears an expired session cookie. CORS is restricted to the configured frontend origin and credentials are enabled for cookie transport.

## Prompt, routing, and persistence flow

```mermaid
sequenceDiagram
    participant Web as React frontend
    participant Gateway as API gateway
    participant Agent as Agent service
    participant Cache as Redis memory cache
    participant Graph as LangGraph
    participant Chat as Chat service
    participant Mongo as MongoDB
    participant Provider as LLM/search/media provider

    Web->>Gateway: POST /api/agent/chat { prompt, conversationId, agent }
    Gateway->>Agent: Proxy request with x-user-id
    Agent->>Chat: Save user message
    Chat->>Mongo: Persist user message
    Agent->>Cache: Load conversation context
    Agent->>Graph: Invoke prompt, user, agent, and optional file
    Graph->>Graph: Respect manual mode or ask router LLM
    Graph->>Provider: Execute selected specialist task
    Provider-->>Graph: Response, images, or artifacts
    Graph-->>Agent: Normalized result
    Agent->>Cache: Append user/assistant context and cap at 20 messages
    Agent->>Chat: Save assistant response and generated outputs
    Chat->>Mongo: Persist assistant message
    Agent-->>Web: answer, images, and artifacts
```

`auto` uses the router's classification rules. A manually selected mode bypasses classification. Search flows pass through the search agent and then the chat agent for response composition. Other specialist nodes return directly to the workflow end.

## Billing flow

```mermaid
sequenceDiagram
    participant Web as Billing drawer
    participant Gateway as API gateway
    participant Billing as Billing service
    participant Razorpay
    participant Mongo as MongoDB
    participant Auth as Auth service

    Web->>Gateway: POST /api/billing/create { plan }
    Gateway->>Billing: Proxy request with x-user-id
    Billing->>Razorpay: Create INR order
    Billing->>Mongo: Store created payment
    Billing-->>Web: Order details
    Web->>Razorpay: Open checkout
    Razorpay-->>Web: Payment identifiers and signature
    Web->>Gateway: POST /api/billing/verify
    Gateway->>Billing: Proxy verification request
    Billing->>Billing: Verify HMAC signature
    Billing->>Mongo: Mark payment as paid
    Billing->>Auth: Update user plan and credits
```

The frontend currently exposes Starter and Pro plans. Payment verification and credit updates must remain server-side responsibilities.

## Service responsibilities

| Component | Responsibility |
| --- | --- |
| Frontend | Authentication UI, responsive chat workspace, Redux state, API calls, Markdown and artifact presentation |
| Gateway | CORS, JSON/cookie middleware, Redis session validation, route proxying, and trusted user-ID propagation |
| Auth service | Firebase Admin verification, user provisioning, session lifecycle, and plan/credit updates |
| Chat service | Conversation and message persistence in MongoDB |
| Billing service | Razorpay order creation, payment signature verification, payment records, and plan upgrades |
| Agent service | Request validation, LangGraph execution, specialist coordination, response normalization, and message persistence orchestration |
| Router | Manual agent selection or LLM-based classification into one specialist |
| Redis | Seven-day sessions and 24-hour, capped short-term conversation memory |
| MongoDB | User, conversation, message, and payment records |
| Firebase | Google identity and ID-token issuance |
| External providers | LLM inference, Tavily web search, Cloudinary media storage, and Razorpay payments |

## Important implementation notes

- The agent controller can accept a multipart file, but the current composer only exposes visual attachment controls; upload behavior is not wired into the UI yet.
- The artifact preview uses `sandbox="allow-scripts"` and should continue to treat generated HTML as untrusted content.
- Billing routes are intended to expose `/create` and `/verify` through the gateway. The billing route file currently registers both controller handlers under `/create`, so verification routing should be corrected before enabling production payments.
- Conversation ownership and downstream authorization should be enforced consistently in the chat service before production deployment.
