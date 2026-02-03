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
            endTime: 0,
            ownerAuthToken: null,
            status: 'waiting'
        }
    );
    return {
        joinCode
    }
}

export async function addPlayer(joinCode, nickName, picNumber) {
    const result = await gameCollection.findOne({ joinCode: joinCode});
    if (!result) {
        console.log(`No game found with join code '${joinCode}`);
        return { error: 'Game not found' };
    }
    if (result.status !== 'waiting') {
        console.log(`Game '${joinCode}' has already started`);
        return { error: 'Game has already started' };
    }
    const authToken = generateAuthToken();
    const isOwner = result.ownerAuthToken === null;
    const newPlayer = {
        name: nickName,
        profilePic: picNumber,
        status: false,
        authToken: authToken,
    }
    const updateFields = { $push: { players: newPlayer } };
    if (isOwner) {
        updateFields.$set = { ownerAuthToken: authToken };
    }
    await gameCollection.updateOne(
        { joinCode: joinCode },
        updateFields
    );
    return {
        authToken,
        isOwner
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

export async function updatePlayerStatus(joinCode, authToken, newStatus) {
    const result = await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": authToken },
        { $set: { "players.$.status": newStatus } }
    );
    if (result.matchedCount === 0) {
        console.log(`No player found with authToken '${authToken}' in game '${joinCode}'`);
        return null;
    }
    const player = await findPlayer(authToken);
    return player;
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

export async function savePushSubscription(joinCode, authToken, subscription) {
    console.log('[DB] Saving push subscription for:', joinCode, authToken);
    const result = await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": authToken },
        { $set: { "players.$.pushSubscription": subscription } }
    );
    console.log('[DB] Save result - matched:', result.matchedCount, 'modified:', result.modifiedCount);
    return result.matchedCount > 0;
}

export async function removePushSubscription(joinCode, authToken) {
    const result = await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": authToken },
        { $unset: { "players.$.pushSubscription": "" } }
    );
    return result.matchedCount > 0;
}

export async function startGame(joinCode, authToken) {
    const game = await gameCollection.findOne({ joinCode: joinCode });
    if (!game) {
        return { error: 'Game not found' };
    }
    if (game.ownerAuthToken !== authToken) {
        return { error: 'Only the game owner can start the game' };
    }
    if (game.status !== 'waiting') {
        return { error: 'Game has already started' };
    }
    if (game.players.length === 0) {
        return { error: 'Cannot start game with no players' };
    }
    const randomIndex = Math.floor(Math.random() * game.players.length);
    const firstInfected = game.players[randomIndex];
    await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": firstInfected.authToken },
        {
            $set: {
                "players.$.status": true,
                status: 'running'
            }
        }
    );
    return {
        success: true,
        firstInfected: {
            name: firstInfected.name,
            authToken: firstInfected.authToken
        }
    };
}

export async function transferOwner(joinCode, currentOwnerAuthToken) {
    const game = await gameCollection.findOne({ joinCode: joinCode });
    if (!game) {
        return { error: 'Game not found' };
    }
    const remainingPlayers = game.players.filter(p => p.authToken !== currentOwnerAuthToken);
    if (remainingPlayers.length === 0) {
        return { error: 'No players to transfer ownership to' };
    }
    const newOwner = remainingPlayers[0];
    await gameCollection.updateOne(
        { joinCode: joinCode },
        { $set: { ownerAuthToken: newOwner.authToken } }
    );
    return {
        success: true,
        newOwnerAuthToken: newOwner.authToken,
        newOwnerName: newOwner.name
    };
}

export async function findGameByPlayerAuth(authToken) {
    const result = await gameCollection.findOne({
        players: { $elemMatch: { authToken: authToken } }
    });
    return result;
}

export async function getPushSubscriptionsForGame(joinCode, excludeAuthToken) {
    console.log('[DB] Getting push subscriptions for game:', joinCode, 'excluding:', excludeAuthToken);
    const game = await gameCollection.findOne({ joinCode: joinCode });
    if (!game) {
        console.log('[DB] Game not found');
        return [];
    }

    const playersWithSubs = game.players.filter(p => p.pushSubscription);
    console.log('[DB] Players with subscriptions:', playersWithSubs.length, 'of', game.players.length);

    const result = game.players
        .filter(p => p.authToken !== excludeAuthToken && p.pushSubscription)
        .map(p => ({
            subscription: p.pushSubscription,
            playerName: p.name
        }));

    console.log('[DB] Returning subscriptions:', result.length);
    return result;
}

