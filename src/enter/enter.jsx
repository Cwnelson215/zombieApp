import React from 'react';
import './enter_joincode.css';
import {useNavigate} from 'react-router-dom';

export function Enter() {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = React.useState('');
    const handleCode = (event) => {
        setJoinCode(event.target.value);
    };

    const submit = async () => {
        navigate(`/game/${joinCode}/join`);
    }

    return (
        <main>
            <p className="heading">Enter A Join Code To Play</p>
            <div className="code">
                <label name="code">Join Code:</label>
                <input type="text" id="code" name="code" onChange={handleCode}/>
                <button className="enter" onClick={submit}>Enter</button>
            </div>
        </main>
    );
}