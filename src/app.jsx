import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from "./login/login"
import { Create } from './create/create';
import { Enter } from './enter/enter';
import { Waitroom } from './waitroom/waitroom';
import { Running } from './running/running';


export default function App() {
    return (
        <BrowserRouter>
        <div className='app bg-dark text-light'>
            <header>
                <p className="title">INFECTED.FYI</p>
            </header>
            <main>
                <NavLink to="/create">
                <nav className="host">
                    <button className="h_button">Host Game</button>
                </nav>
                </NavLink>
                <NavLink to="/enter">
                <nav className="join">
                    <button className="j_button">Join Game</button>
                </nav>
                </NavLink>
            </main>

            <Routes>
                <Route path='/' element={<Login />} exact />
                <Route path='/create' element={<Create />} />
                <Route path='/enter' element={<Enter />} />
                <Route path='/waitroom' element={<Waitroom />} />
                <Route path='/running' element={<Running />} />
                <Route path='*' element={<NotFound />} />
            </Routes>

            <footer>
                <span className="text-rest">Carter Nelson</span>
                <a href="https://github.com/Cwnelson215/zombieApp">github link</a>
            </footer>
        </div>
        </BrowserRouter>
    );
}

function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknon.</main>
}