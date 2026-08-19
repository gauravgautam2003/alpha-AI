# Alpha AI system design

## Component diagram

```mermaid
flowchart LR
    U[User] --> F[React + Vite frontend]
    F -->|Firebase Google sign-in| FA[Firebase Authentication]
    F -->|Firebase ID token| G[Express API gateway]

    G -->|/api/auth| AU[Auth service]
    G -->|/api/me| GM[Current-user controller]
    G -->|Protected /api/chat<br/>x-user-id header| CH[Chat service]
    G -->|/api/agent| AG[Agent service]

    AU -->|Verify ID token| FAA[Firebase Admin]
    AU --> US[(MongoDB: users)]
    AU --> RS[(Redis: sessions)]
    GM --> RS
    G -->|Validate session cookie| RS

    CH --> CO[(MongoDB: conversations)]
    CH --> ME[(MongoDB: messages)]

    AG --> LG[LangGraph router]
    LG --> CA[Chat agent]
    LG --> SA[Search agent]
    LG --> CDA[Coding agent]
    LG --> PA[PDF agent]
    LG --> PPA[Presentation agent]
    LG --> IGA[Image-generation agent]
    SA --> CA
    AG -->|Save user and assistant messages| CH
    AG -->|Conversation memory| MEM[In-memory message history]
```

## Authentication flow

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
    Auth->>Firebase: Verify ID token
    Auth->>Mongo: Find or create user
    Auth->>Redis: Store seven-day session
    Auth-->>Web: Set HTTP-only session cookie + user
```

## Prompt and persistence flow

```mermaid
sequenceDiagram
    participant Web as React frontend
    participant Gateway as API gateway
    participant Agent as Agent service
    participant Graph as LangGraph
    participant Chat as Chat service
    participant Mongo as MongoDB

    Web->>Gateway: POST /api/agent/chat
    Gateway->>Agent: Proxy prompt and conversation ID
    Agent->>Chat: Save user message
    Chat->>Mongo: Persist message
    Agent->>Graph: Route prompt to specialist agent
    Graph-->>Agent: AI response
    Agent->>Chat: Save assistant message
    Chat->>Mongo: Persist message
    Agent-->>Web: AI response
```

## Service responsibilities

| Component | Responsibility |
| --- | --- |
| Frontend | Sign-in UI, chat workspace, Redux client state, API calls |
| Gateway | CORS, cookie parsing, session validation, routing/proxying, trusted user-ID propagation to chat |
| Auth service | Firebase Admin verification, user provisioning, Redis session lifecycle |
| Chat service | Conversation and message persistence in MongoDB |
| Agent service | Prompt routing, specialist-agent execution, short-term conversation memory, message saving |
| Redis | Session store with seven-day expiry |
| MongoDB | User, conversation, and message records |
