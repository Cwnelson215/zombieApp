import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './game_running.css';

export function Running() {
    return (
        <main>
            <p className="i_count">Infected: 1</p>
            <div className="infected">
                <img alt="player avater" src="images/pic2.jpeg" />
                <p className="player">Kalvin Koolidge</p>
            </div>
            <p className="s_count">Survivors Left: 2</p>
            <div className="survivors">
                <div className="survivor1">
                    <img alt="player avater" src="images/pic3.jpeg" />
                    <p className="player"><strong>Lebron James</strong></p>
                </div>
                <div className="survivor2">
                    <img alt="player avater" src="images/pic1.jpeg" />
                    <p className="player">Bart Simpson</p>
                </div>
            </div>

            <div className="announce">
                <p className="announcement">Push If Infected</p>
                <button className="button">Announce Infection</button>
            </div>
        </main>
    );
}