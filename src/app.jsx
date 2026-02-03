import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Home } from "./home/home";
import { Create } from './create/create';
import { Enter } from './enter/enter';
import { Waitroom } from './waitroom/waitroom';
import { Running } from './running/running';
import { Join } from './join/join';
import { SocketProvider } from './socket/SocketContext';


export default function App() {
    console.log("hello")
    return (
        <BrowserRouter>
        <SocketProvider>
        <div className='app bg-dark text-light'>
            <header>
                <p className="title">INFECTED.FYI</p>
            </header>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/create' element={<Create />} />
                <Route path='game/enter' element={<Enter />} />
                <Route path='game/:joinCode/waitroom' element={<Waitroom />} />
                <Route path='game/:joinCode/running' element={<Running />} />
                <Route path='game/:joinCode/join' element={<Join />} />
                <Route path='*' element={<NotFound />} />
            </Routes>

            <footer>
                <span className="text-rest">Carter Nelson</span>
                <a href="https://github.com/Cwnelson215/zombieApp">github link</a>
            </footer>
        </div>
        </SocketProvider>
        </BrowserRouter>
    );
}

function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknown.</main>
}