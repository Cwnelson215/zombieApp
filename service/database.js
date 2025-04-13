import crypto from "crypto";
import { join } from "path";
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json')

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('infect');
const gameCollection = db.collection('games');

(async function testConnection() {
    try {
        await db.command({ ping: 1});
        console.log(`Connect to database`);
    }   catch(ex) {
        console.log(`Unable to connect to database with ${url} because ${ex.message}`)
        process.exit(1);
    }
})();

function createGame(joinCode, length) {
    return client.db.gameCollection.insertOne(
        {
            _id: joinCode,
            players: [],
            timer: length,
            endTime: 0
        }
    );
}

async function addPlayer(joinCode, nickName, picNumber) {
    const result = client.db.gameCollection.findOne({ _id: joinCode});
    if(result) {
        await client.db.gameCollection.players.insertOne({
            name: nickName,
            profilePic: picNumber,
            status: false
        }
        );
    } else {
        console.log(`No game found with join code '${joinCode}`);
    }
}


module.exports = {
    createGame,
    addPlayer
}


// export class Database {
    
//     games = [];
    
//     constructor() {
//         return;
//     }

//     createGame(length) {
//         const game = new GameState(length);
//         this.games.push(game);
//         return game;
//     }
// }

// export class GameState {

//     players = [];

//     constructor(length) {
//         this.generateJoinCode();
//         this.endTime = 0;
//         this.length = length;
//     }

//     generateJoinCode(){
//         const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
//         let token = '';
//         for (let i = 0; i < 6; i++) {
//             const randomIndex = Math.floor(Math.random() * characters.length);
//             token += characters[randomIndex];
//         }
//         this.joinCode = token
//     }

//     startGame() {
//         if(this.length > 0) {
//            this.endTime = Date.now() + length;
//         }
        
//     }

//     addPlayer(name, profile_pic) {
//         const characters = '0123456789';
//         let token = '';
//         for (let i = 0; i < 4; i++) {
//             const randomIndex = Math.floor(Math.random() * characters.length);
//             token += characters[randomIndex];
//         }
//         const player = new PlayerState(name, profile_pic, token);
//         this.players.push(player);
//         return player;
//     }

// }

// export class PlayerState {
//     constructor(name, profile_pic, id) {
//         this.name = name;
//         this.id = id;
//         this.status = false;
//         this.profile_pic = profile_pic;
//         this.auth_token;
//     }
// }

