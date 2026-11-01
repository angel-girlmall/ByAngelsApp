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
  externalDescuentosRules = null,
  onQuantityChange,
  onRemove,
  onClose,
  onOpen
}) {
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef(null);
  const drawerWidth = useRef(420);
  const isEdgeDrag = useRef(false);

  // Limpiar estilos inline cuando el estado visible cambia a false
  React.useEffect(() => {
    if (!visible) {
      if (drawerRef.current) {
        drawerRef.current.style.transform = '';
        drawerRef.current.style.transition = '';
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '';
        overlayRef.current.style.transition = '';
      }
    }
  }, [visible]);

  // Mensaje flotante de envíos al costado del botón verde (desaparece a los 5 segundos de abrir el carrito)
  const [showShippingAlert, setShowShippingAlert] = React.useState(false);
  const [isAlertFading, setIsAlertFading] = React.useState(false);

  React.useEffect(() => {
    let hideTimer;
    let removeTimer;

    if (visible) {
      setShowShippingAlert(true);
      setIsAlertFading(false);

      hideTimer = setTimeout(() => {
        setIsAlertFading(true);
        removeTimer = setTimeout(() => {
          setShowShippingAlert(false);
          setIsAlertFading(false);
        }, 400);
      }, 5000);
    } else {
      setShowShippingAlert(false);
      setIsAlertFading(false);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [visible]);



  // Gestos en vivo cuando el carrito está ABIERTO: SOLO desliza a la DERECHA para ocultar
  const handleTouchStart = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    const touch = e.targetTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
    isDragging.current = true;
    isHorizontalSwipe.current = null;

    if (drawerRef.current) {
      drawerWidth.current = drawerRef.current.offsetWidth || 420;
      drawerRef.current.style.transition = 'none';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || !e.targetTouches || e.targetTouches.length === 0) return;
    const touch = e.targetTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = Math.abs(touch.clientY - touchStartY.current);

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 || diffY > 8) {
        // Solo permitir deslizamiento si es horizontal y HACIA LA DERECHA (diffX > 0)
        isHorizontalSwipe.current = Math.abs(diffX) > diffY && diffX > 0;
      }
    }

    if (!isHorizontalSwipe.current) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    touchCurrentX.current = touch.clientX;
    const width = drawerWidth.current;

    // Solo se mueve hacia la derecha (a la izquierda no: Math.max(0, diffX))
    const moveX = Math.max(0, diffX);

    // Deslizar a la derecha en vivo: aclara el fondo progresivamente según desaparece
    const progress = Math.max(0, Math.min(1, 1 - moveX / width));

    if (drawerRef.current) {
      drawerRef.current.style.transform = `translateX(${moveX}px)`;
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = progress.toString();
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const endX = e.changedTouches && e.changedTouches.length > 0
      ? e.changedTouches[0].clientX
      : touchCurrentX.current;
    const diffX = endX - touchStartX.current;

    if (drawerRef.current) {
      drawerRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.28s ease';
    }

    // Solo deslizarse a la derecha para ocultar (diffX > 55)
    if (isHorizontalSwipe.current && diffX > 55) {
      if (drawerRef.current) {
        drawerRef.current.style.transform = 'translateX(100%)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '0';
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 280);
    } else {
      // Revertir a abierto si fue a la izquierda o no superó el umbral
      if (drawerRef.current) {
        drawerRef.current.style.transform = 'translateX(0px)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '1';
      }

      setTimeout(() => {
        if (drawerRef.current) {
          drawerRef.current.style.transform = '';
          drawerRef.current.style.transition = '';
        }
        if (overlayRef.current) {
          overlayRef.current.style.opacity = '';
          overlayRef.current.style.transition = '';
        }
      }, 280);
    }

    isHorizontalSwipe.current = null;
  };

  const [descuentosRules, setDescuentosRules] = React.useState([]);

  const effectiveDescuentosRules = (externalDescuentosRules && Array.isArray(externalDescuentosRules) && externalDescuentosRules.length > 0)
    ? externalDescuentosRules
    : descuentosRules;

  React.useEffect(() => {
    const fetchRules = async () => {
      try {
        const cached = localStorage.getItem('byangels_descuentos_rules');
        if (cached) {
          setDescuentosRules(JSON.parse(cached));
        }
      } catch (e) { }

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
            } catch (saveErr) { }
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

    const activeRules = (effectiveDescuentosRules && effectiveDescuentosRules.length > 0)
      ? effectiveDescuentosRules.filter(r => r.activo !== false)
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

  // Compute if totalGarmentsInCart is EXACTLY 1 garment away from the next discount tier (e.g. 3, 6, 12)
  const getNextUpsellThreshold = () => {
    if (!effectiveDescuentosRules || effectiveDescuentosRules.length === 0 || totalGarmentsInCart === 0) return null;

    const activeRules = effectiveDescuentosRules.filter(r => r.activo !== false);
    if (activeRules.length === 0) return null;

    const allThresholds = new Set();
    activeRules.forEach(rule => {
      if (Array.isArray(rule.escalones)) {
        rule.escalones.forEach(tier => {
          const qty = Number(tier.cantidadMinima);
          if (!isNaN(qty) && qty > 0) {
            allThresholds.add(qty);
          }
        });
      }
    });

    const sortedThresholds = Array.from(allThresholds).sort((a, b) => a - b);

    for (const threshold of sortedThresholds) {
      if (threshold - totalGarmentsInCart === 1) {
        return threshold;
      }
    }

    return null;
  };

  const nextUpsellThreshold = getNextUpsellThreshold();

  // Dynamic Price-Range Volume Discount Pricing Engine
  const calculateTotals = () => {
    let originalTotal = 0;
    let discountedTotal = 0;

    if (!cartItems || cartItems.length === 0) {
      return { originalTotal: 0, discountedTotal: 0, discountAmount: 0 };
    }

    const activeRules = (effectiveDescuentosRules && effectiveDescuentosRules.length > 0)
      ? effectiveDescuentosRules.filter(r => r.activo !== false)
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

    const roundedOriginalTotal = Math.round(originalTotal);
    const roundedDiscountedTotal = Math.round(discountedTotal);
    const discountAmount = Math.max(0, roundedOriginalTotal - roundedDiscountedTotal);
    return {
      originalTotal: roundedOriginalTotal,
      discountedTotal: roundedDiscountedTotal,
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

    const orderHeader = `🛍️ *LUAMILA E-COMMERCE* 🛍️\n📌 *${language === 'es' ? 'Código de Pedido' : 'Order Code'}:* \`${orderCode}\`\n🕒 *${language === 'es' ? 'Fecha y Hora' : 'Date & Time'}:* ${formattedDate}\n`;

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
      } catch (lsErr) { }

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
        ref={overlayRef}
        className={`cart-drawer-overlay ${visible ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Cart Drawer Box with Swipe-to-Close Gesture */}
      <div
        ref={drawerRef}
        className={`cart-drawer ${visible ? 'visible' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cart-header">
          <h2 className="cart-title">🛍️ {labels.cartTitle || (language === 'es' ? 'Carrito de Compras' : 'Shopping Cart')}</h2>
          <div className="cart-header-actions">
            <div
              className="cart-swipe-hint"
              onClick={onClose}
              title={language === 'es' ? 'Desliza a la derecha para cerrar' : 'Swipe right to close'}
            >
              <span>Desliza &rarr;</span>
            </div>
            <button
              type="button"
              className="btn-close-drawer"
              onClick={onClose}
              aria-label={language === 'es' ? 'Cerrar carrito' : 'Close cart'}
            >
              ✕
            </button>
          </div>
        </div>



        {/* Cart Item Feed */}
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-icon">🛒</span>
              <p>{labels.cartEmpty || (language === 'es' ? 'Tu carrito está vacío' : 'Your cart is empty')}</p>
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
                      </div>
                      {item.size && (
                        <div className="cart-item-size">
                          {language === 'es' ? 'Talla' : 'Size'}: <strong>{item.size}</strong>
                        </div>
                      )}
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
            {/* Upsell Discount Alert Banner when 1 garment away from next threshold */}
            {nextUpsellThreshold && (
              <div className="cart-upsell-alert-banner">
                <div className="cart-upsell-icon">⚡</div>
                <div className="cart-upsell-content">
                  <span className="cart-upsell-title">
                    {language === 'es' ? '¡Estás a solo 1 Conjunto de un súper descuento!' : 'You are 1 item away from a bigger discount!'}
                  </span>
                  <p className="cart-upsell-message">
                    {language === 'es'
                      ? `Agrega 1 Conjunto más al carrito para desbloquear la oferta de descuento a partir de ${nextUpsellThreshold} Unidades.`
                      : `Add 1 more item to unlock special pricing starting from ${nextUpsellThreshold} items.`}
                  </p>
                </div>
              </div>
            )}

            {discountAmount > 0 && (
              <>
                <div className="summary-row original">
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

            <div className="cart-checkout-actions">
              <button
                type="button"
                className="btn-continue-shopping"
                onClick={onClose}
                title={language === 'es' ? 'Deslizar para cerrar' : 'Swipe to close'}
              >
                {language === 'es' ? '← Deslizar' : '← Swipe'}
              </button>

              <button
                type="button"
                className="btn-checkout"
                onClick={handleCheckout}
              >
                <i className="fa-brands fa-whatsapp"></i> {language === 'es' ? 'Confirmar Pedido' : 'Confirm Order'}
              </button>

              {/* Mensaje flotante de envíos superpuesto exactamente en la barra de botones */}
              {showShippingAlert && (
                <div
                  className={`cart-shipping-bottom-pill ${isAlertFading ? 'fading-out' : ''}`}
                  onClick={() => setIsAlertFading(true)}
                  role="status"
                  title="Click para ocultar"
                >
                  <span className="shipping-tag-text">ENVÍOS : LIMA 🛵 PROVINCIA 🚚</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Cart;
