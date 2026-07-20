import React, { useState, useEffect, useRef } from 'react';
import Button from './common/Button';


/**
 * MusicPlayer Component
 * Properties (Inputs):
 *  - playlist: Array [{ id, title, artist, url }]
 *  - isPlaying: boolean
 *  - currentTrackIndex: number
 *  - language: string ('es' | 'en')
 * Events (Outputs):
 *  - onPlayPauseChange: Function(isPlaying)
 *  - onTrackIndexChange: Function(newIndex)
 */
function MusicPlayer({
  playlist = [],
  isPlaying = false,
  currentTrackIndex = 0,
  language = 'es',
  onPlayPauseChange,
  onTrackIndexChange
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const playlistRef = useRef(playlist);
  const currentTrackIndexRef = useRef(currentTrackIndex);
  const isPlayingRef = useRef(isPlaying);
  const onTrackIndexChangeRef = useRef(onTrackIndexChange);
  const onPlayPauseChangeRef = useRef(onPlayPauseChange);
  const hasLoadedTrackRef = useRef(false);

  useEffect(() => {
    playlistRef.current = playlist;
    currentTrackIndexRef.current = currentTrackIndex;
    isPlayingRef.current = isPlaying;
    onTrackIndexChangeRef.current = onTrackIndexChange;
    onPlayPauseChangeRef.current = onPlayPauseChange;
  }, [playlist, currentTrackIndex, isPlaying, onTrackIndexChange, onPlayPauseChange]);

  // Close panel when clicking outside the music player container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playerRef.current && !playerRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize or update audio src when track index changes
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        const tracks = playlistRef.current;
        if (tracks.length === 0) return;

        const nextIndex = (currentTrackIndexRef.current + 1) % tracks.length;
        if (onTrackIndexChangeRef.current) {
          onTrackIndexChangeRef.current(nextIndex);
        }
      };
    }

    if (playlist.length > 0 && playlist[currentTrackIndex]) {
      const currentTrack = playlist[currentTrackIndex];

      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      
      if (hasLoadedTrackRef.current && isPlayingRef.current) {
        audioRef.current.play().catch(err => console.log('Audio autoplay blocked or interrupted:', err));
      }

      hasLoadedTrackRef.current = true;
    }
  }, [playlist, currentTrackIndex]);

  // Sync play/pause state from parent prop to local audio node
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleUnlock = () => {
      if (isPlaying && audioRef.current && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => {
            window.removeEventListener('click', handleUnlock, true);
            window.removeEventListener('touchstart', handleUnlock, true);
            window.removeEventListener('pointerdown', handleUnlock, true);
          })
          .catch(err => console.log('Unlock play failed:', err));
      }
    };

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.log('Audio play action blocked by browser policies. Will play on first interaction:', err);
        // Register interaction listeners to start play on first user gesture
        window.addEventListener('click', handleUnlock, true);
        window.addEventListener('touchstart', handleUnlock, true);
        window.addEventListener('pointerdown', handleUnlock, true);
      });
    } else {
      audioRef.current.pause();
      // Clean up in case we pause before interaction
      window.removeEventListener('click', handleUnlock, true);
      window.removeEventListener('touchstart', handleUnlock, true);
      window.removeEventListener('pointerdown', handleUnlock, true);
    }

    return () => {
      window.removeEventListener('click', handleUnlock, true);
      window.removeEventListener('touchstart', handleUnlock, true);
      window.removeEventListener('pointerdown', handleUnlock, true);
    };
  }, [isPlaying]);

  // Cleanup audio node on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    const nextPlayState = !isPlaying;
    if (onPlayPauseChangeRef.current) {
      onPlayPauseChangeRef.current(nextPlayState);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    if (onTrackIndexChange) {
      onTrackIndexChange(nextIndex);
    }
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    if (onTrackIndexChange) {
      onTrackIndexChange(prevIndex);
    }
  };

  const activeTrack = playlist[currentTrackIndex];

  return (
    <div className="music-player-floating" ref={playerRef}>
      {/* Floating neon toggle button */}
      <Button 
        type="button" 
        variant="rotate-icon"
        className={`music-toggle-btn ${isPlaying ? 'playing' : ''}`}
        onClick={() => setPanelOpen(!panelOpen)}
        title={language === 'es' ? 'Reproductor de Música' : 'Music Player'}
        icon="🎵"
      />

      {/* Control Panel Panel */}
      <div className={`music-player-panel ${panelOpen ? 'active' : ''}`}>
        {activeTrack ? (
          <>
            <div className="track-info">
              <span className="track-title">{activeTrack.title}</span>
              <span className="track-artist">{activeTrack.artist}</span>
            </div>
            
            {/* Control Keys */}
            <div className="player-controls">
              <button 
                type="button" 
                className="btn-ctrl" 
                onClick={handlePrev}
                title="Prev"
              >
                ⏮
              </button>
              
              <button 
                type="button" 
                className="btn-ctrl play-pause" 
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <button 
                type="button" 
                className="btn-ctrl" 
                onClick={handleNext}
                title="Next"
              >
                ⏭
              </button>
            </div>

            {/* Selectable track list in miniature */}
            <div style={{ maxHeight: '80px', overflowY: 'auto', marginTop: '6px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {playlist.map((track, idx) => (
                <div 
                  key={track.id} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    background: idx === currentTrackIndex ? 'rgba(97, 64, 55, 0.15)' : 'transparent',
                    fontWeight: idx === currentTrackIndex ? 'bold' : 'normal',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => onTrackIndexChange && onTrackIndexChange(idx)}
                >
                  <span>{track.title}</span>
                  <span>{idx === currentTrackIndex && isPlaying ? '🔊' : ''}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            {language === 'es' ? 'No hay canciones disponibles' : 'No tracks available'}
          </span>
        )}
      </div>
    </div>
  );
}

export default MusicPlayer;
