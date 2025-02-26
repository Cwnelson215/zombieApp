import React from 'react';
import './enter_joincode.css';

export function Enter() {
    const [joinCode, setJoinCode] = React.useState("")
    const [nickname, setNickname] = React.useState("")
    const [message, setMessage] = React.useState("")

    const handleCode = (event) => {
        setJoinCode(event.target.value);
    };
    const submitJoinCode = () => {
        localStorage.setItem('join code', joinCode);
    };
    const handleNickname = (event) => {
        setNickname(event.target.value);
    };
    const submitNickname = () => {
        localStorage.setItem('player nickname', nickname);
    };
    const handleMessage = () => {
        setMessage("Gravitar Engaged");
    };

    return (
        <main>
            <div className="code">
                <label name="code">Enter Join Code:</label>
                <input type="text" id="code" name="code" onChange={handleCode}/>
                <button className="enter" onClick={submitJoinCode}>Enter</button>
                <p className="nickname">Choose Your Nickname</p>
            </div>

            <div className="nickname_input">
                <label forhtml="Nickname">Enter Nickname:</label>
                <input type="text" id="Nickname" name="Nickname" onChange={handleNickname}/>
                <input className="n_button" type='button' value="Submit Nickname" onClick={submitNickname}/>
            </div>
            <div className="button">
                <input type="button" value="Use Gravatar" onClick={handleMessage} />
                {message && <p>{message}</p>}
            </div>
        </main>
    );
}