import React from 'react';

export default function NoticeModal({ visible, onClose, reels = [], loading = false }) {
  const parseImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (trimmed.includes('drive.google.com')) {
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
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    if (trimmed.includes('pinimg.com') && trimmed.includes('/736x/')) {
      return trimmed.replace('/736x/', '/474x/');
    }
    return trimmed;
  };

  if (!visible) return null;

  return (
    <div className="notice-modal-overlay">
      <div className="notice-modal-container">
        <header className="notice-modal-header">
          <h2>Novedades de la Semana</h2>
          <button className="notice-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </header>

        <div className="notice-modal-content">
          {loading ? (
            <div className="notice-loading">
              <div className="welcome-spinner"></div>
              <p>Cargando novedades...</p>
            </div>
          ) : reels.length > 0 ? (
            <div className="notice-reels-slider">
              {reels.map((url, index) => (
                <div key={index} className="notice-reel-slide">
                  <div className="notice-reel-badge">Reel {index + 1}</div>
                  <img src={parseImageUrl(url)} alt={`Noticia Reel ${index + 1}`} className="notice-reel-img" />
                </div>
              ))}
              
              {/* Decorative end card */}
              <div className="notice-reel-slide notice-end-slide">
                <div className="notice-end-content">
                  <h3>¡Eso es todo!</h3>
                  <p>Explora nuestra colección completa y encuentra tu outfit ideal.</p>
                  <button className="notice-end-btn" onClick={onClose}>
                    Explorar Catálogo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="notice-empty">
              <p>No hay novedades disponibles en este momento.</p>
              <button className="notice-end-btn" onClick={onClose}>
                Explorar Catálogo
              </button>
            </div>
          )}
        </div>
        
        <div className="notice-modal-footer">
          <span className="notice-swipe-hint">Desliza a la derecha para ver más &rarr;</span>
        </div>
      </div>
    </div>
  );
}
