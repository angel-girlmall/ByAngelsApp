import React from 'react';

/**
 * ProductCard Component (VB.NET style inputs/outputs)
 * Properties (Inputs):
 *  - text: string (.Text)
 *  - price: number (.Precio)
 *  - imageSource: string (.ImageSource)
 *  - visible: boolean (.Visible)
 *  - isActive: boolean (.IsActive)
 *  - isNew: boolean
 *  - newBadgeLabel: string
 *  - viewButtonLabel: string
 * Events (Outputs):
 *  - onClick: Function
 *  - onViewDetail: Function
 */
function ProductCard({
  text = '',
  price = 40,
  precioDolares = '',
  language = 'es',
  imageSource = '',
  visible = true,
  isActive = false,
  isNew = false,
  newBadgeLabel = 'NEW',
  viewButtonLabel = 'View',
  onClick,
  onViewDetail
}) {
  if (!visible) return null;

  const formatCleanNumber = (num) => {
    const val = Number(num);
    if (isNaN(val)) return '0';
    if (val % 1 === 0) return val.toString();
    const str = val.toFixed(2);
    return str.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  };

  const rawPriceVal = language === 'en'
    ? (precioDolares || (Number(price) / 3.7).toFixed(2))
    : price;

  const displayPriceStr = language === 'en'
    ? `$ ${formatCleanNumber(rawPriceVal)}`
    : `S/. ${formatCleanNumber(rawPriceVal)}`;

  const handleCardClick = () => {
    if (onClick) onClick();
  };

  const handleViewClick = (e) => {
    e.stopPropagation(); // Avoid triggering parent card selection click
    if (onViewDetail) onViewDetail();
  };

  const getOptimizedPinterestUrl = (url, size = '236x') => {
    if (!url) return '';
    if (url.includes('pinimg.com') && url.includes('/736x/')) {
      return url.replace('/736x/', `/${size}/`);
    }
    return url;
  };

  return (
    <div 
      className={`product-card ${isActive ? 'active' : ''}`}
      onClick={handleCardClick}
    >
      {isNew && (
        <span className="badge-new">{newBadgeLabel}</span>
      )}
      
      <div className="card-img-container">
        <img 
          src={getOptimizedPinterestUrl(imageSource, '236x')} 
          alt={text} 
          className="card-img" 
          loading="lazy"
        />
      </div>

      <div className="card-info-bar">
        <span className="card-price">{displayPriceStr}</span>
        <button 
          type="button" 
          className="btn-view"
          onClick={handleViewClick}
        >
          {viewButtonLabel}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
