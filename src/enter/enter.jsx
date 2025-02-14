import React from 'react';
import './enter_joincode.css';

export function Enter() {
    return (
        <main>
            <div className="code">
                <label name="code">Enter Join Code:</label>
                <input type="text" id="code" name="code"/>
            </div>
            
            <p className="nickname">Choose Your Nickname</p>

            <div className="nickname_input">
                <label for="Nickname">Enter Nickname:</label>
                <input type="text" id="Nickname" name="Nickname"/>
            </div>
            <div className="button">
                <input type="button" value="Use Gravatar"/>
            </div>
        </main>
    );
}