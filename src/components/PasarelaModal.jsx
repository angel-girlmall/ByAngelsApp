import React from 'react';

/**
 * PasarelaModal Component
 * Renders catwalk video for selected product.
 * Uses direct HTML5 media streams for Google Drive (lh3.googleusercontent.com/d/ID)
 * and youtube-nocookie.com for YouTube to prevent play.google.com/log telemetry errors.
 */
function PasarelaModal({ visible, onClose, product, language = 'es' }) {
  if (!visible) return null;

  const videoUrl = product?.urlVideoPasarela || product?.urlVideo || '';

  // Parse Google Drive File ID from any Drive link format
  const getGoogleDriveId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed.includes('drive.google.com') && !trimmed.includes('googleusercontent.com')) return null;

    const matchD = trimmed.match(/\/file\/d\/([^\/]+)/);
    if (matchD && matchD[1]) return matchD[1];

    const matchId = trimmed.match(/[?&]id=([^&]+)/);
    if (matchId && matchId[1]) return matchId[1];

    const matchLh = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchLh && matchLh[1]) return matchLh[1];

    return null;
  };

  const driveId = getGoogleDriveId(videoUrl);

  // Converts YouTube watch/shorts and Pinterest URLs into nocookie embed URLs
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    // Pinterest Pin Video Link (pinterest.com/pin/PIN_ID)
    if (trimmed.includes('pinterest.com/pin/')) {
      const matchPin = trimmed.match(/\/pin\/([0-9]+)/);
      if (matchPin && matchPin[1]) {
        return `https://assets.pinterest.com/ext/embed.html?id=${matchPin[1]}`;
      }
    }

    // YouTube Shorts (Using youtube-nocookie to block telemetry tracking)
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
  const isDirectMp4 = videoUrl.toLowerCase().endsWith('.mp4') || videoUrl.toLowerCase().includes('.mp4?');

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
          <button className="pasarela-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </header>

        <div className="pasarela-modal-body">
          {!videoUrl ? (
            <div className="pasarela-empty-state">
              <i className="fa-solid fa-film" style={{ fontSize: '3rem', opacity: 0.6, marginBottom: '16px' }}></i>
              <h3>{language === 'es' ? 'Próximamente Video de Pasarela' : 'Catwalk Video Coming Soon'}</h3>
              <p>{language === 'es' ? 'El video de esta prenda se agregará muy pronto en el catálogo.' : 'The video for this garment will be added soon to the catalog.'}</p>
            </div>
          ) : driveId ? (
            /* Pure HTML5 Direct Media Stream from lh3.googleusercontent.com (No iframe JS, No play.google.com/log) */
            <video
              key={driveId}
              src={`https://lh3.googleusercontent.com/d/${driveId}`}
              controls
              autoPlay
              loop
              playsInline
              className="pasarela-video-player"
              onError={(e) => {
                // Fallback to drive download stream if lh3 CDN is cold
                if (e.target.src !== `https://drive.google.com/uc?export=download&id=${driveId}`) {
                  e.target.src = `https://drive.google.com/uc?export=download&id=${driveId}`;
                }
              }}
            />
          ) : isDirectMp4 ? (
            <video 
              key={videoUrl}
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              playsInline 
              className="pasarela-video-player"
            />
          ) : embedUrl ? (
            <iframe 
              key={embedUrl}
              src={embedUrl} 
              title="Pasarela Video" 
              className="pasarela-iframe-player" 
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
