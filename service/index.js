import 'dotenv/config';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import {createGame, addPlayer, findGame, findPlayer, updatePlayerStatus, savePushSubscription, removePushSubscription, getPushSubscriptionsForGame, startGame, transferOwner, findGameByPlayerAuth, removePlayer, deleteGame} from "./database.js"

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('[Push] Web push configured with VAPID keys');
} else {
  console.warn('[Push] WARNING: VAPID keys not configured! Push notifications will not work.');
  console.warn('[Push] Make sure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set in .env');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://infect.cwnel.com"]
      : ["http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST"]
  }
});

const authCookieName = 'token';
const fontendPath = 'public';

// Input validation helpers
function isValidJoinCode(code) {
  return typeof code === 'string' && /^[A-Za-z0-9]{6}$/.test(code);
}

function isValidAuthToken(token) {
  return typeof token === 'string' && token.length >= 4 && token.length <= 16 && /^[A-Za-z0-9_-]+$/.test(token);
}

function isValidNickname(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

function isValidProfilePicture(pic) {
  return Number.isInteger(pic) && pic >= 1 && pic <= 3;
}

function isValidTimer(timer) {
  return Number.isInteger(timer) && (timer === 0 || (timer >= 5 && timer <= 90));
}

// The scores and users are saved in memory and disappear whenever the service is restarted.
let users = [];
const disconnectTimeouts = new Map(); // "joinCode:authToken" -> timeoutId

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.env.PORT || (process.argv.length > 2 ? process.argv[2] : 4000);

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static(fontendPath));

// Health check endpoint (required for ECS)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

// Middleware to verify that the user is authorized to call an endpoint
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

apiRouter.post('/game/create', async (req, res) => {
    const timer = req.body.timer;
    if (!isValidTimer(timer)) {
      return res.status(400).json({ error: 'Timer must be 0 (no timer) or between 5 and 90 minutes' });
    }
    const game = await createGame(timer);
    res.json({
        joinCode: game.joinCode,
        ownerAuthToken: game.ownerAuthToken,
    })
});

apiRouter.post('/player/add', async (req, res) => {
    const { joinCode, nickname, profilePicture, ownerAuthToken } = req.body;
    if (!isValidJoinCode(joinCode)) {
      return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
    }
    if (!isValidNickname(nickname)) {
      return res.status(400).json({ error: 'Nickname must be 1-20 characters' });
    }
    if (!isValidProfilePicture(profilePicture)) {
      return res.status(400).json({ error: 'Profile picture must be 1, 2, or 3' });
    }
    const game = await findGame(joinCode);
    if (!game) {
        res.status(404).send({ msg: 'Game not found' });
        return;
    }
    const player = await addPlayer(joinCode, nickname.trim(), profilePicture, ownerAuthToken);
    if (player.error) {
        res.status(400).send({ msg: player.error });
        return;
    }
    res.json({
        joinCode: game.joinCode,
        authToken: player.authToken,
        isOwner: player.isOwner
    });
});

apiRouter.post('/game/check' , async (req, res) => {
  if (!isValidJoinCode(req.body.joinCode)) {
    return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
  }
  const game = await findGame(req.body.joinCode);
  res.status(200).json({
    gameFound: !!game,
  });
});

apiRouter.post('/player/session', async (req, res) => {
  const { authToken } = req.body;
  if (!authToken) {
    return res.status(400).json({ active: false });
  }
  const game = await findGameByPlayerAuth(authToken);
  if (game) {
    res.json({ active: true, joinCode: game.joinCode, status: game.status });
  } else {
    res.json({ active: false });
  }
});

apiRouter.post('/game/getPlayers', async (req, res) => {
  if (!isValidJoinCode(req.body.joinCode)) {
    return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
  }
  const game = await findGame(req.body.joinCode)
  if(!game){
    res.status(404).send({ msg: 'Game not found' });
  } else{
    res.json({
      players: game.players,
      ownerAuthToken: game.ownerAuthToken,
      status: game.status,
      endTime: game.endTime,
      serverTime: Date.now()
    });
  }
});

apiRouter.post('/game/start', async (req, res) => {
  const { joinCode, authToken } = req.body;
  if (!isValidJoinCode(joinCode)) {
    return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
  }
  if (!isValidAuthToken(authToken)) {
    return res.status(400).json({ error: 'Invalid auth token' });
  }
  const result = await startGame(joinCode, authToken);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  io.to(joinCode.toUpperCase()).emit('game-started', {
    firstInfectedAuthToken: result.firstInfected.authToken,
    firstInfectedName: result.firstInfected.name,
    endTime: result.endTime,
    serverTime: Date.now()
  });
  res.json(result);
});

