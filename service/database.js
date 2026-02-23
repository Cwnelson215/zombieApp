import { MongoClient } from "mongodb";
import { randomBytes } from "crypto";

const url = process.env.MONGODB_URI;
if (!url) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}
const client = new MongoClient(url);
const db = client.db('infect');
const gameCollection = db.collection('games');

(async function testConnection() {
    try {
        console.log("Connecting to database")
        await db.command({ ping: 1});
        console.log(`Connected to database`);
    }   catch(ex) {
        console.log(`Unable to connect to database: ${ex.message}`)
        process.exit(1);
    }
})();

export async function createGame(length) {
    const joinCode = generateJoinCode();
    const ownerAuthToken = generateAuthToken();
    await gameCollection.insertOne(
        {
            joinCode: joinCode,
            players: [],
            timer: length,
            endTime: 0,
            ownerAuthToken: ownerAuthToken,
            status: 'waiting'
        }
    );
    return {
        joinCode,
        ownerAuthToken
    }
}

export async function addPlayer(joinCode, nickName, picNumber, ownerAuthToken) {
    joinCode = joinCode.toUpperCase();
    const result = await gameCollection.findOne({ joinCode: joinCode});
    if (!result) {
        console.log(`No game found with join code '${joinCode}`);
        return { error: 'Game not found' };
    }
    if (result.status !== 'waiting') {
        console.log(`Game '${joinCode}' has already started`);
        return { error: 'Game has already started' };
    }
    const isOwner = !!(ownerAuthToken && ownerAuthToken === result.ownerAuthToken);
    const authToken = isOwner ? ownerAuthToken : generateAuthToken();
    const newPlayer = {
        name: nickName,
        profilePic: picNumber,
        status: false,
        authToken: authToken,
    }
    await gameCollection.updateOne(
        { joinCode: joinCode },
        { $push: { players: newPlayer } }
    );
    return {
        authToken,
        isOwner
    }
}

export async function findGame(joinCode) {
    joinCode = joinCode.toUpperCase();
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
    joinCode = joinCode.toUpperCase();
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
    return randomBytes(6).toString('base64url').substring(0, 8);
}

export async function savePushSubscription(joinCode, authToken, subscription) {
    joinCode = joinCode.toUpperCase();
    console.log('[DB] Saving push subscription for game:', joinCode);
    const result = await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": authToken },
        { $set: { "players.$.pushSubscription": subscription } }
    );
    console.log('[DB] Save result - matched:', result.matchedCount, 'modified:', result.modifiedCount);
    return result.matchedCount > 0;
}

export async function removePushSubscription(joinCode, authToken) {
    joinCode = joinCode.toUpperCase();
    const result = await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": authToken },
        { $unset: { "players.$.pushSubscription": "" } }
    );
    return result.matchedCount > 0;
}

export async function startGame(joinCode, authToken) {
    joinCode = joinCode.toUpperCase();
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
    const endTime = game.timer > 0 ? Date.now() + game.timer * 60 * 1000 : 0;
    await gameCollection.updateOne(
        { joinCode: joinCode, "players.authToken": firstInfected.authToken },
        {
            $set: {
                "players.$.status": true,
                status: 'running',
                endTime: endTime
            }
        }
    );
    return {
        success: true,
        firstInfected: {
            name: firstInfected.name,
            authToken: firstInfected.authToken
        },
        endTime: endTime
    };
}

export async function transferOwner(joinCode, currentOwnerAuthToken) {
    joinCode = joinCode.toUpperCase();
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
    joinCode = joinCode.toUpperCase();
    console.log('[DB] Getting push subscriptions for game:', joinCode);
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

export async function removePlayer(joinCode, authToken) {
    joinCode = joinCode.toUpperCase();
    const result = await gameCollection.findOneAndUpdate(
        { joinCode: joinCode },
        { $pull: { players: { authToken: authToken } } },
        { returnDocument: 'after' }
    );
    return result;
}

export async function deleteGame(joinCode) {
    joinCode = joinCode.toUpperCase();
    const result = await gameCollection.deleteOne({ joinCode: joinCode });
    return result.deletedCount > 0;
}

export async function deleteEmptyGames() {
    const result = await gameCollection.deleteMany({
        players: { $size: 0 }
    });
    return { deletedCount: result.deletedCount };
}

export async function getCleanupStats() {
    const emptyGames = await gameCollection.countDocuments({ players: { $size: 0 } });
    const totalGames = await gameCollection.countDocuments({});
    return { emptyGames, totalGames };
}

