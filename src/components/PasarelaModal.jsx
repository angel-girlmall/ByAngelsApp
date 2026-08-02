import React from 'react';

/**
 * PasarelaModal Component
 * Displays catwalk / preview video for the selected product.
 * Supports YouTube URLs, YouTube Shorts, Google Drive Videos, TikTok, or direct MP4 files.
 */
function PasarelaModal({ visible, onClose, product, language = 'es' }) {
  if (!visible) return null;

  const videoUrl = product?.urlVideoPasarela || product?.urlVideo || '';

  // Converts YouTube watch/shorts URLs into embed URLs
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    // YouTube Shorts
    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
    }

    // YouTube standard watch / be links
    const ytMatch = trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|\/v\/|https:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    // Google Drive video link
    if (trimmed.includes('drive.google.com')) {
      const matchD = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (matchD && matchD[1]) {
        return `https://drive.google.com/file/d/${matchD[1]}/preview`;
      }
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
          ) : isDirectMp4 ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              playsInline 
              className="pasarela-video-player"
            />
          ) : embedUrl ? (
            <iframe 
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
