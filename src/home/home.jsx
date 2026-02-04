import React from 'react';
import {useNavigate} from 'react-router-dom';
import './home.css';

export function Home() {
    const navigate = useNavigate();
    const createGame = (event) => {
        navigate('/create')
    }
    
    const joinGame = (event) => {
        navigate(`/game/enter`)
    }


    return (
        <main>
            <p className="heading">Welcome</p>
            <div>
                <p className="invite">Create A Game Or Join An Existing Game To Start</p>
            </div>
            <div className="buttons">
                <button className="home-btn" onClick={createGame}>Create Game</button>
                <button className="home-btn" onClick={joinGame}>Join Game</button>
            </div>
        </main>
    )
}