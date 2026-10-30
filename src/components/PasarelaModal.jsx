import React, { useState, useEffect, useRef } from 'react';
import appConfig from '../config/appConfig.json';

// Persistent in-memory video stream URL cache across modal views
const pinterestUrlCache = new Map();

/**
 * PasarelaModal Component
 * Displays catwalk video for selected product.
 * Preloads catwalk video in background as soon as model view loads.
 * Discards previous load if user switches models, instantly playing ready video.
 */
function PasarelaModal({ 
  visible, 
  onClose, 
  product, 
  language = 'es',
  isPlayingMusic = false,
  onToggleMusic
}) {
  const [extractedPinterestMp4, setExtractedPinterestMp4] = useState('');
  const [loadingPinterest, setLoadingPinterest] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const videoRef = useRef(null);
  const abortControllerRef = useRef(null);

  const videoUrl = (product?.urlVideoPasarela || product?.urlVideo || '').trim();
  const apiBaseUrl = import.meta.env.VITE_API_URL || appConfig.apiUrl || 'http://localhost:5000';

  // Fetch and resolve video on demand ONLY when modal is visible (saves CPU/RAM on mobile)
  useEffect(() => {
    // Abort previous download / API call if user switched models or closed modal
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!visible) {
      // Clean up video decoder and memory when modal is closed
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.src = '';
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch (e) {}
      }
      return;
    }

    if (!videoUrl) {
      setExtractedPinterestMp4('');
      setLoadingPinterest(false);
      return;
    }

    // 1. Instant Cache Hit (0ms playback)
    if (pinterestUrlCache.has(videoUrl)) {
      setExtractedPinterestMp4(pinterestUrlCache.get(videoUrl));
      setLoadingPinterest(false);
      return;
    }

    // 2. Fetch and resolve Pinterest MP4 on demand
    if (videoUrl.includes('pinterest.com/pin/') || videoUrl.includes('pin.it/')) {
      setLoadingPinterest(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      fetch(`${apiBaseUrl}/api/pinterest-video?url=${encodeURIComponent(videoUrl)}`, {
        signal: controller.signal
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.videoUrl) {
            let finalUrl = data.videoUrl;
            // If Pinterest returns HLS (.m3u8), auto-derive direct MP4 so Chrome/Android can play natively
            if (finalUrl.includes('pinimg.com/videos/') && finalUrl.includes('.m3u8')) {
              finalUrl = finalUrl.replace('/hls/', '/expMp4/').replace('.m3u8', '_720w.mp4');
            }
            pinterestUrlCache.set(videoUrl, finalUrl);
            setExtractedPinterestMp4(finalUrl);
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Could not extract raw Pinterest video:', err);
          }
        })
        .finally(() => {
          setLoadingPinterest(false);
        });

      return () => {
        controller.abort();
      };
    } else {
      setExtractedPinterestMp4('');
      setLoadingPinterest(false);
    }
  }, [visible, videoUrl, apiBaseUrl]);

  const isDirectMp4 = (videoUrl.toLowerCase().endsWith('.mp4') || videoUrl.toLowerCase().includes('.mp4?')) && !videoUrl.includes('drive.google.com');
  const activeMp4Source = extractedPinterestMp4 || (isDirectMp4 ? videoUrl : '');

  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.15); // 1.15x smooth speed eliminates sluggish 24fps catwalk lag
  const playPromiseRef = useRef(null);

  // Apply speed to video element
  const applySpeed = (newSpeed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const cycleSpeed = (e) => {
    if (e) e.stopPropagation();
    const speeds = [1.0, 1.15, 1.25];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    applySpeed(nextSpeed);
  };

  // Single safe play orchestrator - only triggers once video is ready and prevents collisions
  const triggerPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute('muted', '');
    video.defaultMuted = isPlayingMusic;
    video.muted = isPlayingMusic;
    video.playsInline = true;
    video.playbackRate = speed;

    if (!video.paused) {
      setIsPaused(false);
      return;
    }

    if (playPromiseRef.current) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromiseRef.current = playPromise;
      playPromise
        .then(() => {
          playPromiseRef.current = null;
          setIsPaused(false);
          if (videoRef.current) {
            videoRef.current.playbackRate = speed;
          }
        })
        .catch((err) => {
          playPromiseRef.current = null;
          console.warn('triggerPlay notice:', err.name);
          // If browser policy blocked playback, guarantee muted and retry
          if (err.name === 'NotAllowedError') {
            video.muted = true;
            video.play()
              .then(() => {
                setIsPaused(false);
                if (videoRef.current) videoRef.current.playbackRate = speed;
              })
              .catch(() => setIsPaused(true));
          } else {
            setIsPaused(true);
          }
        });
    }
  };

  // Immediate playback check when modal opens (handles cached videos where onCanPlay already fired)
  useEffect(() => {
    if (visible && activeMp4Source) {
      const timer = setTimeout(() => {
        triggerPlay();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, activeMp4Source]);

  // Sync video audio mute with background playlist state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isPlayingMusic;
    }
  }, [isPlayingMusic]);

  // Do not render any video element or occupy hardware decoder memory when modal is closed
  if (!visible) {
    return null;
  }

  // Social Media Share Handler
  const handleShareVideo = async () => {
    if (!videoUrl) return;

    const shareTitle = `Pasarela ByAngels: ${product?.Nombre || 'Colección Exclusiva'}`;
    const shareText = `¡Mira la pasarela virtual de ${product?.Nombre || 'esta prenda'} en ByAngels Boutique! 🎬✨`;
    const shareUrl = videoUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, using clipboard fallback:', err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (clipErr) {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
      window.open(waUrl, '_blank');
    }
  };

  // Converts Google Drive, YouTube, and Pinterest URLs into working iframe embed URLs
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
      let fileId = '';
      const matchD = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      } else {
        const matchId = trimmed.match(/[?&]id=([^&]+)/);
        if (matchId && matchId[1]) {
          fileId = matchId[1];
        }
      }
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    if (trimmed.includes('pinterest.com/pin/')) {
      const matchPin = trimmed.match(/\/pin\/([0-9]+)/);
      if (matchPin && matchPin[1]) {
        return `https://assets.pinterest.com/ext/embed.html?id=${matchPin[1]}`;
      }
    }

    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`;
    }

    const ytMatch = trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|\/v\/|https:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`;
    }

    return trimmed;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const toggleSound = (e) => {
    if (e) e.stopPropagation();
    const nextMusicPlaying = !isPlayingMusic;
    if (videoRef.current) {
      videoRef.current.muted = nextMusicPlaying;
      if (!nextMusicPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
    if (onToggleMusic) {
      onToggleMusic();
    }
  };

  return (
    <div className="pasarela-modal-overlay" onClick={onClose}>
      <div className="pasarela-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="pasarela-modal-header">
          <div className="pasarela-header-info">
            <span className="pasarela-badge">🎬 PASARELA VIRTUAL</span>
            <h2>{product?.Nombre || 'Pasarela de la Colección'}</h2>
            {product && (
              <p className="pasarela-meta">
                {product.Categoria} | {language === 'es' ? 'Color' : 'Color'}: {product.Color}
              </p>
            )}
          </div>
          <div className="pasarela-header-actions">
            {videoUrl && (
              <button 
                type="button" 
                className="btn-open-external-pill"
                onClick={handleShareVideo}
                title={language === 'es' ? 'Compartir video por redes sociales' : 'Share video link'}
              >
                <i className="fa-solid fa-share-nodes"></i>
              </button>
            )}
            <button className="pasarela-modal-close" onClick={onClose} aria-label="Close modal">
              &times;
            </button>
          </div>
        </header>

        {copiedToast && (
          <div className="pasarela-copied-toast">
            <i className="fa-solid fa-check-circle"></i> ¡Enlace del video copiado para compartir! 📋
          </div>
        )}

        <div 
          className="pasarela-modal-body"
          onClick={() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
        >
          {!videoUrl ? (
            <div className="pasarela-empty-state">
              <i className="fa-solid fa-film" style={{ fontSize: '3rem', opacity: 0.6, marginBottom: '16px' }}></i>
              <h3>{language === 'es' ? 'Próximamente Video de Pasarela' : 'Catwalk Video Coming Soon'}</h3>
              <p>{language === 'es' ? 'El video de esta prenda se agregará muy pronto en el catálogo.' : 'The video for this garment will be added soon to the catalog.'}</p>
            </div>
          ) : loadingPinterest ? (
            <div className="pasarela-poster-loader" style={{ position: 'relative', bottom: 'auto' }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>{language === 'es' ? 'Preparando pasarela...' : 'Loading catwalk video...'}</span>
            </div>
          ) : activeMp4Source ? (
            /* Pure HTML5 Native Video: plays directly without static poster */
            <>
              <video 
                ref={videoRef}
                key={activeMp4Source}
                src={activeMp4Source} 
                controls 
                autoPlay 
                loop 
                muted={isPlayingMusic}
                playsInline 
                preload="auto"
                className="pasarela-video-player"
                onCanPlay={triggerPlay}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
              />

              {/* Large Center Play Button if browser paused playback */}
              {isPaused && (
                <button
                  type="button"
                  className="pasarela-center-play"
                  onClick={triggerPlay}
                  aria-label="Reproducir video"
                >
                  <i className="fa-solid fa-play"></i>
                </button>
              )}

              {/* Floating Bottom Action Pills (Speed & Audio) */}
              <div className="pasarela-controls-dock">
                <button
                  type="button"
                  className="pasarela-pill-btn"
                  onClick={cycleSpeed}
                  title="Ajustar velocidad de pasarela"
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>{speed}x</span>
                </button>

                <button
                  type="button"
                  className="pasarela-pill-btn"
                  onClick={toggleSound}
                  title={isPlayingMusic 
                    ? (language === 'es' ? 'Desactivar música y activar audio del video' : 'Mute music and play video audio') 
                    : (language === 'es' ? 'Activar música y silenciar video' : 'Play music and mute video')}
                >
                  <i className={`fa-solid ${isPlayingMusic ? 'fa-music' : 'fa-volume-high'}`}></i>
                  <span>
                    {isPlayingMusic 
                      ? (language === 'es' ? 'Música Tienda' : 'Store Music') 
                      : (language === 'es' ? 'Audio Video' : 'Video Sound')}
                  </span>
                </button>
              </div>
            </>
          ) : embedUrl ? (
            /* Iframe Fallback for YouTube / Google Drive / Pinterest Web */
            <iframe 
              key={embedUrl}
              src={embedUrl} 
              title="Pasarela Video" 
              className="pasarela-iframe-player pasarela-pinterest-iframe"
              scrolling="no"
              style={{ border: 0, overflow: 'hidden' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            />
          ) : (
            <div className="pasarela-empty-state">
              <p>{language === 'es' ? 'No se pudo cargar el reproductor de video.' : 'Could not load video player.'}</p>
              <button type="button" onClick={handleShareVideo} className="btn-open-external">
                🔗 {language === 'es' ? 'Compartir Enlace del Video' : 'Share Video Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasarelaModal;
