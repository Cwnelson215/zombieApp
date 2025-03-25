import crypto from "crypto";

export class Database {
    
    games = [];
    
    constructor() {
        return;
    }

    createGame(length) {
        const game = new GameState(length);
        this.games.push(game);
        return game;
    }
}

export class GameState {

    players = [];

    constructor(length) {
        this.generateJoinCode();
        this.endTime = 0;
        this.length = length;
    }

    generateJoinCode(){
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let token = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            token += characters[randomIndex];
        }
        this.joinCode = token
    }

    startGame() {
        if(this.length > 0) {
           this.endTime = Date.now() + length;
        }
        
    }

    addPlayer(name, profile_pic) {
        const characters = '0123456789';
        let token = '';
        for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            token += characters[randomIndex];
        }
        const player = new PlayerState(name, profile_pic, token);
        this.players.push(player);
        return player;
    }

}

export class PlayerState {
    constructor(name, profile_pic, id) {
        this.name = name;
        this.id = id;
        this.status = false;
        this.profile_pic = profile_pic;
        this.auth_token;
    }
}