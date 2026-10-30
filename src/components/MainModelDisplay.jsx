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

  // Double-buffering state: keeps previous image visible until new image is 100% loaded and decoded
  const [displayedImage, setDisplayedImage] = useState(activeImage);
  const [incomingImage, setIncomingImage] = useState(null);

  // Pre-decode all current garment poses in browser memory to eliminate any pose change lag/blink
  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach((url) => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [images]);

  // Handle activeImage change without any blank white gap
  useEffect(() => {
    if (!activeImage) {
      setDisplayedImage(null);
      setIncomingImage(null);
      return;
    }

    if (activeImage === displayedImage) {
      setIncomingImage(null);
      return;
    }

    let isCancelled = false;
    const preloadImg = new Image();
    preloadImg.src = activeImage;

    const onComplete = () => {
      if (!isCancelled) {
        setDisplayedImage(activeImage);
        setIncomingImage(null);
      }
    };

    if (preloadImg.complete && preloadImg.naturalWidth > 0) {
      // Already cached in memory: seamless immediate switch
      onComplete();
    } else {
      setIncomingImage(activeImage);
      preloadImg.onload = onComplete;
      preloadImg.onerror = onComplete;
    }

    return () => {
      isCancelled = true;
      preloadImg.onload = null;
      preloadImg.onerror = null;
    };
  }, [activeImage, displayedImage]);

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

      {/* Brand logo - Lua Mila with animated crescent moon, stars and sparkling flares */}
      <div className="brand-lua-mila" role="banner" aria-label="Lua Mila">
        <div className="lua-mila-moon-wrapper">
          <svg
            viewBox="0 0 170 145"
            className="lua-mila-moon-svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="luaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF2" />
                <stop offset="20%" stopColor="#FCE4A0" />
                <stop offset="45%" stopColor="#D4A044" />
                <stop offset="70%" stopColor="#BF8323" />
                <stop offset="88%" stopColor="#FCE6A6" />
                <stop offset="100%" stopColor="#FFFBF0" />
              </linearGradient>

              <radialGradient id="luaAura" cx="48%" cy="52%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 230, 160, 0.35)" />
                <stop offset="50%" stopColor="rgba(218, 165, 32, 0.12)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              {/* Flare gradient */}
              <radialGradient id="luaFlareGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#FFF0BA" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#E2B056" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#E2B056" stopOpacity="0" />
              </radialGradient>

              <filter id="luaGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient golden aura behind the crescent */}
            <circle cx="86" cy="74" r="54" fill="url(#luaAura)" className="lua-ambient-aura" />

            {/* Delicate Hollow Crescent Moon - Fine golden border and transparent center */}
            <path
              d="M 89,18 A 54.7,54.7 0 1,0 138,88 A 46.1,46.1 0 1,1 89,18 Z"
              fill="none"
              stroke="url(#luaGoldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#luaGlow)"
              className="lua-crescent-moon"
            />

            {/* Central 5-pointed star nestled inside the crescent hollow */}
            <polygon
              points="99,55 101.5,60.5 107.5,61.2 103,65.5 104.2,71.5 99,68.2 93.8,71.5 95,65.5 90.5,61.2 96.5,60.5"
              fill="url(#luaGoldGrad)"
              filter="url(#luaGlow)"
              className="lua-star lua-star-center"
            />

            {/* Orbiting stars from Lua Mila reference */}
            {/* Top star near top tip */}
            <polygon
              points="54,10 55.2,13 58,13.5 55.8,15.5 56.4,18.5 54,17 51.6,18.5 52.2,15.5 50,13.5 52.8,13"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-top"
            />
            {/* Upper right star */}
            <polygon
              points="118,17 119.5,20.5 123,21 120.5,23.5 121.2,27 118,25 114.8,27 115.5,23.5 113,21 116.5,20.5"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-top-right"
            />
            {/* Lower star below bottom tip */}
            <polygon
              points="132,111 133.5,114.5 137,115 134.5,117.5 135.2,121 132,119 128.8,121 129.5,117.5 127,115 130.5,114.5"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-bottom-right"
            />
            {/* Small star on right side */}
            <polygon
              points="120,72 121,74.2 123.5,74.7 121.7,76.5 122.2,79 120,77.6 117.8,79 118.3,76.5 116.5,74.7 119,74.2"
              fill="url(#luaGoldGrad)"
              className="lua-star"
            />

            {/* Tiny stardust sparkle dots */}
            <circle cx="82" cy="72" r="1.3" fill="#FFFBF0" className="lua-star-dot" />
            <circle cx="126" cy="52" r="1.2" fill="#FFFBF0" className="lua-star-dot" />
            <circle cx="70" cy="38" r="1.1" fill="#FFFBF0" className="lua-star-dot" />
            <circle cx="106" cy="100" r="1.2" fill="#FFFBF0" className="lua-star-dot" />

            {/* Animated Sparkles / Brillitos mágicos */}
            {/* Brillito Principal Grande: Gran destello en el borde inferior-izquierdo de la luna */}
            <g className="lua-sparkle lua-sparkle-1" transform="translate(46, 106)">
              <ellipse cx="0" cy="0" rx="36" ry="1.8" fill="url(#luaFlareGrad)" />
              <ellipse cx="0" cy="0" rx="20" ry="1.2" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1.8" ry="14" fill="url(#luaFlareGrad)" />
              <ellipse cx="0" cy="0" rx="1.1" ry="8" fill="#FFFFFF" />
              <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
            </g>

            {/* Brillito 2: Cerca de la estrella central */}
            <g className="lua-sparkle lua-sparkle-2" transform="translate(107, 56)">
              <ellipse cx="0" cy="0" rx="9" ry="1.1" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1.1" ry="9" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Brillito 3: En la estrella superior */}
            <g className="lua-sparkle lua-sparkle-3" transform="translate(54, 14)">
              <ellipse cx="0" cy="0" rx="8" ry="1" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1" ry="8" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="1.3" fill="#FFFFFF" />
            </g>

            {/* Brillito 4: En la punta inferior de la luna */}
            <g className="lua-sparkle lua-sparkle-4" transform="translate(138, 88)">
              <ellipse cx="0" cy="0" rx="10" ry="1.1" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1.1" ry="10" fill="#FFFFFF" />
              <path d="M 0,-5 Q 0,0 5,0 Q 0,0 0,5 Q 0,0 -5,0 Q 0,0 0,-5 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
            </g>

            {/* Brillito 5: En la estrella inferior derecha */}
            <g className="lua-sparkle lua-sparkle-5" transform="translate(132, 116)">
              <ellipse cx="0" cy="0" rx="7" ry="0.9" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="0.9" ry="7" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="1.2" fill="#FFFFFF" />
            </g>
          </svg>
        </div>

        {/* Brand Text: LUA ★ MILA */}
        <h1 className="brand-lua-mila-text">
          <span>LUA</span>
          <span className="brand-lua-mila-star">★</span>
          <span>MILA</span>
        </h1>
      </div>

      {/* Model Active Pose Image with Zero-Flicker Double Buffering */}
      <div className="model-container">
        {displayedImage ? (
          <img
            key={displayedImage}
            src={displayedImage}
            alt={`Model pose ${currentPoseIndex + 1}`}
            className="model-image"
            loading="eager"
            decoding="sync"
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

        {/* Hidden incoming image preloader in DOM: loads & decodes before switching displayedImage */}
        {incomingImage && incomingImage !== displayedImage && (
          <img
            key={`preload-${incomingImage}`}
            src={incomingImage}
            alt=""
            aria-hidden="true"
            className="model-image"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1,
              visibility: 'hidden'
            }}
            loading="eager"
            decoding="sync"
            onLoad={() => {
              setDisplayedImage(incomingImage);
              setIncomingImage(null);
            }}
          />
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

