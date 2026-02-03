import 'dotenv/config';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import {createGame, addPlayer, findGame, findPlayer, updatePlayerStatus, savePushSubscription, removePushSubscription, getPushSubscriptionsForGame} from "./database.js"

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
    origin: ["http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST"]
  }
});

const authCookieName = 'token';
const fontendPath = 'public';

// The scores and users are saved in memory and disappear whenever the service is restarted.
let users = [];
let scores = [];

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static(fontendPath));

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
    const game = await createGame(req.body.timer);
    console
    res.json({
        joinCode: game.joinCode,
    })
});

apiRouter.post('/player/add', async (req, res) => {
    const game = await findGame(req.body.joinCode);
    if (!game) {
        res.status(404).send({ msg: 'Game not found' });
        return;
    }
    const player = await addPlayer(req.body.joinCode, req.body.nickname, req.body.profilePicture);
    res.json({
        joinCode: game.joinCode,
        authToken: player.authToken
    });
});

apiRouter.post('/game/check' , async (req, res) => {
  const game = await findGame(req.body.joinCode);
  console.log(game)
  res.status(200).json({
    gameFound: !!game,
  });
});

apiRouter.post('/game/getPlayers', async (req, res) => {
  const game = await findGame(req.body.joinCode)
  if(!game){
    res.status(404)
  } else{
    res.json({
      players: game.players
    });
  }

});

// Get VAPID public key for push subscription
apiRouter.get('/push/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Subscribe to push notifications
apiRouter.post('/push/subscribe', async (req, res) => {
  const { joinCode, authToken, subscription } = req.body;
  console.log('[Push] Subscribe request:', { joinCode, authToken, hasSubscription: !!subscription });

  if (!joinCode || !authToken || !subscription) {
    console.log('[Push] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const success = await savePushSubscription(joinCode, authToken, subscription);
  console.log('[Push] Subscription saved:', success);

  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

// Unsubscribe from push notifications
apiRouter.post('/push/unsubscribe', async (req, res) => {
  const { joinCode, authToken } = req.body;
  if (!joinCode || !authToken) {
    return res.status(400).json({ error: 'Missing required fields' });
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

  socket.on('join-game', (joinCode) => {
    socket.join(joinCode);
    console.log(`Socket ${socket.id} joined game room: ${joinCode}`);
  });

  socket.on('infection-update', async ({ joinCode, authToken, newStatus }) => {
    const player = await updatePlayerStatus(joinCode, authToken, newStatus);
    if (player) {
      io.to(joinCode).emit('player-infected', {
        playerName: player.name,
        newStatus: newStatus,
        authToken: authToken
      });
      console.log(`Player ${player.name} infection status changed to ${newStatus} in game ${joinCode}`);

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
    socket.to(joinCode).emit('player-list-updated');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
