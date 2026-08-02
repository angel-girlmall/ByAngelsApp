import React, { useState, useRef, useEffect } from 'react';

export default function NoticeModal({ visible, onClose, reels = [], loading = false }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
    }
  }, [visible]);

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

  const totalSlides = reels.length > 0 ? reels.length + 1 : 0; // Reels + End card

  const handlePrevSlide = () => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      touchStartX.current = e.targetTouches[0].clientX;
      touchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      touchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    const threshold = 40; // Minimum swipe distance in px
    const diff = touchStartX.current - touchEndX.current;
    if (diff > threshold) {
      // Swiped left -> move exactly 1 slide next
      handleNextSlide();
    } else if (diff < -threshold) {
      // Swiped right -> move exactly 1 slide prev
      handlePrevSlide();
    }
  };

  return (
    <div className="notice-modal-overlay">
      <div className="notice-modal-container">
        <header className="notice-modal-header">
          <h2>Novedades de la Semana</h2>
          <button className="notice-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </header>

        <div 
          className="notice-modal-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="notice-loading">
              <div className="welcome-spinner"></div>
              <p>Cargando novedades...</p>
            </div>
          ) : reels.length > 0 ? (
            <div className="notice-reels-wrapper">
              <div 
                className="notice-reels-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {reels.map((url, index) => (
                  <div key={index} className="notice-reel-slide">
                    <div className="notice-reel-badge">Reel {index + 1} de {reels.length}</div>
                    <img 
                      src={parseImageUrl(url)} 
                      alt={`Noticia Reel ${index + 1}`} 
                      className="notice-reel-img" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600';
                      }}
                    />
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

              {/* Navigation Arrows for 1-by-1 sliding */}
              {totalSlides > 1 && (
                <>
                  <button 
                    type="button" 
                    className="notice-slide-arrow prev" 
                    onClick={handlePrevSlide}
                    aria-label="Noticia anterior"
                  >
                    &#10094;
                  </button>
                  <button 
                    type="button" 
                    className="notice-slide-arrow next" 
                    onClick={handleNextSlide}
                    aria-label="Siguiente noticia"
                  >
                    &#10095;
                  </button>
                </>
              )}
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
          {totalSlides > 1 && (
            <div className="notice-dots-container">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`notice-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
          <span className="notice-swipe-hint">Desliza o usa las flechas (1 en 1) &rarr;</span>
        </div>
      </div>
    </div>
  );
}
