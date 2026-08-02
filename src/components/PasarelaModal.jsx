import React, { useState, useEffect } from 'react';
import appConfig from '../config/appConfig.json';

/**
 * PasarelaModal Component
 * Displays catwalk video for selected product.
 * Automatically extracts direct MP4 video streams for Pinterest links, Google Drive Videos, YouTube, Shorts, and direct MP4s.
 */
function PasarelaModal({ visible, onClose, product, language = 'es' }) {
  const [extractedPinterestMp4, setExtractedPinterestMp4] = useState('');
  const [loadingPinterest, setLoadingPinterest] = useState(false);

  const videoUrl = product?.urlVideoPasarela || product?.urlVideo || '';
  const apiBaseUrl = import.meta.env.VITE_API_URL || appConfig.apiUrl || 'http://localhost:5000';

  useEffect(() => {
    if (!visible || !videoUrl) {
      setExtractedPinterestMp4('');
      return;
    }

    // Check if it's a Pinterest pin URL
    if (videoUrl.includes('pinterest.com/pin/')) {
      setLoadingPinterest(true);
      fetch(`${apiBaseUrl}/api/pinterest-video?url=${encodeURIComponent(videoUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.videoUrl) {
            setExtractedPinterestMp4(data.videoUrl);
          }
        })
        .catch(err => console.error('Error extracting Pinterest video:', err))
        .finally(() => setLoadingPinterest(false));
    } else {
      setExtractedPinterestMp4('');
    }
  }, [visible, videoUrl, apiBaseUrl]);

  if (!visible) return null;

  // Converts Google Drive, YouTube, and Pinterest URLs into working iframe embed URLs
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    // Google Drive Video Link (file/d/FILE_ID/view or open?id=FILE_ID) -> /preview iframe
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

    // Pinterest Pin Video Link (fallback embed if backend extraction isn't ready)
    if (trimmed.includes('pinterest.com/pin/')) {
      const matchPin = trimmed.match(/\/pin\/([0-9]+)/);
      if (matchPin && matchPin[1]) {
        return `https://assets.pinterest.com/ext/embed.html?id=${matchPin[1]}`;
      }
    }

    // YouTube Shorts (youtube-nocookie for privacy)
    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
    }

    // YouTube standard watch / be links
    const ytMatch = trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|\/v\/|https:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    return trimmed;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectMp4 = (videoUrl.toLowerCase().endsWith('.mp4') || videoUrl.toLowerCase().includes('.mp4?')) && !videoUrl.includes('drive.google.com');
  const activeMp4Source = extractedPinterestMp4 || (isDirectMp4 ? videoUrl : '');

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
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-open-external-pill"
                title={language === 'es' ? 'Abrir enlace externo' : 'Open external link'}
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            )}
            <button className="pasarela-modal-close" onClick={onClose} aria-label="Close modal">
              &times;
            </button>
          </div>
        </header>

        <div className="pasarela-modal-body">
          {!videoUrl ? (
            <div className="pasarela-empty-state">
              <i className="fa-solid fa-film" style={{ fontSize: '3rem', opacity: 0.6, marginBottom: '16px' }}></i>
              <h3>{language === 'es' ? 'Próximamente Video de Pasarela' : 'Catwalk Video Coming Soon'}</h3>
              <p>{language === 'es' ? 'El video de esta prenda se agregará muy pronto en el catálogo.' : 'The video for this garment will be added soon to the catalog.'}</p>
            </div>
          ) : activeMp4Source ? (
            /* Pure HTML5 Native MP4 Video Player (No Pinterest buttons, No redirects, Fullscreen controls!) */
            <video 
              key={activeMp4Source}
              src={activeMp4Source} 
              controls 
              autoPlay 
              loop 
              playsInline 
              className="pasarela-video-player"
            />
          ) : loadingPinterest ? (
            <div className="pasarela-empty-state">
              <span className="spinner" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>⏳</span>
              <p>{language === 'es' ? 'Cargando video HD de Pinterest...' : 'Loading HD Pinterest video...'}</p>
            </div>
          ) : embedUrl ? (
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
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-open-external">
                🔗 {language === 'es' ? 'Abrir Video en Nueva Pestaña' : 'Open Video in New Tab'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasarelaModal;
