# MeetFlow Backend

Self-hosted video meeting platform backend with WebRTC signaling.

## Quick Start

```bash
cd backend
cp .env.example .env   # Edit with your values
npm install
npm run dev
```

## Requirements

- Node.js 18+
- MongoDB 6+
- Redis (optional, for scaling)

## API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login |
| `POST /api/auth/refresh-token` | Refresh JWT |
| `GET /api/auth/profile` | Get current user |
| `POST /api/meetings` | Create meeting |
| `GET /api/meetings` | User's meetings |
| `POST /api/meetings/:id/join` | Join meeting |
| `POST /api/meetings/:id/end` | End meeting |
| `GET /api/messages/:meetingId` | Get chat messages |
| `GET /api/admin/stats` | Admin statistics |

## Socket Events

### Client → Server
- `join-meeting` / `leave-meeting` / `end-meeting`
- `send-offer` / `send-answer` / `ice-candidate`
- `toggle-mic` / `toggle-camera` / `raise-hand`
- `start-screen-share` / `stop-screen-share`
- `chat-message` / `chat-typing`

### Server → Client
- `participant-joined` / `participant-left`
- `receive-offer` / `receive-answer` / `receive-ice`
- `meeting-updated` / `meeting-ended`
- `chat-received` / `chat-typing`
- `force-mute` / `force-remove`

## Architecture

```
src/
├── config/          # Environment & database config
├── interfaces/      # TypeScript interfaces
├── middlewares/      # Auth, validation, rate limiting, error handling
├── modules/
│   ├── auth/        # Registration, login, JWT
│   ├── users/       # Profile management
│   ├── meetings/    # CRUD + join/leave/end
│   ├── participants/# Live participant tracking
│   ├── messages/    # Chat persistence
│   ├── recordings/  # Recording metadata
│   └── admin/       # Analytics & management
├── sockets/         # Socket.IO signaling server
│   ├── index.ts     # Server init + connection handling
│   ├── meetingHandler.ts
│   ├── signalingHandler.ts
│   ├── chatHandler.ts
│   └── mediaHandler.ts
└── utils/           # Logger, errors, helpers
```
