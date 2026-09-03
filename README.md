# Alpha AI

Alpha AI is a full-stack, multi-agent AI workspace. It combines a focused chat interface with persistent conversations, specialist AI modes, generated media, downloadable files, and a browser-based artifact viewer.

## Website analysis

### Product experience

The frontend is a desktop-first creative studio with a compact, dark glass interface. After authentication, the user works in three areas:

- **Conversation sidebar:** starts a new chat, switches between recent conversations, collapses on large screens, opens billing, and signs out.
- **Chat workspace:** displays the selected conversation, message count, Markdown answers, syntax-highlighted code, tables, links, generated images, and file downloads.
- **Artifact workspace:** appears for generated files on extra-large screens. It provides file tabs, a read-only Monaco editor, copy-to-clipboard, and an HTML/CSS/JavaScript preview in a sandboxed iframe.

### Main user flow

1. The app checks for an existing server session through `/api/me` and shows a loading skeleton while it does so.
2. Unauthenticated users see a Google sign-in modal powered by Firebase Authentication.
3. The user creates or selects a conversation from the sidebar.
4. A prompt is submitted with `Enter`, or with `Shift+Enter` for a new line. A new conversation is created automatically and its first prompt becomes the title.
5. The selected agent sends the request through the gateway. Responses are rendered as Markdown and may include images, downloadable artifacts, or code.
6. Conversation history and the latest artifacts are restored when a saved conversation is selected.

### Available AI modes

The composer exposes these modes:

| Mode | Intended use |
| --- | --- |
| Auto | Let the backend route the request |
| Chat | General conversation and assistance |
| Coding | Programming and code-generation tasks |
| PDF | PDF-oriented generation tasks |
| PPT | Presentation generation tasks |
| Image | Image-generation tasks |
| Search | Web-search-oriented tasks |

### Visual and interaction design

- Dark navy glass surfaces with cyan and blue action accents
- Responsive layout with a collapsible sidebar and an artifact panel available at `xl` widths
- Motion-based entrance, hover, and panel transitions using Motion
- Markdown chat presentation with GFM tables, external-link indicators, copyable code blocks, image lightbox viewing, and lazy-loaded images
- Billing drawer showing the current plan and credits, with Starter and Pro Razorpay upgrade actions

### Current frontend limitations

- Attachment and microphone buttons are present visually but do not yet start upload or voice workflows.
- Share and conversation-options buttons currently have no connected action.
- The artifact panel is hidden below the extra-large breakpoint, so generated files remain accessible through message downloads on smaller screens.
- Billing requires the Razorpay browser script and `VITE_RAZORPAY_KEY_ID` to be configured.
- Error handling is currently surfaced as a generic send failure in the composer; richer retry and notification states would improve production readiness.

## Architecture

The application uses a React single-page frontend and an Express-based microservice backend. The gateway owns browser-facing API routes and session checks; feature services own authentication, persisted chat history, billing, and agent orchestration.

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for the component diagram and request flows.

## Features

- Google sign-in through Firebase Authentication
- Server-managed HTTP-only Redis sessions
- Conversation creation, renaming, history retrieval, and message persistence
- Agent routing with LangGraph
- Specialist chat, search, coding, PDF, presentation, and image-generation agents
- Redux state management and Markdown-rendered chat responses
- Code artifact inspection and HTML preview
- Razorpay plan upgrades and credit tracking

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Redux Toolkit, Tailwind CSS, Axios, Firebase Web SDK, Motion |
| UI and content | React Icons, React Markdown, Remark GFM, Monaco Editor, Prism syntax highlighting |
| Gateway | Node.js, Express, `express-http-proxy`, CORS, cookie-parser |
| Services | Node.js, Express, LangChain/LangGraph |
| Data | MongoDB with Mongoose, Redis with ioredis |
| Authentication and payments | Firebase Admin, Google sign-in, Razorpay |

## Repository layout

```text
frontend/                 React + Vite web application
  src/pages/              Top-level screens
  src/components/         Sidebar, chat, billing, and artifact UI
  src/features/           API request helpers
  src/redux/              User, conversation, and message state
backend/
  gateway/                Public API gateway and session middleware
  services/
    auth/                 Firebase token verification and user/session creation
    chat/                 Conversations and messages API
    billing/              Plans, orders, and payment verification
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
- API credentials required by the configured agent integrations
- Razorpay credentials if billing is enabled

## Local setup

1. Start Redis from the backend directory:

   ```bash
   cd backend
   docker compose up -d redis
   ```

2. Install dependencies for the frontend and each backend package:

   ```bash
   cd frontend && npm install
   cd ../backend/gateway && npm install
   cd ../services/auth && npm install
   cd ../chat && npm install
   cd ../billing && npm install
   cd ../agent && npm install
   ```

3. Create the environment files below. Keep all `.env` files and Firebase service-account credentials out of version control.

4. Start the gateway, auth, chat, billing, and agent services in separate terminals. Start the frontend with:

   ```bash
   cd frontend
   npm run dev
   ```

The Vite development server is configured for port `3000`.

## Frontend commands

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Environment variables

The exact model-provider variables depend on the agents configured in `backend/services/agent`.

### Frontend (`frontend/.env`)

```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Gateway (`backend/gateway/.env`)

```env
PORT=8000
FRONTEND_URL=http://localhost:3000
AUTH_SERVICE=http://localhost:5001
CHAT_SERVICE=http://localhost:5002
BILLING_SERVICE=http://localhost:5004
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
# Add the LLM, search, Cloudinary, and media-provider keys used by your agents.
```

### Billing service (`backend/services/billing/.env`)

```env
PORT=5004
MONGODB_URI=your_mongodb_connection_string
# Add the Razorpay credentials used by the billing service.
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
| `/api/billing/create-order` | POST | Creates a Razorpay plan order |
| `/api/billing/verify-payment` | POST | Verifies a completed payment |

## Security notes

- Keep `.env` files and Firebase service-account JSON files private.
- Configure secure cookies (`secure: true`) and appropriate `sameSite` values before deploying over HTTPS.
- Restrict `FRONTEND_URL` to the deployed frontend origin.
- Enforce ownership checks on conversation and message mutations before production use.
- Keep artifact preview sandboxed and validate generated/downloaded URLs server-side.
- Validate payment signatures only on the server and never trust client-provided plan or credit values.

## License

This project is licensed under the [MIT License](LICENSE).
