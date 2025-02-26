import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Create } from '../create/create';
import { Enter } from '../enter/enter';

export function Login() {
    return (

        <main>
            <p className="question">Would you like to play a game?</p>
            <p className="introduction">
                Real Time Tracking For Real Time Fun
            </p>
            <p className="invitation">Join or Host a game to start playing!</p>
            <p className="warning">BEWARE THE INFECTION</p>
        </main>
    );
}

function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknon.</main>
}