import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./create_game.css";

export function Create() {
    return (
        <main>
        <p className="question">Would you like to play with a timer?</p>
        <div className="check_box">
            <input type="checkbox" id="option1" name="option1" value="Yes"/>
            <label htmlFor="option1">Yes</label>
        </div>
        <div className="check_box">
            <input type="checkbox" id="option2" name="option2" value="No"/>
            <label htmlFor="option2">No</label>
        </div>

        <p className="generate">Generate Join Code</p>
        <nav className="button">
        <input type="button" value="Get Code"/>
        </nav>

    </main>
    );
}