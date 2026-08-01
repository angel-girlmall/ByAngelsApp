import React, { useRef } from 'react';

/**
 * Cart Component
 * Properties (Inputs):
 *  - visible: boolean
 *  - cartItems: Array [{ product: Object, quantity: number }]
 *  - language: string ('es' | 'en')
 *  - labels: Object (i18n labels)
 *  - whatsappNumber: string
 * Events (Outputs):
 *  - onQuantityChange: Function(productId, quantity)
 *  - onRemove: Function(productId)
 *  - onClose: Function
 */
function Cart({
  visible = false,
  cartItems = [],
  language = 'es',
  labels = {},
  whatsappNumber = '51900962934',
  onQuantityChange,
  onRemove,
  onClose
}) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchCurrentX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    touchCurrentX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].clientX : touchCurrentX.current;
    const endY = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].clientY : touchStartY.current;
    
    const diffX = endX - touchStartX.current;
    const diffY = Math.abs(endY - touchStartY.current);

    // Swipe left-to-right (diffX > 50px) closes the drawer in mobile view
    if (diffX > 50 && diffX > diffY) {
      if (onClose) onClose();
    }
  };

  // Dynamic Programming Pricing Engine
  // Computes the absolute minimum cost by grouping garments into the available bundles
  const calculateTotals = () => {
    // 1. Flatten all garments in the cart into a list of individual prices
    const garmentPrices = [];
    cartItems.forEach(item => {
      const priceVal = Number(item.product.Precio) || 40;
      for (let i = 0; i < item.quantity; i++) {
        garmentPrices.push(priceVal);
      }
    });

    const totalCount = garmentPrices.length;

    // Calculate original sum
    const originalTotal = garmentPrices.reduce((sum, p) => sum + p, 0);

    if (totalCount === 0) {
      return { originalTotal, discountedTotal: 0, discountAmount: 0 };
    }

    // Sort prices descending (applying bundles to more expensive garments first yields maximum discount)
    garmentPrices.sort((a, b) => b - a);

    // DP Table where dp[i] is the minimum price for the prefix of length i
    const dp = new Array(totalCount + 1).fill(0);
    dp[0] = 0;

    for (let i = 1; i <= totalCount; i++) {
      // Option 1: Treat current garment as single
      let minVal = dp[i - 1] + garmentPrices[i - 1];

      // Option 2: Bundle of 3 for S/. 100
      if (i >= 3) {
        minVal = Math.min(minVal, dp[i - 3] + 100);
      }
      // Option 3: Bundle of 5 for S/. 155
      if (i >= 5) {
        minVal = Math.min(minVal, dp[i - 5] + 155);
      }
      // Option 4: Bundle of 6 for S/. 185
      if (i >= 6) {
        minVal = Math.min(minVal, dp[i - 6] + 185);
      }
      // Option 5: Bundle of 12 for S/. 330
      if (i >= 12) {
        minVal = Math.min(minVal, dp[i - 12] + 330);
      }

      dp[i] = minVal;
    }

    const discountedTotal = dp[totalCount];
    const discountAmount = originalTotal - discountedTotal;

    return {
      originalTotal,
      discountedTotal,
      discountAmount
    };
  };

  const { originalTotal, discountedTotal, discountAmount } = calculateTotals();

  // Triggers WhatsApp API with formatted order template text
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    let itemsText = '';
    cartItems.forEach((item, index) => {
      const unitPrice = Number(item.product.Precio) || 40;
      const subtotal = unitPrice * item.quantity;
      itemsText += `\n👗 *${item.product.Nombre}*\n`;
      itemsText += `   - ${labels.colorLabel || 'Color'}: ${item.product.Color}\n`;
      if (item.size) {
        itemsText += `   - ${language === 'es' ? 'Talla' : 'Size'}: ${item.size}\n`;
      }
      itemsText += `   - ${language === 'es' ? 'Cantidad' : 'Qty'}: ${item.quantity}\n`;
      itemsText += `   - ${language === 'es' ? 'Precio Unitario' : 'Unit Price'}: S/. ${unitPrice}\n`;
      itemsText += `   - Subtotal: S/. ${subtotal}\n`;
    });

    const header = labels.whatsappMessage || 'Hola, quiero realizar el siguiente pedido:';

    let summaryText = `\n----------------------------\n`;
    if (discountAmount > 0) {
      summaryText += `❌ *${labels.originalTotal || 'Original Total'}:* S/. ${originalTotal}\n`;
      summaryText += `✅ *${labels.total || 'Total'}:* S/. ${discountedTotal}\n`;
      summaryText += `🎉 *${labels.discount || 'Discount'}:* S/. ${discountAmount}\n`;
    } else {
      summaryText += `✅ *${labels.total || 'Total'}:* S/. ${originalTotal}\n`;
    }

    const fullMessage = `🛍️ *BYANGELS E-COMMERCE* 🛍️\n${header}\n${itemsText}${summaryText}`;
    const encodedText = encodeURIComponent(fullMessage);

    // Redirects to WhatsApp API
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Background overlay click-to-close handler */}
      <div
        className={`cart-drawer-overlay ${visible ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Cart Drawer Box with Swipe-to-Close Gesture */}
      <div 
        className={`cart-drawer ${visible ? 'visible' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cart-header">
          <h2 className="cart-title">🛍️ {labels.cartTitle || 'Shopping Cart'}</h2>
          <div className="cart-swipe-hint">
            <span>Desliza &rarr;</span>
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Cart Item Feed */}
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-icon">🛒</span>
              <p>{labels.cartEmpty || 'Your cart is empty'}</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const itemPrice = Number(item.product.Precio) || 40;
              const itemKey = `${item.product.id}-${item.size || ''}`;
              return (
                <div className="cart-item" key={itemKey}>
                  <img
                    src={item.product.imgReel0} // Catalog thumbnail slot
                    alt={item.product.Nombre}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div>
                      <h4 className="cart-item-name">{item.product.Nombre}</h4>
                      <div className="cart-item-meta">
                        {labels.colorLabel || 'Color'}: {item.product.Color} | {item.product.Categoria}
                        {item.size && ` | ${language === 'es' ? 'Talla' : 'Size'}: ${item.size}`}
                      </div>
                    </div>

                    <div className="cart-item-price-row">
                      <span className="cart-item-price">S/. {itemPrice}</span>

                      {/* Quantity Controls */}
                      <div className="cart-qty-ctrl">
                        <button
                          type="button"
                          className="btn-qty"
                          onClick={() => onQuantityChange && onQuantityChange(item.product.id, item.size, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="btn-qty"
                          onClick={() => onQuantityChange && onQuantityChange(item.product.id, item.size, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => onRemove && onRemove(item.product.id, item.size)}
                      >
                        {language === 'es' ? 'Quitar' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pricing Subtotal Summary and Checkout Trigger */}
        {cartItems.length > 0 && (
          <div className="cart-summary">
            {discountAmount > 0 && (
              <>
                <div className="summary-row">
                  <span>{labels.originalTotal || 'Original Total'}:</span>
                  <span>S/. {originalTotal}</span>
                </div>
                <div className="summary-row discount">
                  <span>{labels.discount || 'Discount'}:</span>
                  <span>- S/. {discountAmount}</span>
                </div>
              </>
            )}

            <div className="summary-row total">
              <span>{labels.total || 'Total'}:</span>
              <span>
                {discountAmount > 0 && (
                  <span className="price-original-crossed">S/. {originalTotal}</span>
                )}
                S/. {discountedTotal}
              </span>
            </div>

            <button
              type="button"
              className="btn-checkout"
              onClick={handleCheckout}
            >
              🟢 {labels.checkoutButton || 'Confirm via WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Cart;
