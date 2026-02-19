import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useParams } from 'react-router-dom';
import "./waitroom.css";
import { useSocket } from '../socket/SocketContext';
import { requestNotificationPermission } from '../utils/notifications';

export function Waitroom() {
    const { joinCode } = useParams();
    const [players, setPlayers] = useState([]);
    const [isOwner, setIsOwner] = useState(localStorage.getItem("isOwner") === "true");
    const [ownerAuthToken, setOwnerAuthToken] = useState(null);
    const [starting, setStarting] = useState(false);
    const navigate = useNavigate();
    const socket = useSocket();
    const authToken = localStorage.getItem("authToken");

    const fetchPlayers = useCallback(async () => {
        const res = await fetch("/api/game/getPlayers", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ joinCode })
        });
        const data = await res.json();
        setPlayers(data.players);
        setOwnerAuthToken(data.ownerAuthToken);
        setIsOwner(data.ownerAuthToken === authToken);

        if (data.status === 'running') {
            const firstInfected = data.players.find(p => p.status);
            if (firstInfected) {
                localStorage.setItem("firstInfectedAuthToken", firstInfected.authToken);
                localStorage.setItem("firstInfectedName", firstInfected.name);
            }
            if (data.endTime) localStorage.setItem("endTime", data.endTime);
            navigate(`/game/${joinCode}/running`);
            return;
        }
    }, [joinCode, authToken, navigate]);

    useEffect(() => {
        requestNotificationPermission();
        fetchPlayers();
    }, [fetchPlayers]);

    useEffect(() => {
        if (!socket || !joinCode) return;

        socket.emit('join-game', joinCode, authToken);

        socket.on('player-list-updated', () => {
            fetchPlayers();
        });

        socket.on('game-started', ({ firstInfectedAuthToken, firstInfectedName, endTime }) => {
            localStorage.setItem("firstInfectedAuthToken", firstInfectedAuthToken);
            localStorage.setItem("firstInfectedName", firstInfectedName);
            localStorage.setItem("endTime", endTime);
            navigate(`/game/${joinCode}/running`);
        });

        socket.on('owner-changed', ({ newOwnerAuthToken, newOwnerName }) => {
            setOwnerAuthToken(newOwnerAuthToken);
            setIsOwner(newOwnerAuthToken === authToken);
            console.log(`New owner: ${newOwnerName}`);
        });

        return () => {
            socket.off('player-list-updated');
            socket.off('game-started');
            socket.off('owner-changed');
        };
    }, [socket, joinCode, authToken, fetchPlayers, navigate]);

    const handleStartGame = async () => {
        if (starting) return;
        setStarting(true);
        try {
            const res = await fetch("/api/game/start", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ joinCode, authToken })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to start game');
                setStarting(false);
            }
        } catch (error) {
            console.error('Error starting game:', error);
            alert('An error occurred while starting the game.');
            setStarting(false);
        }
    };

    return (
        <main>
            <p className="introduction">Waiting for players...</p>
            <div className="join-code-display">
                <p className="join-code-label">Share this code to invite players:</p>
                <p className="join-code">{joinCode}</p>
            </div>
            <p className="total_joined">Players Joined: {players.length}</p>
            <p className="Players-ready">Players Ready:</p>
            <div className="container">
                {players.map((player, index) => (
                    <div key={player.authToken || index} className={player.authToken === authToken ? 'current-player' : 'other-player'}>
                        <img alt="player avatar" src={`/images/pic${player.profilePic}.jpeg`} />
                        <p className="player"><strong>{player.name}</strong></p>
                    </div>
                ))}
            </div>
            <p className="info"><strong>The Infected Player Will Be Chosen When The Game Starts</strong></p>
            <p className="message">Good Luck Survivors</p>
            {isOwner ? (
                <button className="start" onClick={handleStartGame} disabled={starting || players.length === 0}>
                    {starting ? 'Starting...' : 'Start Game'}
                </button>
            ) : (
                <p className="waiting-message">Waiting for host to start the game...</p>
            )}
        </main>
    );
}
