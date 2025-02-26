import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from "./login/login";
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
                    <NavLink to="/create">
                    <nav className="button">
                        <button className="h_button">Host Game</button>
                    </nav>
                    </NavLink>
                    <NavLink to="/enter">
                    <nav className="button">
                        <button className="j_button">Join Game</button>
                    </nav>
                    </NavLink>
                <nav className="button">
                    <NavLink to="/waitroom">
                        <button className="w_button">Waiting Room</button>
                    </NavLink>
                </nav>
                <nav className="button">
                    <NavLink to="/running">
                            <button className="s_button">Begin Infection</button>
                    </NavLink>
                </nav>
                <nav className="button">
                    <NavLink to="/">
                    <button className="end">Title Page</button>
                    </NavLink>
                </nav>
            </header>
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/create' element={<Create />} />
                <Route path='/enter' element={<Enter />} />
                <Route path='/waitroom' element={<Waitroom />} />
                <Route path='/running' element={<Running />} />
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