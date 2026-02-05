# ZombieApp

A web app for organizing and playing games of zombie tag. One player creates a game, shares a join code, and once everyone is in, the game begins -- a random player is chosen as patient zero, and from there it's a race to survive. Infections are tracked in real time so every player knows who's still human and who's turned.

## How It Works

1. **Create a game** -- Set a timer and get a 6-character join code to share with friends.
2. **Join a game** -- Enter the join code, pick a nickname and profile picture, then wait in the lobby.
3. **Play** -- The game owner starts the match. One random player becomes the first zombie. When you tag someone, they tap "Announce Infection" and everyone is notified instantly via WebSocket and push notifications.
4. **Survive** -- The game ends when the timer runs out or all players are infected.

## Key Features

- Real-time infection tracking via WebSocket
- Push notifications when a player gets tagged
- Shareable join codes for easy game setup
- Countdown timer with automatic game end
- Automatic game cleanup when all players leave

## Tech Stack

- **Frontend:** React, React Router, React Bootstrap, Vite
- **Backend:** Express.js, Socket.io, MongoDB (Atlas)
- **Deployment:** Docker, AWS ECS/ECR, GitHub Actions, Pulumi

## Running Locally

**Frontend** (from root):
```bash
npm run dev
```

**Backend** (from `service/`):
```bash
npm start
```

The backend runs on port 4000. Vite proxies `/api` and `/socket.io` requests to `localhost:4000`.