import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {createGame, addPlayer, findGame} from "./database.js"

const app = express();

const authCookieName = 'token';
const fontendPath = 'public';

// The scores and users are saved in memory and disappear whenever the service is restarted.
let users = [];
let scores = [];

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 3000;

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
    gameFound: !!game
  });
});

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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
