import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './game_running.css';

export function Running() {
    const initialMnutes = parseInt(localStorage.getItem("timer")) || 0;
    const [nickname, setNickname] = React.useState("");
    const [minutes, setMinutes] = React.useState(initialMnutes);
    const [tens, setTens] = React.useState(0);
    const [ones, setOnes] = React.useState(0);
    const [showMessage, setShowMessage] = React.useState(false);
    const [infected, setinfected] = React.useState(false);
    const [i_count, setIcount] = React.useState(1);
    const [s_count, setScount] = React.useState(2);

    const handleInfection = () => {
        setinfected(!infected);
        if(i_count == 1) {
            setIcount(i_count + 1);
            alert(nickname + " has been infected")
        } else {
            setIcount(i_count - 1);
            alert(nickname + " has been cured")
        }

        if(s_count > 1) {
            setScount(s_count - 1);
        } else {
            setScount(s_count + 1);
        }
    }
    
    React.useEffect(() => {
        const name = localStorage.getItem("nickname");
        setNickname(name);
    }, []);

    React.useEffect(() => {
        let timerInterval;

        if(minutes > 0 || tens > 0 || ones > 0) {
            timerInterval = setInterval(() => {
                if(ones > 0) {
                    setOnes(ones - 1);
                } else if(tens > 0) {
                    setTens(tens - 1);
                    setOnes(9);
                } else if(minutes > 0) {
                    setMinutes(minutes - 1);
                    setTens(5);
                    setOnes(9);
                }
            }, 1000);

            return () =>  clearInterval(timerInterval);
        }

        return () => {};
    }, [minutes, tens, ones]);

    React.useEffect(() => {
        if (minutes == 0 && tens == 0 && ones == 0 && initialMnutes !== 0) {
            setShowMessage(true)
        }

    }, [minutes, tens, ones, initialMnutes])
    

    return (
        <main>
            <div className="timer">
                {minutes >= 0 && initialMnutes !== 0 && (
                    <p>Time Remianing: {minutes}:{tens}{ones}</p>
                )}
            </div>
            <p className="i_count">Infected: {i_count}</p>
            <div className="infected">
                <div>
                <img alt="player avater" src="images/pic2.jpeg" />
                <p className="player">Kalvin Koolidge</p>
                </div>
                {infected && (
                    <div className="survivor1">
                        <img alt="player avater" src="images/pic3.jpeg" />
                        <p className="player"><strong>{nickname}</strong></p>
                    </div>
                )}
            </div>
            <p className="s_count">Survivors Left: {s_count}</p>
            <div className="survivors">
                {!infected && (
                    <div className="survivor1">
                        <img alt="player avater" src="images/pic3.jpeg" />
                        <p className="player"><strong>{nickname}</strong></p>
                    </div>
                )}
                <div className="survivor2">
                    <img alt="player avater" src="images/pic1.jpeg" />
                    <p className="player">Bart Simpson</p>
                </div>
            </div>

            <div className="announce">
               {!showMessage && (
                    <label>
                        <p className="announcement">Push If Infected</p>
                        <button className="button" onClick={handleInfection}>Announce Infection</button>
                    </label>
                )}
            </div>

            <div className="g_over">
                {showMessage && (
                    <p>GAME OVER</p>
                )}
            </div>
        </main>
    );
}