import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './join.css'
import {useNavigate, useParams} from 'react-router-dom';

export function Join() {
    const navigate = useNavigate();
    const { joinCode } = useParams();
    const [selectedPicture, setSelectedPicture] = React.useState(null);
    const [nickname, setNickname] = React.useState('');
    
    const profilePictures = [
        '/images/pic1.jpeg',
        '/images/pic2.jpeg',
        '/images/pic3.jpeg',
    ];

    const handlePictureSelect = (picture) => {
        setSelectedPicture(picture);
    }

    const handleNickname = (event) => {
        setNickname(event.target.value);
    }

    const readyUp = async () => {
        if (!nickname || !selectedPicture) {
            alert('Please enter a nickname and select a profile picture!');
            return;
        }

        try {
            let response = await fetch('/api/player/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    joinCode,
                    nickname,
                    profilePicture: selectedPicture,
                }),
            });
    
            if (response.ok) {
                navigate(`/game/${joinCode}/waitroom`);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error adding player:', error);
            alert('An error occurred while adding the player.');
        }
    };
    
    return (

        <main>
            <p className="heading">Game Found!</p>
            <div>
                <p className="joinCode">Join Code: {joinCode}</p>
            </div>

            <p className='prompt'>Choose Profile Picture and Enter Nickname</p>
            <div className="pictures">
                {profilePictures.map((picture, index) => (
                    <div
                        key={index}
                        className={`picture-${index} ${selectedPicture === picture ? 'selected' : ''}`}
                        onClick={() => handlePictureSelect(picture)}
                    >
                        <img
                            src={picture}
                            alt={`Profile ${index + 1}`}
                            className={`picture-${index}`}
                        />
                    </div>
                ))}
            </div>
            <div className="nickname">
                <p>Enter Nickname:</p>
                <input type="text" placeholder="Nickname" value={nickname} onChange={handleNickname}/>
            </div>
            <div className="r_button">
                <button className="ready" onClick={readyUp}>Ready!</button>
            </div>


        </main>
    );
}