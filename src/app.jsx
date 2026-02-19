import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { Home } from "./home/home";
import { Create } from './create/create';
import { Enter } from './enter/enter';
import { Waitroom } from './waitroom/waitroom';
import { Running } from './running/running';
import { Join } from './join/join';
import { SocketProvider } from './socket/SocketContext';

function SessionRedirector() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const redirectPaths = ['/', '/create', '/game/enter'];
        if (!redirectPaths.includes(location.pathname)) return;

        const authToken = localStorage.getItem('authToken');
        const joinCode = localStorage.getItem('joinCode');
        if (!authToken || !joinCode) return;

        fetch('/api/player/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken })
        })
            .then(res => res.json())
            .then(data => {
                if (data.active) {
                    const dest = data.status === 'running'
                        ? `/game/${data.joinCode}/running`
                        : `/game/${data.joinCode}/waitroom`;
                    navigate(dest);
                } else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('joinCode');
                    localStorage.removeItem('isOwner');
                }
            })
            .catch(() => {});
    }, [location.pathname, navigate]);

    return null;
}

export default function App() {
    console.log("hello")
    return (
        <BrowserRouter>
        <SocketProvider>
        <SessionRedirector />
        <div className='app bg-dark text-light'>
            <header>
                <p className="title">INFECTION</p>
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