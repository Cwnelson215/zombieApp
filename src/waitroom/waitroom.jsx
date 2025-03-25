import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useNavigate} from 'react-router-dom';
import "./waitroom.css";

export function Waitroom() {
    const [nickname, setNickname] = React.useState('Lebron James');
    const navigate = useNavigate();

    React.useEffect(() => {
        const name = localStorage.getItem("nickname");
        setNickname(name);
    }, [])

    
    
    return (
        <main>
            <p className="introduction">Waiting for players...</p>
            <p className="total_joined">Players Joined: 3</p>
            <p className="Players-ready">Players Ready:</p>
            <div className="container">
                <div className="player1">
                    <img alt="player avater" src="/images/pic3.jpeg"/>
                    <p className="player"><strong>Lebron James</strong></p>
                </div>
                <div className="player2">
                    <img alt="timer" src="/images/pic2.jpeg"/>
                    <p className="player">Kalvin Koolidge</p>
                </div>
                <div className="player3">
                    <img alt="player avater" src="/images/pic1.jpeg"/>
                    <p className="player">Bart Simpson</p>
                </div>
            </div>
            <p className="info"><strong>The Infected Player Will Be Chosen When The Game Starts</strong></p>
            <p className="message">Good Luck Survivors</p>
            <button className="start" onClick={() => navigate('/running')}>Start Game</button>
        </main>
    );
}