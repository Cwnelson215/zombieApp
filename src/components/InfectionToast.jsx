import React, { useEffect, useState } from 'react';
import './InfectionToast.css';

export function InfectionToast({ playerName, isInfected, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const statusText = isInfected ? 'INFECTED' : 'CURED';
  const statusClass = isInfected ? 'infected' : 'cured';

  return (
    <div className={`infection-toast ${statusClass} ${isVisible ? 'visible' : ''}`}>
      <div className="toast-icon">
        {isInfected ? '\u{1F9DF}' : '\u{1F489}'}
      </div>
      <div className="toast-content">
        <span className="toast-player">{playerName}</span>
        <span className="toast-status">is now {statusText}!</span>
      </div>
    </div>
  );
}
