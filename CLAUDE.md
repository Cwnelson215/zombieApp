# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZombieApp is a full-stack web application for organizing zombie tag games. Players can create/join games, track infections, and manage game timers with real-time updates via WebSocket.

## Development Commands

### Frontend (from root directory)
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (from service/ directory)
```bash
npm start        # Run server
npm run watch    # Run with nodemon (auto-restart)
npm run cleanup  # Run database cleanup script
```

The backend runs on port 4000 by default (or pass custom port as CLI argument). Vite proxies `/api` and `/socket.io` requests to `localhost:4000`.

### Deployment
Deployment is automated via GitHub Actions. Pushing to `main` triggers a Docker build, ECR push, and ECS service update. Infrastructure is managed with Pulumi (see `infra/`).

## Architecture

### Frontend
- **React SPA** with React Router for navigation
- **Entry**: `index.jsx` → `src/app.jsx` (routing)
- **Structure**: Feature-based folders under `src/` (home, create, enter, join, waitroom, running, components, socket, utils)
- **UI**: React Bootstrap + custom CSS per component
- **Auth tokens** stored in localStorage
- **Real-time updates** via Socket.io client (`src/socket/SocketContext.jsx`)

### Backend
- **Express.js** REST API at `service/index.js`
- **Socket.io** for real-time WebSocket communication
- **MongoDB** (Atlas) for persistence - connection config in `service/dbConfig.json` (gitignored)
- **Token-based auth** using HTTP-only cookies
- **Web Push Notifications** for infection alerts

### API Endpoints
- `POST /api/game/create` - Create game, returns joinCode
- `POST /api/game/check` - Verify game exists
- `POST /api/game/getPlayers` - Fetch players in a game
- `POST /api/game/start` - Start game and choose first infected
- `POST /api/player/add` - Add player to game, returns authToken
- `GET /api/push/vapidPublicKey` - Get VAPID key for push notifications
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications

### WebSocket Events
- `join-game` - Player joins a game room
- `player-joined` - Broadcast when new player joins
- `infection-update` - Broadcast infection status changes
- `end-game` - Broadcast game end
- `disconnect` - Handle player disconnection (includes owner transfer)

### Data Model
**Game Schema:**
```javascript
{
  joinCode: String,        // 6-char alphanumeric
  players: [{
    name: String,
    profilePic: Number,    // 1, 2, or 3
    status: Boolean,       // infection status
    authToken: String,     // 4-digit token
    pushSubscription: Object  // optional
  }],
  timer: Number,
  endTime: Number,
  ownerAuthToken: String,
  status: String           // 'waiting' or 'running'
}
```

### External APIs
- Meow Facts API (https://meowfacts.herokuapp.com/) - displays cat facts on home page

## Key Routes
- `/` - Home page
- `/create` - Create game
- `game/enter` - Enter join code
- `game/:joinCode/join` - Player setup (nickname + profile pic)
- `game/:joinCode/waitroom` - Waiting room
- `game/:joinCode/running` - Active gameplay

## Notes
- Profile pictures are limited to 3 hardcoded options (`/images/pic1.jpeg`, `pic2.jpeg`, `pic3.jpeg`)
- Games auto-delete from database when all players leave
- Game ownership transfers if the owner disconnects
