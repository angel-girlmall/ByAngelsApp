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
            viewBox="0 0 140 95"
            className="lua-mila-moon-svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="luaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF9E6" />
                <stop offset="25%" stopColor="#F5D78E" />
                <stop offset="60%" stopColor="#C49238" />
                <stop offset="85%" stopColor="#E9C575" />
                <stop offset="100%" stopColor="#FFF2CB" />
              </linearGradient>

              <radialGradient id="luaAura" cx="45%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 230, 160, 0.40)" />
                <stop offset="50%" stopColor="rgba(218, 165, 32, 0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter id="luaGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient golden aura behind the crescent */}
            <circle cx="68" cy="46" r="38" fill="url(#luaAura)" className="lua-ambient-aura" />

            {/* Slender Crescent Moon */}
            <path
              d="M 85,16 A 34,34 0 1,0 85,78 A 27,27 0 1,1 85,16 Z"
              fill="url(#luaGoldGrad)"
              filter="url(#luaGlow)"
              className="lua-crescent-moon"
            />

            {/* Central 5-pointed star nestled inside the crescent */}
            <polygon
              points="78,41 80.5,46 86,47 82,51 83,56.5 78,53.5 73,56.5 74,51 70,47 75.5,46"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-center"
            />

            {/* Small floating stars around the moon */}
            {/* Top star */}
            <polygon
              points="58,11 59.5,14 63,14.5 60.5,17 61,20.5 58,18.5 55,20.5 55.5,17 53,14.5 56.5,14"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-top"
            />
            {/* Upper right star */}
            <polygon
              points="98,18 99,20 101.5,20.5 99.5,22.5 100,25 98,23.5 96,25 96.5,22.5 94.5,20.5 97,20"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-top-right"
            />
            {/* Lower right star */}
            <polygon
              points="104,66 105.5,69 108.5,69.5 106,72 106.5,75 104,73.5 101.5,75 102,72 99.5,69.5 102.5,69"
              fill="url(#luaGoldGrad)"
              className="lua-star lua-star-bottom-right"
            />
            {/* Far upper tiny star */}
            <circle cx="78" cy="20" r="1.3" fill="#FFF2CB" className="lua-star-dot" />
            {/* Bottom-left tiny star */}
            <circle cx="98" cy="42" r="1.5" fill="#FFF2CB" className="lua-star-dot" />

            {/* Animated Sparkles / Brillitos con efecto destello diamante y cruz de luz */}
            {/* Brillito 1: Destello principal en el lomo de la luna */}
            <g className="lua-sparkle lua-sparkle-1" transform="translate(48, 44)">
              <ellipse cx="0" cy="0" rx="9" ry="1.2" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1.2" ry="9" fill="#FFFFFF" />
              <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Brillito 2: Cerca de la estrella central */}
            <g className="lua-sparkle lua-sparkle-2" transform="translate(86, 50)">
              <ellipse cx="0" cy="0" rx="6" ry="1" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1" ry="6" fill="#FFFFFF" />
              <path d="M 0,-5 Q 0,0 5,0 Q 0,0 0,5 Q 0,0 -5,0 Q 0,0 0,-5 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1.2" fill="#FFFFFF" />
            </g>

            {/* Brillito 3: En la punta superior del cuerno */}
            <g className="lua-sparkle lua-sparkle-3" transform="translate(85, 17)">
              <ellipse cx="0" cy="0" rx="5" ry="0.8" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="0.8" ry="5" fill="#FFFFFF" />
              <path d="M 0,-4 Q 0,0 4,0 Q 0,0 0,4 Q 0,0 -4,0 Q 0,0 0,-4 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1" fill="#FFFFFF" />
            </g>

            {/* Brillito 4: En el cuerno inferior */}
            <g className="lua-sparkle lua-sparkle-4" transform="translate(84, 76)">
              <ellipse cx="0" cy="0" rx="5" ry="0.8" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="0.8" ry="5" fill="#FFFFFF" />
              <path d="M 0,-4 Q 0,0 4,0 Q 0,0 0,4 Q 0,0 -4,0 Q 0,0 0,-4 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1" fill="#FFFFFF" />
            </g>

            {/* Brillito 5: Destello flotante a la derecha */}
            <g className="lua-sparkle lua-sparkle-5" transform="translate(112, 40)">
              <ellipse cx="0" cy="0" rx="7" ry="1" fill="#FFFFFF" />
              <ellipse cx="0" cy="0" rx="1" ry="7" fill="#FFFFFF" />
              <path d="M 0,-5.5 Q 0,0 5.5,0 Q 0,0 0,5.5 Q 0,0 -5.5,0 Q 0,0 0,-5.5 Z" fill="#FFF7DB" />
              <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
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

