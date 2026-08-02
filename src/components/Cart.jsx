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
  apiBaseUrl = '',
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

  const [descuentosRules, setDescuentosRules] = React.useState([]);

  React.useEffect(() => {
    const fetchRules = async () => {
      try {
        const cached = localStorage.getItem('byangels_descuentos_rules');
        if (cached) {
          setDescuentosRules(JSON.parse(cached));
        }
      } catch (e) {}

      if (!apiBaseUrl) return;

      try {
        const res = await fetch(`${apiBaseUrl}/api/descuentos`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDescuentosRules(data);
            try {
              localStorage.setItem('byangels_descuentos_rules', JSON.stringify(data));
            } catch (saveErr) {}
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch descuentos config for Cart:', err.message);
      }
    };

    fetchRules();
  }, [apiBaseUrl]);

  // Helper to calculate total count of all garments in cart
  const totalGarmentsInCart = (cartItems || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Number formatting helper: removes unnecessary decimals (.00 -> empty, .30 -> .3)
  const formatCleanNumber = (num) => {
    const val = Number(num);
    if (isNaN(val)) return '0';
    if (val % 1 === 0) {
      return val.toString(); // Integer -> 33, 38, 70, 100
    }
    const str = val.toFixed(2);
    return str.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'); // 33.30 -> 33.3
  };

  // Currency Formatter Helper
  const formatMoney = (amount, prod = null) => {
    let finalVal = Number(amount);
    if (language === 'en') {
      if (prod && (prod.precioDolares || prod.PrecioDolares)) {
        const customUsd = Number(prod.precioDolares || prod.PrecioDolares);
        if (!isNaN(customUsd) && customUsd > 0) {
          finalVal = customUsd * (amount / (Number(prod.Precio) || 1));
        } else {
          finalVal = amount / 3.7;
        }
      } else {
        finalVal = amount / 3.7;
      }
      return `$ ${formatCleanNumber(finalVal)}`;
    }
    return `S/. ${formatCleanNumber(finalVal)}`;
  };

  const getItemEffectivePrice = (item) => {
    const basePrice = Number(item.product.Precio || item.product.precio || 0);

    const activeRules = (descuentosRules && descuentosRules.length > 0)
      ? descuentosRules.filter(r => r.activo !== false)
      : [];

    if (activeRules.length > 0) {
      const matchedRule = activeRules.find(r => {
        const min = Number(r.rangoInicio || 0);
        const max = Number(r.rangoFin || Infinity);
        return basePrice >= min && basePrice <= max;
      });

      if (matchedRule && Array.isArray(matchedRule.escalones) && matchedRule.escalones.length > 0) {
        const escalones = [...matchedRule.escalones].sort(
          (a, b) => Number(b.cantidadMinima) - Number(a.cantidadMinima)
        );

        const matchedTier = escalones.find(t => totalGarmentsInCart >= Number(t.cantidadMinima));

        if (matchedTier && Number(matchedTier.precioOferta) > 0) {
          const offerPrice = Number(matchedTier.precioOferta);
          return {
            basePrice,
            effectiveUnitPrice: offerPrice,
            hasDiscount: offerPrice < basePrice
          };
        }
      }
    }

    return { basePrice, effectiveUnitPrice: basePrice, hasDiscount: false };
  };

  // Dynamic Price-Range Volume Discount Pricing Engine
  const calculateTotals = () => {
    let originalTotal = 0;
    let discountedTotal = 0;

    if (!cartItems || cartItems.length === 0) {
      return { originalTotal: 0, discountedTotal: 0, discountAmount: 0 };
    }

    const activeRules = (descuentosRules && descuentosRules.length > 0)
      ? descuentosRules.filter(r => r.activo !== false)
      : [];

    if (activeRules.length > 0) {
      cartItems.forEach(item => {
        const { basePrice, effectiveUnitPrice } = getItemEffectivePrice(item);
        const qty = item.quantity || 1;
        originalTotal += basePrice * qty;
        discountedTotal += effectiveUnitPrice * qty;
      });
    } else {
      const garmentPrices = [];
      cartItems.forEach(item => {
        const priceVal = Number(item.product.Precio) || 40;
        for (let i = 0; i < item.quantity; i++) {
          garmentPrices.push(priceVal);
        }
      });
      const totalCount = garmentPrices.length;
      originalTotal = garmentPrices.reduce((sum, p) => sum + p, 0);

      const dp = new Array(totalCount + 1).fill(0);
      dp[0] = 0;
      for (let i = 1; i <= totalCount; i++) {
        let minVal = dp[i - 1] + garmentPrices[i - 1];
        if (i >= 3) minVal = Math.min(minVal, dp[i - 3] + 100);
        if (i >= 5) minVal = Math.min(minVal, dp[i - 5] + 155);
        if (i >= 6) minVal = Math.min(minVal, dp[i - 6] + 185);
        if (i >= 12) minVal = Math.min(minVal, dp[i - 12] + 330);
        dp[i] = minVal;
      }
      discountedTotal = dp[totalCount];
    }

    const discountAmount = Math.max(0, originalTotal - discountedTotal);
    return {
      originalTotal,
      discountedTotal,
      discountAmount
    };
  };

  const { originalTotal, discountedTotal, discountAmount } = calculateTotals();

  // Helper to generate a unique, cryptographically unguessable Order Code based on Date/Time + Random Entropy
  const generateOrderCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // High entropy random string (excluding ambiguous characters like 0, O, I, 1)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomChars = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const randomValues = new Uint8Array(4);
      window.crypto.getRandomValues(randomValues);
      for (let i = 0; i < 4; i++) {
        randomChars += alphabet[randomValues[i] % alphabet.length];
      }
    } else {
      for (let i = 0; i < 4; i++) {
        randomChars += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }

    return `BYA-${year}${month}${day}-${hours}${minutes}${seconds}-${randomChars}`;
  };

  // Triggers WhatsApp API with formatted order template text after consulting rotated number from database
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    const orderCode = generateOrderCode();
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US')} ${now.toLocaleTimeString(language === 'es' ? 'es-PE' : 'en-US')}`;

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

    const orderHeader = `🛍️ *BYANGELS E-COMMERCE* 🛍️\n📌 *${language === 'es' ? 'Código de Pedido' : 'Order Code'}:* \`${orderCode}\`\n🕒 *${language === 'es' ? 'Fecha y Hora' : 'Date & Time'}:* ${formattedDate}\n`;

    let summaryText = `\n----------------------------\n`;
    if (discountAmount > 0) {
      summaryText += `❌ *${labels.originalTotal || 'Original Total'}:* S/. ${originalTotal}\n`;
      summaryText += `✅ *${labels.total || 'Total'}:* S/. ${discountedTotal}\n`;
      summaryText += `🎉 *${labels.discount || 'Discount'}:* S/. ${discountAmount}\n`;
    } else {
      summaryText += `✅ *${labels.total || 'Total'}:* S/. ${originalTotal}\n`;
    }
    summaryText += `📌 *${language === 'es' ? 'Código Único' : 'Unique Code'}:* \`${orderCode}\`\n`;

    const fullMessage = `${orderHeader}\n${header}\n${itemsText}${summaryText}`;
    const encodedText = encodeURIComponent(fullMessage);

    // Consult Database (Firestore / API) for rotated contact document
    let targetWhatsappNumber = null;
    try {
      const targetApiUrl = apiBaseUrl || 'http://localhost:5000';
      const res = await fetch(`${targetApiUrl}/api/contacto/next`, {
        method: 'GET',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.whatsappNumber) {
          targetWhatsappNumber = data.whatsappNumber;
          console.log(`📱 [Checkout API] WhatsApp rotated to number: ${targetWhatsappNumber}`);
        }
      } else {
        console.warn(`⚠️ Contact API returned status ${res.status}, activating client rotation fallback.`);
      }
    } catch (err) {
      console.warn('⚠️ Could not connect to contact rotation API, activating client rotation fallback:', err);
    }

    // Fallback rotation if API is not available, offline, or not yet deployed to remote server
    if (!targetWhatsappNumber) {
      const fallbackNumbers = ['51900962934', '51931248203', '51928391496'];
      let currentIdx = 0;
      try {
        const savedIdx = localStorage.getItem('byangels_wa_rot_idx');
        if (savedIdx !== null && savedIdx !== undefined) {
          const parsed = parseInt(savedIdx, 10);
          if (!isNaN(parsed)) {
            currentIdx = parsed;
          }
        }
      } catch (lsErr) {
        currentIdx = 0;
      }

      const safeIndex = (currentIdx % fallbackNumbers.length + fallbackNumbers.length) % fallbackNumbers.length;
      targetWhatsappNumber = fallbackNumbers[safeIndex];
      const nextIndex = (safeIndex + 1) % fallbackNumbers.length;

      try {
        localStorage.setItem('byangels_wa_rot_idx', nextIndex.toString());
      } catch (lsErr) {}

      console.log(`📱 [Checkout Local Rotation] Assigned WhatsApp number: ${targetWhatsappNumber} (Index: ${safeIndex} -> Next: ${nextIndex})`);
    }

    // Redirects to WhatsApp API
    const whatsappUrl = `https://wa.me/${targetWhatsappNumber}?text=${encodedText}`;
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
                      <span className="cart-item-price">{formatMoney(itemPrice, item.product)}</span>

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
                  <span>{formatMoney(originalTotal)}</span>
                </div>
                <div className="summary-row discount">
                  <span>{labels.discount || 'Discount'}:</span>
                  <span>- {formatMoney(discountAmount)}</span>
                </div>
              </>
            )}

            <div className="summary-row total">
              <span>{labels.total || 'Total'}:</span>
              <span>
                {discountAmount > 0 && (
                  <span className="price-original-crossed">{formatMoney(originalTotal)}</span>
                )}
                {formatMoney(discountedTotal)}
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
