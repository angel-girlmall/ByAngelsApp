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
        <span className="card-price">S/. {price}</span>
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
