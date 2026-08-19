# Alpha AI

Alpha AI is a full-stack, multi-agent chat application. Users sign in with Google, start and manage conversations, and receive responses from a routed AI workflow for chat, web search, coding, PDF, presentation, and image-generation tasks.

## Architecture

The application uses a React single-page frontend and an Express-based microservice backend. The gateway owns browser-facing API routes and session checks; the feature services own authentication, persisted chat history, and agent orchestration.

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for the component diagram and request flows.

## Features

- Google sign-in through Firebase Authentication
- Server-managed, HTTP-only Redis sessions
- Conversation creation, renaming, history retrieval, and message persistence
- Agent routing with LangGraph
- Specialized chat, search, coding, PDF, presentation, and image-generation agents
- Redux state management and Markdown-rendered chat responses

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Redux Toolkit, Tailwind CSS, Axios, Firebase Web SDK |
| Gateway | Node.js, Express, `express-http-proxy`, CORS, cookie-parser |
| Services | Node.js, Express, LangChain/LangGraph |
| Data | MongoDB with Mongoose, Redis with ioredis |
| Authentication | Firebase Admin token verification and Google sign-in |

## Repository layout

```text
frontend/                 React + Vite web application
backend/
  gateway/                Public API gateway and session middleware
  services/
    auth/                 Firebase token verification and user/session creation
    chat/                 Conversations and messages API
    agent/                LangGraph router and specialist agents
  shared/redis/           Shared Redis client
  docker-compose.yml      Local Redis service
SYSTEM_DESIGN.md          System architecture and data-flow diagram
```

## Prerequisites

- Node.js 20 or later
- A MongoDB deployment
- Docker Desktop (recommended for Redis)
- A Firebase project with Google authentication enabled
- API credentials required by the agent integrations

## Local setup

1. Start Redis from the backend directory:

   ```bash
   cd backend
   docker compose up -d redis
   ```

2. Install dependencies for the frontend, shared backend modules, and each service:

   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd gateway && npm install
   cd ../services/auth && npm install
   cd ../chat && npm install
   cd ../agent && npm install
   ```

3. Create environment files for the frontend and services. Do not commit them or Firebase service-account credentials.

4. Start the gateway, auth, chat, and agent services in separate terminals, then start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

## Environment variables

Use your deployed/local addresses and secrets. The exact model-provider variables depend on the agents configured in `backend/services/agent`.

### Frontend (`frontend/.env`)

```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
```

### Gateway (`backend/gateway/.env`)

```env
PORT=8000
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE=http://localhost:5001
CHAT_SERVICE=http://localhost:5002
AGENT_SERVICE=http://localhost:5003
REDIS_URL=redis://localhost:6379
```

### Auth service (`backend/services/auth/.env`)

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
```

### Chat service (`backend/services/chat/.env`)

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
```

### Agent service (`backend/services/agent/.env`)

```env
PORT=5003
MONGODB_URI=your_mongodb_connection_string
CHAT_SERVICE=http://localhost:5002
# Add the LLM, search, and media-provider keys used by your configured agents.
```

## API overview

All endpoints are exposed through the gateway under `/api`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/login` | POST | Verifies a Firebase ID token and creates a session cookie |
| `/api/auth/logout` | GET | Removes the current session |
| `/api/me` | GET | Returns the current authenticated user |
| `/api/chat/create-conversation` | GET | Creates a conversation for the signed-in user |
| `/api/chat/get-conversations` | GET | Lists the user's conversations |
| `/api/chat/get-messages/:conversationId` | GET | Reads conversation history |
| `/api/chat/save-message` | POST | Persists a chat message |
| `/api/chat/update-conversation` | POST | Updates a conversation title |
| `/api/agent/chat` | POST | Sends a prompt into the agent workflow |

## Security notes

- Keep `.env` files and Firebase service-account JSON files private.
- Configure secure cookies (`secure: true`) and appropriate `sameSite` values before deploying over HTTPS.
- Restrict `FRONTEND_URL` to the deployed frontend origin.
- Apply authorization checks to conversation/message mutations before production use.

## License

This project is licensed under the [MIT License](LICENSE).
