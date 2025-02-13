import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Create } from './create/create';
import { enter } from './enter/enter';
import { waitroom } from './waitroom/waitroom';
import { Running } from './running/running';


export default function App() {
    return <div className='body bg-dark text-light'>App will display here</div>;
}