// Get VAPID public key for push subscription
apiRouter.get('/push/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Subscribe to push notifications
apiRouter.post('/push/subscribe', async (req, res) => {
  const { joinCode, authToken, subscription } = req.body;

  if (!isValidJoinCode(joinCode)) {
    return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
  }
  if (!isValidAuthToken(authToken)) {
    return res.status(400).json({ error: 'Invalid auth token' });
  }
  if (!subscription || typeof subscription !== 'object' || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid push subscription' });
  }

  const success = await savePushSubscription(joinCode, authToken, subscription);

  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

// Unsubscribe from push notifications
apiRouter.post('/push/unsubscribe', async (req, res) => {
  const { joinCode, authToken } = req.body;
  if (!isValidJoinCode(joinCode)) {
    return res.status(400).json({ error: 'Join code must be exactly 6 alphanumeric characters' });
  }
  if (!isValidAuthToken(authToken)) {
    return res.status(400).json({ error: 'Invalid auth token' });
  }

  const success = await removePushSubscription(joinCode, authToken);
  res.json({ success });
});

// Helper function to send push notifications
async function sendPushNotifications(joinCode, excludeAuthToken, payload) {
  console.log('[Push] Sending notifications for game:', joinCode, 'excluding:', excludeAuthToken);

  const subscriptions = await getPushSubscriptionsForGame(joinCode, excludeAuthToken);
  console.log('[Push] Found subscriptions:', subscriptions.length);

  if (subscriptions.length === 0) {
    console.log('[Push] No subscriptions to send to');
    return;
  }

  const notifications = subscriptions.map(async ({ subscription, playerName }) => {
    try {
      console.log('[Push] Sending to player:', playerName);
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('[Push] Sent successfully to:', playerName, result.statusCode);
    } catch (error) {
      console.log('[Push] Failed for player:', playerName, error.message, error.statusCode);
      // If subscription is invalid (410 Gone), we could clean it up here
    }
  });

  await Promise.allSettled(notifications);
} 

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: fontendPath });
});

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email: email,
    password: passwordHash,
    token: uuid.v4(),
  };
  users.push(user);

  return user;
}

async function findUser(field, value) {
  if (!value) return null;

  return users.find((u) => u[field] === value);
}



// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-game', (joinCode, authToken) => {
    const room = joinCode.toUpperCase();
    socket.join(room);
    socket.joinCode = room;
    socket.authToken = authToken;

    // Cancel any pending disconnect timeout for this player
    const timeoutKey = `${room}:${authToken}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
      console.log(`Reconnect: cancelled disconnect timeout in ${room}`);
    }

    console.log(`Socket ${socket.id} joined game room: ${room}`);
  });

  socket.on('infection-update', async ({ joinCode, authToken, newStatus }) => {
    const room = joinCode.toUpperCase();
    const player = await updatePlayerStatus(joinCode, authToken, newStatus);
    if (player) {
      io.to(room).emit('player-infected', {
        playerName: player.name,
        newStatus: newStatus,
        authToken: authToken
      });
      console.log(`Infection status updated in game ${room}`);

      // Send push notifications to other players
      const statusText = newStatus ? 'infected' : 'cured';
      await sendPushNotifications(joinCode, authToken, {
        title: 'Infection Alert!',
        body: `${player.name} has been ${statusText}!`,
        icon: '/images/pic1.jpeg',
        tag: 'infection-notification'
      });
    }
  });

  socket.on('player-joined', (joinCode) => {
    socket.to(joinCode.toUpperCase()).emit('player-list-updated');
  });

  socket.on('end-game', async ({ joinCode, authToken }) => {
    const room = joinCode.toUpperCase();
    const game = await findGame(joinCode);
    if (game && game.ownerAuthToken === authToken) {
      // Clear all pending disconnect timeouts for this game
      for (const [key, timeoutId] of disconnectTimeouts) {
        if (key.startsWith(`${room}:`)) {
          clearTimeout(timeoutId);
          disconnectTimeouts.delete(key);
        }
      }
      io.to(room).emit('game-ended');
      console.log(`Game ${room} ended by owner`);
      await deleteGame(joinCode);
      console.log(`Game ${room} deleted from database`);
    }
  });

  socket.on('leave-game', async ({ joinCode, authToken }, callback) => {
    const room = joinCode.toUpperCase();
    // Clear any pending disconnect timeout for this player
    const timeoutKey = `${room}:${authToken}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
    }
    socket.leave(room);
    const updatedGame = await removePlayer(joinCode, authToken);
    if (updatedGame && updatedGame.players.length === 0) {
      await deleteGame(joinCode);
      console.log(`Game ${room} deleted (last player left)`);
    } else {
      console.log(`Player removed from game ${room}`);
    }
    if (typeof callback === 'function') callback();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.joinCode && socket.authToken) {
      const room = socket.joinCode;
      const authToken = socket.authToken;
      const timeoutKey = `${room}:${authToken}`;

      console.log(`Starting 60s grace period for player in ${room}`);
      const timeoutId = setTimeout(async () => {
        disconnectTimeouts.delete(timeoutKey);
        console.log(`Grace period expired for player in ${room}, removing player`);
        const game = await findGame(room);
        if (game && game.status === 'waiting' && game.ownerAuthToken === authToken) {
          const result = await transferOwner(room, authToken);
          if (result.success) {
            console.log(`Owner transferred in game ${room}`);
            io.to(room).emit('owner-changed', {
              newOwnerAuthToken: result.newOwnerAuthToken,
              newOwnerName: result.newOwnerName
            });
          }
        }
        const updatedGame = await removePlayer(room, authToken);
        if (updatedGame && updatedGame.players.length === 0) {
          await deleteGame(room);
          console.log(`Game ${room} deleted (last player disconnected)`);
        }
      }, 60000);

      disconnectTimeouts.set(timeoutKey, timeoutId);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
