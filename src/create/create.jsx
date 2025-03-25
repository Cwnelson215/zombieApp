import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useNavigate} from 'react-router-dom';
import "./create_game.css";

export function Create() {
    const navigate = useNavigate();
    const [checkboxY, setCheckBoxY] = React.useState(false);
    const [checkboxN, setCheckBoxN] = React.useState(false);
    const [minutes, setMinutes] = React.useState(15);
    const [message, setMessage] = React.useState("");
    const [nickname, setNickname] = React.useState("")


    const handleCheckboxYChange = () => {
        setCheckBoxY(!checkboxY);
        if(!checkboxY) {
            setCheckBoxN(false);
        }
    };
    const handleCheckboxNChange = () => {
        setCheckBoxN(!checkboxN);
        if(!checkboxN) {
            setCheckBoxY(false);
        }
    };
    const handleTimer = (event) => {
        setMinutes(event.target.value);
    };
    const handleNickname = (event) => {
        setNickname(event.target.value)
    }
    const handleMessage = () => {
        setMessage("Code: BG1252");
    };
    const submit = async () => {
        let res =  await fetch("/api/game/create", {
            method: 'Post',
            body: JSON.stringify({
                timer: minutes,
                nickName: nickname,
            })
        });
        res = await res.json()
        navigate(`/game/${res.joinCode}/join`)
    };

    return (
        <main>
        <p className="question">Would you like to play with a timer?</p>
        
        <div className="check_box_Y">
            {!checkboxY && (
            <label htmlFor="option1">
            <input type="checkbox" checked={checkboxN} onChange={handleCheckboxNChange}/>
                Yes
            </label>
            )}
        </div>

        <div className="check_box_N">
            {!checkboxN && (
            <label htmlFor="option2">
                <input type="checkbox" checked={checkboxY} onChange={handleCheckboxYChange}/>
                No
            </label>
            )}
        </div>

        <div className="timer_s">
            {!checkboxY && (
                <label>
                    <p htmlFor="timer_s">Select Number of Minutes:</p>
                    <input type="number" id="timer" value={minutes} onChange={handleTimer} min="15" max="90" step="5"/>
                </label>
            )}
        </div>

        <div className="nickname">
                <label htmlF="Nickname">Enter Nickname:</label>
                <input type="text" id="Nickname" onChange={handleNickname}/>
        </div>
        <div>
        <input  className="n_button" type="button" value="Submit" onClick={submit}/>
        </div>

        <p className="generate">Generate Join Code</p>
        <nav className="button">
        <input type="button" onClick={handleMessage} value="Get Code"/>
        {message && <p>{message}</p>}
        </nav>

    </main>
    );
}