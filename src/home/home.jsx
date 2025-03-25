import React from 'react';
import {useNavigate} from 'react-router-dom';
import './home.css';

export function Home() {
    const navigate = useNavigate();
    const [catFact, setcatFact] = React.useState("");
    const createGame = (event) => {
        navigate('/create')
    }
    
    const joinGame = (event) => {
        navigate(`/game/enter`)
    }

    const getCatFact = async () => {
        let res = await fetch('https://meowfacts.herokuapp.com/')
        res = await res.json()
        setcatFact(res.data[0])
    }

    React.useEffect(() => {
        getCatFact()
    }
    ,[])

    return (
        <main>
            <p className="heading">Welcome</p>
            <div>
                <p className="invite">Create A Game Or Join An Existing Game To Start</p>
            </div>
            <div className="buttons">
                <div>
                    <button className="create" onClick={createGame}>Create Game</button>
                </div>
                <button className="join" onClick={joinGame}>Join Game</button>
            </div>
            <div className="cfact">
                <p className="fact">{catFact}</p>
            </div>
        </main>
    )
}