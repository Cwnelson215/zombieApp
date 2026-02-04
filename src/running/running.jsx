import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './game_running.css';
import { useSocket } from '../socket/SocketContext';
import { InfectionToast } from '../components/InfectionToast';
import { requestNotificationPermission, subscribeToPush, isPushSupported } from '../utils/notifications';

export function Running() {
    const { joinCode } = useParams();
    const initialMinutes = parseInt(localStorage.getItem("timer")) || 0;
    const authToken = localStorage.getItem("authToken");
    const navigate = useNavigate();
    const socket = useSocket();

    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [minutes, setMinutes] = useState(initialMinutes);
    const [tens, setTens] = useState(0);
    const [ones, setOnes] = useState(0);
    const [toastData, setToastData] = useState(null);
    const [showPatientZero, setShowPatientZero] = useState(false);
    const [gameOutcome, setGameOutcome] = useState(null); // 'zombies' | 'survivors' | null
    const [isOwner, setIsOwner] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const fetchPlayers = useCallback(async () => {
        const response = await fetch('/api/game/getPlayers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ joinCode })
        });
        if (response.ok) {
            const data = await response.json();
            setPlayers(data.players);
            setIsOwner(data.ownerAuthToken === authToken);
            const me = data.players.find(p => p.authToken === authToken);
            if (me) setCurrentPlayer(me);
        }
    }, [joinCode, authToken]);

    useEffect(() => {
        // Request notification permission and subscribe to push if supported
        const setupNotifications = async () => {
            const permissionGranted = await requestNotificationPermission();
            if (permissionGranted && isPushSupported()) {
                // Subscribe to push notifications for background delivery (Android/Desktop)
                await subscribeToPush(joinCode, authToken);
            }
        };
        setupNotifications();
        fetchPlayers();

        // Check if this player is Patient Zero
        const firstInfectedAuthToken = localStorage.getItem("firstInfectedAuthToken");
        if (firstInfectedAuthToken === authToken) {
            setShowPatientZero(true);
            localStorage.removeItem("firstInfectedAuthToken");
            localStorage.removeItem("firstInfectedName");
            setTimeout(() => setShowPatientZero(false), 5000);
        }
    }, [fetchPlayers, joinCode, authToken]);

    useEffect(() => {
        if (!socket || !joinCode) return;

        socket.emit('join-game', joinCode);

        const handlePlayerInfected = ({ playerName, newStatus, authToken: changedAuthToken }) => {
            setPlayers(prev => prev.map(p =>
                p.authToken === changedAuthToken ? { ...p, status: newStatus } : p
            ));

            // Show in-app toast for other players' status changes
            // Push notifications are handled server-side for background delivery
            if (changedAuthToken !== authToken) {
                setToastData({ playerName, isInfected: newStatus });
            }
        };

        socket.on('player-infected', handlePlayerInfected);

        socket.on('game-ended', () => {
            navigate(`/game/${joinCode}/join`);
        });

        return () => {
            socket.off('player-infected', handlePlayerInfected);
            socket.off('game-ended');
        };
    }, [socket, joinCode, authToken, navigate]);

    const handleInfection = () => {
        if (!socket || !currentPlayer) return;

        const newStatus = !currentPlayer.status;
        socket.emit('infection-update', {
            joinCode,
            authToken,
            newStatus
        });

        setCurrentPlayer(prev => ({ ...prev, status: newStatus }));
    };

    const handleEndGame = () => {
        if (socket) {
            socket.emit('end-game', { joinCode, authToken });
        }
    };

    const handleLeaveGame = () => {
        navigate(`/game/${joinCode}/join`);
    };

    useEffect(() => {
        let timerInterval;

        if (minutes > 0 || tens > 0 || ones > 0) {
            timerInterval = setInterval(() => {
                if (ones > 0) {
                    setOnes(ones - 1);
                } else if (tens > 0) {
                    setTens(tens - 1);
                    setOnes(9);
                } else if (minutes > 0) {
                    setMinutes(minutes - 1);
                    setTens(5);
                    setOnes(9);
                }
            }, 1000);

            return () => clearInterval(timerInterval);
        }

        return () => {};
    }, [minutes, tens, ones]);

    useEffect(() => {
        if (players.length === 0) return;

        const allInfected = players.every(p => p.status);
        const timerEnded = minutes === 0 && tens === 0 && ones === 0 && initialMinutes !== 0;
        const hasSurvivors = players.some(p => !p.status);

        if (allInfected) {
            setGameOutcome('zombies');
        } else if (timerEnded && hasSurvivors) {
            setGameOutcome('survivors');
        }
    }, [players, minutes, tens, ones, initialMinutes]);

    const infectedPlayers = players.filter(p => p.status);
    const survivorPlayers = players.filter(p => !p.status);

    return (
        <main>
            {showPatientZero && (
                <div className="patient-zero-notification">
                    <h2>🧟 You are Patient Zero! 🧟</h2>
                    <p>You are the first infected. Go spread the infection!</p>
                </div>
            )}

            {toastData && (
                <InfectionToast
                    playerName={toastData.playerName}
                    isInfected={toastData.isInfected}
                    onClose={() => setToastData(null)}
                />
            )}

            <div className="timer">
                {minutes >= 0 && initialMinutes !== 0 && (
                    <p>Time Remaining: {minutes}:{tens}{ones}</p>
                )}
            </div>

            <p className="i_count">Infected: {infectedPlayers.length}</p>
            <div className="infected">
                {infectedPlayers.map(player => (
                    <div key={player.authToken}>
                        <img alt="player avatar" src={`/images/pic${player.profilePic}.jpeg`} />
                        <p className="player">{player.name}</p>
                    </div>
                ))}
            </div>

            <p className="s_count">Survivors Left: {survivorPlayers.length}</p>
            <div className="survivors">
                {survivorPlayers.map(player => (
                    <div key={player.authToken} className={player.authToken === authToken ? 'survivor1' : 'survivor2'}>
                        <img alt="player avatar" src={`/images/pic${player.profilePic}.jpeg`} />
                        <p className="player">
                            {player.authToken === authToken ? <strong>{player.name}</strong> : player.name}
                        </p>
                    </div>
                ))}
            </div>

            <div className="announce">
                {!gameOutcome && (
                    <label>
                        <p className="announcement">Push If Infected</p>
                        <button className="button" onClick={handleInfection}>
                            {currentPlayer?.status ? 'Announce Cured' : 'Announce Infection'}
                        </button>
                    </label>
                )}
            </div>

            {/* Game outcome overlay */}
            {gameOutcome && (
                <div className={`game-outcome-overlay ${gameOutcome}`}>
                    <h1>{gameOutcome === 'zombies' ? 'GAME OVER' : 'SURVIVORS WIN'}</h1>
                </div>
            )}

            {/* End game confirmation overlay (owner only) */}
            {showEndConfirm && (
                <div className="end-confirm-overlay">
                    <div className="end-confirm-dialog">
                        <p>Are you sure you want to end the game?</p>
                        <div className="end-confirm-buttons">
                            <button className="confirm-yes" onClick={() => { handleEndGame(); setShowEndConfirm(false); }}>Yes</button>
                            <button className="confirm-no" onClick={() => setShowEndConfirm(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave game confirmation overlay (non-owner) */}
            {showLeaveConfirm && (
                <div className="end-confirm-overlay">
                    <div className="end-confirm-dialog">
                        <p>Are you sure you want to leave the game?</p>
                        <div className="end-confirm-buttons">
                            <button className="confirm-yes" onClick={() => { handleLeaveGame(); setShowLeaveConfirm(false); }}>Yes</button>
                            <button className="confirm-no" onClick={() => setShowLeaveConfirm(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* End/Leave game buttons */}
            {isOwner ? (
                <button className="end" onClick={() => setShowEndConfirm(true)}>End Game</button>
            ) : (
                <button className="end" onClick={() => setShowLeaveConfirm(true)}>Leave Game</button>
            )}
        </main>
    );
}
