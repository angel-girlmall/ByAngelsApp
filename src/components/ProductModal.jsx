import React, { useState, useEffect, useRef } from 'react';
import ComboBox from './common/ComboBox';

const sizeOptions = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' }
];

/**
 * ProductModal Component
 * Properties (Inputs):
 *  - visible: boolean (.Visible)
 *  - product: Object (garment data including imgReel0 - imgReel6)
 *  - language: string ('es' | 'en')
 *  - labels: Object (i18n translation strings)
 * Events (Outputs):
 *  - onClose: Function
 *  - onCartAdded: Function(product, size)
 */
function ProductModal({
  visible = false,
  product = null,
  language = 'es',
  labels = {},
  onClose,
  onCartAdded
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset slide index when opening/changing products
  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      setSelectedSize('M');
    }
  }, [visible, product]);

  if (!visible || !product) return null;

  // Retrieve imgReel0 and imgReel7 (or fallback to imgReel1/imgReel6 if imgReel7 is not set yet)
  const secondaryImage = (product.imgReel7 && typeof product.imgReel7 === 'string' && product.imgReel7.trim()) 
    ? product.imgReel7.trim() 
    : (product.imgReel1 || product.imgReel6 || product.imgReel2 || '');

  const rawImages = [product.imgReel0, secondaryImage].filter(img => Boolean(img && typeof img === 'string' && img.trim()));
  const images = Array.from(new Set(rawImages));

  // Fallback if no images found
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600');
  }

  // Format price according to selected language (USD for 'en', Soles for 'es')
  const displayPrice = language === 'en'
    ? `$ ${product.precioDolares || product.PrecioDolares || (Number(product.Precio) / 3.7).toFixed(2)} USD`
    : `S/. ${product.Precio}`;

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Mobile Swipe Gesture Event Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const threshold = 50; // swipe minimum distance in pixels
    const diff = touchStartX.current - touchEndX.current;

    if (diff > threshold) {
      // Swiped left -> next slide
      handleNextSlide();
    } else if (diff < -threshold) {
      // Swiped right -> prev slide
      handlePrevSlide();
    }
  };

  const handleAddToCart = () => {
    if (onCartAdded) {
      onCartAdded(product, selectedSize);
    }
    if (onClose) {
      onClose();
    }
  };


  return (
    <div className={`modal-overlay ${visible ? 'visible' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Carrusel Deslizable (7 Images Slider) */}
        <div className="modal-slider">
          <div 
            className="slider-track-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="slider-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {images.map((imgUrl, index) => (
                <div className="slider-slide" key={index}>
                  <img 
                    src={imgUrl} 
                    alt={`${product.Nombre} view ${index}`} 
                    className="slider-img"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Slider Arrow Controls */}
          {images.length > 1 && (
            <>
              <button 
                type="button" 
                className="slider-nav-btn prev"
                onClick={handlePrevSlide}
              >
                ❮
              </button>
              <button 
                type="button" 
                className="slider-nav-btn next"
                onClick={handleNextSlide}
              >
                ❯
              </button>
            </>
          )}

          {/* Slider Indicator Dots */}
          <div className="slider-dot-indicators">
            {images.map((_, index) => (
              <span 
                key={index}
                className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="modal-details">
          <div className="modal-title-row">
            <h2 className="modal-product-name">{product.Nombre}</h2>
          </div>

          <div className="modal-meta-grid">
            <div className="meta-item">
              <div className="meta-label">{labels.categoryLabel || 'Category'}</div>
              <div className="meta-value">{product.Categoria}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{labels.colorLabel || 'Color'}</div>
              <div className="meta-value">{product.Color}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{labels.priceLabel || 'Price'}</div>
              <div className="meta-value">{displayPrice}</div>
            </div>
          </div>

          <ComboBox
            id="modal-size-select"
            name="size"
            label={language === 'es' ? 'Talla' : 'Size'}
            value={selectedSize}
            options={sizeOptions}
            onChange={(e) => setSelectedSize(e.target.value)}
          />

          <div className="modal-action-row">
            <button 
              type="button" 
              className="btn-add-cart-large"
              onClick={handleAddToCart}
            >
              🛒 {labels.cartAdd || 'Add to Cart'}
            </button>
            <button 
              type="button" 
              className="btn-close-modal"
              onClick={onClose}
            >
              {labels.closeButton || 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductModal;
