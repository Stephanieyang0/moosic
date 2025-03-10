import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [emotion, setEmotion] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Add this function to handle automatic playback
  const playNextTrack = () => {
    if (tracks.length > 0) {
      const firstTrackWithPreview = tracks.find(track => track.previewUrl);
      if (firstTrackWithPreview) {
        setCurrentTrack(firstTrackWithPreview);
      }
    }
  };

  // Add this effect to play music when tracks change
  useEffect(() => {
    playNextTrack();
  }, [tracks]);

  // Add this effect to handle audio playback
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.previewUrl;
      audioRef.current.play().catch(e => console.log('Playback failed:', e));
    }
  }, [currentTrack]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: 640,
          height: 480
        } 
      })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  };

  const stopVideo = () => {
    let video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  const handleEmotion = async (detectedEmotion) => {
    setEmotion(detectedEmotion);
    try {
      const response = await axios.get(`http://localhost:3001/api/recommendations?emotion=${detectedEmotion}`);
      setTracks(response.data.tracks);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <h1>MOOSIC</h1>
      <p>Let us detect your emotion and suggest some music!</p>
      
      <div className="video-wrapper">
        <video 
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          playsInline
        ></video>
        
        <div className="button-container">
          <button onClick={startVideo} className="camera-button">
            Start Camera
          </button>
          <button onClick={stopVideo} className="camera-button">
            Stop Camera
          </button>
        </div>
      </div>

      {emotion && (
        <div className="emotion-display">
          Current Emotion: {emotion}
        </div>
      )}

      <div className="emotion-buttons">
        <button onClick={() => handleEmotion('happy')}>Test Happy 😊</button>
        <button onClick={() => handleEmotion('sad')}>Test Sad 😢</button>
        <button onClick={() => handleEmotion('angry')}>Test Angry 😠</button>
      </div>

      {/* Add audio element for automatic playback */}
      <audio 
        ref={audioRef}
        controls
        autoPlay
        onEnded={playNextTrack}
        style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
      />

      <div className="tracks-container">
        {tracks.map((track) => (
          <div key={track.id} className="track-card">
            {track.albumArt && (
              <img src={track.albumArt} alt={track.name} className="album-art" />
            )}
            <h3>{track.name}</h3>
            <p>{track.artist}</p>
            <button 
              onClick={() => setCurrentTrack(track)}
              className={currentTrack?.id === track.id ? 'playing' : ''}
            >
              {currentTrack?.id === track.id ? '▶ Playing' : '▶ Play'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
