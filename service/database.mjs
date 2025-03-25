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
        this.length;
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

}

export class PlayerState {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.status = false;
        this.profile_pic = profile_pic;
        this.auth_token;
    }
}