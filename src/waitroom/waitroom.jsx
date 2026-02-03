import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useParams } from 'react-router-dom';
import "./waitroom.css";
import { useSocket } from '../socket/SocketContext';
import { requestNotificationPermission } from '../utils/notifications';

export function Waitroom() {
    const { joinCode } = useParams();
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();
    const socket = useSocket();

    const fetchPlayers = useCallback(async () => {
        const res = await fetch("/api/game/getPlayers", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ joinCode })
        });
        const data = await res.json();
        setPlayers(data.players);
    }, [joinCode]);

    useEffect(() => {
        requestNotificationPermission();
        fetchPlayers();
    }, [fetchPlayers]);

    useEffect(() => {
        if (!socket || !joinCode) return;

        socket.emit('join-game', joinCode);

        socket.on('player-list-updated', () => {
            fetchPlayers();
        });

        return () => {
            socket.off('player-list-updated');
        };
    }, [socket, joinCode, fetchPlayers]);

    return (
        <main>
            <p className="introduction">Waiting for players...</p>
            <p className="total_joined">Players Joined: {players.length}</p>
            <p className="Players-ready">Players Ready:</p>
            <div className="container">
                {players.map((player, index) => (
                    <div key={player.authToken || index} className={`player${index + 1}`}>
                        <img alt="player avatar" src={`/images/pic${player.profilePic}.jpeg`} />
                        <p className="player"><strong>{player.name}</strong></p>
                    </div>
                ))}
            </div>
            <p className="info"><strong>The Infected Player Will Be Chosen When The Game Starts</strong></p>
            <p className="message">Good Luck Survivors</p>
            <button className="start" onClick={() => navigate(`/game/${joinCode}/running`)}>Start Game</button>
        </main>
    );
}
