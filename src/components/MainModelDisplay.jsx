import React, { useState, useEffect } from 'react';
import Button from './common/Button';

/**
 * MainModelDisplay Component
 * Properties (Inputs):
 *  - images: Array [imgReel0, imgReel1, imgReel2, imgReel3, imgReel4, imgReel5]
 *  - currentPoseIndex: number (0 to 5)
 *  - brandName: string (default "Angel Girl")
 *  - language: string ('es' | 'en')
 * Events (Outputs):
 *  - onPoseChange: Function(newPoseIndex)
 */
function MainModelDisplay({
  images = [],
  currentPoseIndex = 0,
  brandName = 'Angel Girl',
  language = 'es',
  loading = false,
  onPoseChange,
  onCartClick,
  cartBadgeCount = 0,
  onLanguageToggle,
  onNoticeClick,
  onVideoClick,
  skinToneMode = 'clara',
  onSkinToneToggle
}) {
  // Fallback boutique background image optimized for mobile/desktop performance
  const boutiqueBgUrl = 'https://images.unsplash.com/photo-1567401893930-7bec7b3b497f?w=800&q=75&auto=format&fit=crop';

  // Selected pose image
  const activeImage = (images && images.length > 0) ? images[currentPoseIndex % images.length] : null;

  // Sequential rotation through poses (0-2 for Clara, 3-5 for Morena)
  const handleRotatePose = () => {
    let nextIndex;
    if (skinToneMode === 'clara') {
      nextIndex = ((currentPoseIndex - 0 + 1) % 3) + 0;
    } else {
      nextIndex = ((currentPoseIndex - 3 + 1) % 3) + 3;
    }
    if (onPoseChange) {
      onPoseChange(nextIndex);
    }
  };

  const getPoseLabel = () => {
    const poseNumber = currentPoseIndex + 1;
    const tandaNumber = currentPoseIndex >= 3 ? 2 : 1;
    if (language === 'es') {
      return `Pose ${poseNumber} / 6 (Tanda ${tandaNumber})`;
    } else {
      return `Pose ${poseNumber} / 6 (Set ${tandaNumber})`;
    }
  };

  return (
    <section className="left-panel">
      {/* Arched shelving simulation background */}
      <div
        className="boutique-bg"
        style={{ backgroundImage: `url(${boutiqueBgUrl})` }}
      />
      <div className="boutique-overlay" />

      {/* Hanging Bubble Video Button (Swinging & Rotating on its Axis) */}
      <div 
        className="hanging-video-bubble-container" 
        onClick={onVideoClick} 
        title={language === 'es' ? 'Ver Pasarela / Video' : 'Watch Catwalk Video'}
      >
        <div className="hanging-thread"></div>
        <div className="hanging-bubble-button">
          <i className="fa-solid fa-video"></i>
          <span className="hanging-bubble-glow"></span>
        </div>
        <span className="hanging-bubble-label">PASARELA</span>
      </div>

      {/* Brand logo - Sacramento Neon with Angel Wings & Floating Halo on 'l' of Angel */}
      <h1 className="brand-neon">
        <span className="neon-wing-wrapper neon-wing-left" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="neon-wing-svg">
            <path
              d="M58 48 C44 32, 28 16, 4 4 C14 16, 28 28, 44 38 C30 31, 15 28, 2 22 C14 32, 28 41, 40 46 C27 42, 14 43, 6 40 C18 48, 33 53, 50 51 C38 50, 26 53, 18 52 C30 57, 46 56, 58 48 Z"
              fill="rgba(255, 96, 173, 0.18)"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="brand-neon-text">
          {brandName === 'Angel Girl' ? (
            <>
              <span className="neon-letter-a-wrapper">
                A
                <svg className="neon-halo-svg" viewBox="0 0 80 32" aria-hidden="true">
                  <ellipse
                    cx="40"
                    cy="16"
                    rx="32"
                    ry="9"
                    fill="none"
                    stroke="#ff60ad"
                    strokeWidth="3.5"
                    filter="drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 10px #ff60ad)"
                  />
                  <ellipse
                    cx="40"
                    cy="16"
                    rx="32"
                    ry="9"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              ngel Girl
            </>
          ) : (
            brandName
          )}
        </span>
        <span className="neon-wing-wrapper neon-wing-right" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="neon-wing-svg">
            <path
              d="M58 48 C44 32, 28 16, 4 4 C14 16, 28 28, 44 38 C30 31, 15 28, 2 22 C14 32, 28 41, 40 46 C27 42, 14 43, 6 40 C18 48, 33 53, 50 51 C38 50, 26 53, 18 52 C30 57, 46 56, 58 48 Z"
              fill="rgba(255, 96, 173, 0.18)"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </h1>

      {/* Model Active Pose Image */}
      <div className="model-container">
        {activeImage ? (
          <img
            src={activeImage}
            alt={`Model pose ${currentPoseIndex + 1}`}
            className="model-image"
          />
        ) : loading ? (
          <div className="model-loading-placeholder">
            <span className="spinner">⌛</span>
            <p>{language === 'es' ? 'Cargando Modelo...' : 'Loading Model...'}</p>
          </div>
        ) : (
          <div className="model-loading-placeholder">
            <p style={{ opacity: 0.7 }}>{language === 'es' ? 'Sin modelo disponible' : 'No model available'}</p>
          </div>
        )}
      </div>

      {/* Control Overlay */}
      {images && images.length > 0 && (
        <div className="pose-rotator-overlay">
          {/* Language Toggle Button - rotates between ES and EN */}
          <Button
            variant="lang-icon"
            onClick={onLanguageToggle}
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            icon="fa-solid fa-globe"
          >
            <span className="lang-icon-label">{language === 'es' ? 'EN' : 'ES'}</span>
          </Button>

          {/* News / Notice toggle button */}
          <Button
            onClick={onNoticeClick}
            title={language === 'es' ? 'Novedades' : 'News/Notices'}
            icon="fa-solid fa-bell"
            variant="rotate-icon"
          />

          {/* Cart toggle button */}
          <Button
            onClick={() => {
              if (cartBadgeCount > 0 && onCartClick) {
                onCartClick();
              }
            }}
            title={language === 'es' ? 'Ver Carrito' : 'View Cart'}
            icon="fa-solid fa-cart-shopping"
            variant="rotate-icon"
            badge={cartBadgeCount}
            className={cartBadgeCount > 0 ? 'cart-has-items-green' : ''}
            style={{ position: 'relative' }}
          />

          {/* Skin Tone Toggle Button - Mode Clara / Morena */}
          <Button
            onClick={onSkinToneToggle}
            title={skinToneMode === 'clara' ? (language === 'es' ? 'Ver Tono Morena' : 'Switch to Brunette') : (language === 'es' ? 'Ver Tono Clara' : 'Switch to Light Skin')}
            icon={skinToneMode === 'clara' ? '👩🏼' : '👩🏾'}
            variant="rotate-icon"
          />

          {/* Rotate Button */}
          <Button
            onClick={handleRotatePose}
            title={language === 'es' ? 'Rotar Pose' : 'Rotate Pose'}
            icon="fa-solid fa-rotate"
            variant="rotate-icon"
          />


        </div>
      )}
    </section>
  );
}

export default MainModelDisplay;

