import React, { useEffect, useState } from 'react';
import './LandingAnimation.css';

const LandingAnimation = ({ onAnimationComplete }) => {
  const [showContent, setShowContent] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Start the animation after a brief delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    // Show text after plane lands
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    // Trigger the completion callback after animation
    const completionTimer = setTimeout(() => {
      onAnimationComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(textTimer);
      clearTimeout(completionTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className={`landing-animation ${showContent ? 'show' : ''}`}>
      <div className="plane-container">
        <div className="plane">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 105.27">
            <path d="M0,95.24H122.88v10H0v-10ZM4.74,1.47C4.7.12,5.4-.18,6.51.09c.92.42,2,.68,2.94,1.06,2.55,1,11.23,18.33,13,21.53l25,7.86L40.16,1.94C40.29.57,41,.14,42.33.86c2.71.88,5.36,1.76,8.05,2.71,2.64.61,3.49,3.07,5.32,6.66L70.09,37.47l24.35,7.94c6.29,2.06,12.17,4.44,16.38,9.51-.42,0-.85,0-1.31,0a34,34,0,0,1-7.28-1.31l-.72,2.57a36.57,36.57,0,0,0,7.88,1.4,17,17,0,0,0,3.24-.12l.39.67C117.51,66,111.21,71.82,95,66.67L73.54,59.59,30.2,81.76l-12.3-2.7c-1.5-.31-1.75-1.08-1-2.22L46.5,51.1C34.63,47.69,19.66,41.4,10,33.46A16.72,16.72,0,0,1,5.6,28.53L4.74,1.47ZM86.56,53.55l3.06-2.88L94,52l-2.58,3.38-4.81-1.86Zm-8.13-3,3.51-2.76,4.64,1.54-2.89,3.2-5.26-2Zm-9.1-3.14L74.07,45l4.82,1.54-3.07,3.2-6.49-2.29Z" fill="currentColor"/>
          </svg>
        </div>
        <div className={`landed-text ${showText ? 'show' : ''}`}>
          Landed
        </div>
      </div>
    </div>
  );
};

export default LandingAnimation; 