import crypto from "crypto";
import { join } from "path";
import { MongoClient } from "mongodb";
import {readFileSync} from 'fs';


const config = JSON.parse(readFileSync('./dbConfig.json', 'utf-8'))
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('infect');
const gameCollection = db.collection('games');

(async function testConnection() {
    try {
        console.log("Connecting to database")
        await db.command({ ping: 1});
        console.log(`Connected to database`);
    }   catch(ex) {
        console.log(`Unable to connect to database with ${url} because ${ex.message}`)
        process.exit(1);
    }
})();

export async function createGame(length) {
    const joinCode = generateJoinCode();
    await gameCollection.insertOne(
        {
            joinCode: joinCode,
            players: [],
            timer: length,
            endTime: 0
        }
    );
    return {
        joinCode
    }
}

export async function addPlayer(joinCode, nickName, picNumber) {
    const result = await gameCollection.findOne({ joinCode: joinCode});
    const authToken = generateAuthToken();
    const newPlayer = {
        name: nickName,
        profilePic: picNumber,
        status: false,
        authToken: authToken,
    }
    if(result) {
        await gameCollection.updateOne(
            {joinCode: joinCode},
            {$push: {players: newPlayer}}
        );
    } else {
        console.log(`No game found with join code '${joinCode}`);
    }
    return {
        authToken
    }
}

export async function findGame(joinCode) {
    const result = await gameCollection.findOne({ joinCode: joinCode});
    if(result) {
        return result;
    } else {
        console.log(`No game found with join code '${joinCode}`);
    }
}

export async function findPlayer(authToken) {
    const result = await gameCollection.findOne({
        players: {$elemMatch: {authToken: authToken}}
    });
    if(result) {
        const player = result.players.find(player => player.authToken === authToken);
        return player
    } else {
        console.log(`No player found with authToken '${authToken}'`)
    }
}

function generateJoinCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }
    return token
}

function generateAuthToken() {
    const characters = '0123456789';
    let token = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }
    return token
}

