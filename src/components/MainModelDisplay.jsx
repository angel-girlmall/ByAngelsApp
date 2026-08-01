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

      {/* Brand logo - Sacramento Neon */}
      <h1 className="brand-neon">{brandName}</h1>

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
            onClick={onCartClick}
            title={language === 'es' ? 'Ver Carrito' : 'View Cart'}
            icon="fa-solid fa-cart-shopping"
            variant="rotate-icon"
            badge={cartBadgeCount}
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

