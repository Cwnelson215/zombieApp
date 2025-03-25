import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {Database} from "./database.mjs"

const app = express();

const authCookieName = 'token';
const db = new Database();

// The scores and users are saved in memory and disappear whenever the service is restarted.
let users = [];
let scores = [];

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 3001;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static('../dist'));

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
    const game = db.createGame(req.body.timer);
    res.json({
        joinCode: game.joinCode,
    })
});

apiRouter.post('/player/add', async (req, res) => {
    const game = db.games.find((g) => g.joinCode === req.body.joinCode);
    if (!game) {
        res.status(404).send({ msg: 'Game not found' });
        return;
    }
    const player = game.addPlayer(req.body.nickname, req.body.profilePicture);
    res.json({
        joinCode: game.joinCode,
        playerId: player.id,
    });
});

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: '../dist' });
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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
