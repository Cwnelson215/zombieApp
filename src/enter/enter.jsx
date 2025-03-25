import React from 'react';
import './enter_joincode.css';

export function Enter() {
    const [joinCode, setJoinCode] = React.useState("")

    const handleCode = (event) => {
        setJoinCode(event.target.value);
    };

    const submit = async () => {
        navigate(`/game/${res.joinCode}/join`)
    };


    return (
        <main>
            <p className="heading">Enter A Join Code To Play</p>
            <div className="code">
                <label name="code">Join Code:</label>
                <input type="text" id="code" name="code" onChange={handleCode}/>
                <button className="enter" onClick={submit}>Enter</button>
                <p className="nickname">Choose Your Nickname</p>
            </div>
        </main>
    );
}