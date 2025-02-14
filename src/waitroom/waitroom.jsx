import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./waitroom.css";

export function Waitroom() {
    return (
        <main>
            <p class="introduction">Waiting for players...</p>
            <p class="total_joined">Players Joined: 3</p>
            <p class="ready">Players Ready:</p>
            <div class="container">
                <div class="player1">
                    <img alt="player avater" src="images/pic3.jpeg"/>
                    <p class="player"><strong>Labron James</strong></p>
                </div>
                <div class="player2">
                    <img alt="timer" src="images/pic2.jpeg"/>
                    <p class="player">Kalvin Koolidge</p>
                </div>
                <div class="player3">
                    <img alt="player avater" src="images/pic1.jpeg"/>
                    <p class="player">Bart Simpson</p>
                </div>
            </div>
            <p class="info"><strong>The Infected Player Will Be Chosen When The Game Starts</strong></p>
            <p class="message">Good Luck Survivors</p>
        </main>
    );
}