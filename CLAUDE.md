# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZombieApp is a full-stack web application for organizing zombie tag games. Players can create/join games, track infections, and manage game timers.

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
```

The backend runs on port 4000 by default (or pass custom port as CLI argument). Vite proxies `/api` requests to `localhost:3000`.

### Deployment
```bash
./deployService.sh  # Deploy to production (startup.infect.fyi)
```

## Architecture

### Frontend
- **React SPA** with React Router for navigation
- **Entry**: `index.jsx` → `src/app.jsx` (routing)
- **Structure**: Feature-based folders under `src/` (home, create, enter, join, waitroom, running)
- **UI**: React Bootstrap + custom CSS per component
- **Auth tokens** stored in localStorage

### Backend
- **Express.js** REST API at `service/index.js`
- **MongoDB** (Atlas) for persistence - connection config in `service/dbConfig.json` (gitignored)
- **Token-based auth** using HTTP-only cookies

### API Endpoints
- `POST /api/game/create` - Create game, returns joinCode
- `POST /api/player/add` - Add player to game, returns authToken
- `POST /api/game/check` - Verify game exists
- `POST /api/game/getPlayers` - Fetch players in a game

### Data Model
Games contain a 6-character alphanumeric joinCode and an array of players, each with name, profilePic URL, infection status, and authToken.

### External APIs
- Meow Facts API (https://meowfacts.herokuapp.com/) - displays cat facts on home page

## Key Routes
- `/` - Home page
- `/create` - Create game
- `/game/enter` - Enter join code
- `/game/:joinCode/join` - Player setup (nickname + profile pic)
- `/game/:joinCode/waitroom` - Waiting room
- `/running` - Active gameplay

## Notes
- Profile pictures are limited to 3 hardcoded options (`/images/pic1.jpeg`, `pic2.jpeg`, `pic3.jpeg`)
- WebSocket for real-time updates is planned but not yet implemented
- Game logic (timer, infection tracking) currently runs client-side
