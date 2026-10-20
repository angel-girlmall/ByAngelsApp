import React, { useState, useEffect, useRef, useMemo } from 'react';
import appConfig from './config/appConfig.json';
import SearchFilter from './components/SearchFilter';
import ProductCard from './components/ProductCard';
import MainModelDisplay from './components/MainModelDisplay';
import ProductModal from './components/ProductModal';
import MusicPlayer from './components/MusicPlayer';
import Cart from './components/Cart';
import WelcomeScreen from './components/WelcomeScreen';
import NoticeModal from './components/NoticeModal';
import CountdownTimer from './components/CountdownTimer';
import PullToRefresh from './components/PullToRefresh';
import PasarelaModal from './components/PasarelaModal';

function App() {
  const [language, setLanguage] = useState('es'); // Default is Spanish
  const [products, setProducts] = useState([]);
  const [musics, setMusics] = useState([]);
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = import.meta.env.VITE_API_URL || appConfig.apiUrl || 'http://localhost:5000';

  // Welcome Screen, Notice Modal, and Pasarela Modal state
  const [showWelcome, setShowWelcome] = useState(true);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showPasarelaModal, setShowPasarelaModal] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('');

  // Refs for scroll reset on filter change
  const rightPanelRef = useRef(null);
  const catalogGridRef = useRef(null);

  // Reset scroll instantly to top on any filter or sorting change
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
      rightPanelRef.current.scrollLeft = 0;
    }
    if (catalogGridRef.current) {
      catalogGridRef.current.scrollTop = 0;
      catalogGridRef.current.scrollLeft = 0;
    }
  }, [styleFilter, searchQuery]);

  // Selected Garment states
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedPoseIndex, setSelectedPoseIndex] = useState(0);
  const [skinToneMode, setSkinToneMode] = useState('clara'); // 'clara' | 'morena'

  // Detail Modal product state
  const [detailProduct, setDetailProduct] = useState(null);

  // Music Player background states
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Shopping Cart state
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);

  const DEFAULT_DESCUENTOS = [
    {
      id: 'rango_1',
      nombre: 'súper descuento 3x S/100',
      rangoInicio: 0,
      rangoFin: 999,
      activo: true,
      escalones: [
        { cantidadMinima: 3, precioOferta: 33.33 }
      ]
    }
  ];

  const [descuentosRules, setDescuentosRules] = useState(() => {
    try {
      const cached = localStorage.getItem('byangels_descuentos_rules');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_DESCUENTOS;
  });

  // Calculate total number of garments in shopping cart
  const totalGarmentsInCart = useMemo(() => {
    return (cart || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
  }, [cart]);

  // Compute if cart is EXACTLY 1 garment away from reaching a volume discount tier
  const upsellInfo = useMemo(() => {
    if (!descuentosRules || descuentosRules.length === 0 || totalGarmentsInCart === 0) return null;

    const activeRules = descuentosRules.filter(r => r.activo !== false);
    if (activeRules.length === 0) return null;

    let candidateTiers = [];
    activeRules.forEach(rule => {
      if (Array.isArray(rule.escalones)) {
        rule.escalones.forEach(tier => {
          const qty = Number(tier.cantidadMinima);
          if (!isNaN(qty) && qty > 0) {
            candidateTiers.push({
              threshold: qty,
              precioOferta: Number(tier.precioOferta) || 0,
              nombre: rule.nombre || '',
              rule
            });
          }
        });
      }
    });

    if (candidateTiers.length === 0) return null;

    candidateTiers.sort((a, b) => a.threshold - b.threshold);

    for (const t of candidateTiers) {
      if (t.threshold - totalGarmentsInCart === 1) {
        let promoText = '';
        if (t.precioOferta > 0) {
          const totalPromo = Math.round(t.threshold * t.precioOferta);
          promoText = `${t.threshold}x S/${totalPromo}`;
        } else if (t.nombre) {
          promoText = t.nombre;
        } else {
          promoText = `${t.threshold} unidades`;
        }

        return {
          current: totalGarmentsInCart,
          target: t.threshold,
          promoText
        };
      }
    }

    return null;
  }, [descuentosRules, totalGarmentsInCart]);

  const activeLabels = appConfig.languages[language];

  useEffect(() => {
    const normalizeProductData = (p) => {
      const soles = Number(p.Precio || p.precio || 0);
      const customUsd = p.precioDolares || p.PrecioDolares;
      const usd = (customUsd && !isNaN(Number(customUsd)) && Number(customUsd) > 0)
        ? String(customUsd)
        : (soles > 0 ? (soles / 3.7).toFixed(2) : '0.00');

      return {
        ...p,
        Precio: String(soles > 0 ? (p.Precio || p.precio) : '0.00'),
        precioDolares: usd
      };
    };

    const sortProducts = (list) => {
      if (!list || !Array.isArray(list)) return [];
      const normalized = list.map(normalizeProductData);
      return normalized.sort((a, b) => {
        const valA = a.numorden !== undefined ? a.numorden : a.numOrden;
        const valB = b.numorden !== undefined ? b.numorden : b.numOrden;
        const numA = Number(valA);
        const numB = Number(valB);
        const orderA = (valA !== undefined && valA !== null && valA !== '' && !isNaN(numA)) ? numA : Infinity;
        const orderB = (valB !== undefined && valB !== null && valB !== '' && !isNaN(numB)) ? numB : Infinity;
        return orderA - orderB;
      });
    };

    const fetchData = async () => {
      // 1. Render cached data immediately for 0-second instant loading
      let hasCachedData = false;
      try {
        const cachedProducts = localStorage.getItem('byangels_products');
        const cachedMusics = localStorage.getItem('byangels_musics');
        const cachedNotices = localStorage.getItem('byangels_notices');

        if (cachedProducts && cachedMusics && cachedNotices) {
          const parsedProducts = sortProducts(JSON.parse(cachedProducts));
          const parsedMusics = JSON.parse(cachedMusics);
          const parsedNotices = JSON.parse(cachedNotices);

          setProducts(parsedProducts);
          setMusics(parsedMusics);
          setNotices(parsedNotices);
          
          if (parsedProducts.length > 0) {
            setSelectedProductId(parsedProducts[0].id);
          }
          if (parsedMusics.length > 0) {
            const randomIdx = Math.floor(Math.random() * parsedMusics.length);
            setCurrentTrackIndex(randomIdx);
          }

          setLoading(false);
          setNoticesLoading(false);
          hasCachedData = true;
        }
      } catch (cacheErr) {
        console.warn('⚠️ Error reading cache storage:', cacheErr);
      }

      if (!hasCachedData) {
        setLoading(true);
        setNoticesLoading(true);
      }

      try {
        const tunnelHeaders = {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        };

        // Fetch clothing articles
        const resShop = await fetch(`${apiBaseUrl}/api/shopreel`, { headers: tunnelHeaders });
        if (!resShop.ok) throw new Error('API server returned error code');
        const shopData = sortProducts(await resShop.json());
        setProducts(shopData);
        
        if (shopData.length > 0) {
          setSelectedProductId(prev => (prev && shopData.some(p => p.id === prev)) ? prev : shopData[0].id);
        } else {
          setSelectedProductId(null);
        }

        // Fetch tracks
        let finalMusicData = [];
        const resMusic = await fetch(`${apiBaseUrl}/api/Musics`, { headers: tunnelHeaders });
        if (resMusic.ok) {
          const musicData = await resMusic.json();
          const mappedMusicData = musicData.map((song) => {
            let correctUrl = song.url || song.urlMusic || '';
            if (correctUrl.includes('github.com') && correctUrl.includes('/blob/')) {
              correctUrl = correctUrl
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/');
            }
            return {
              id: song.id,
              title: song.NombreMusic || song.title || 'Canción sin título',
              artist: song.artist || 'ByAngels Boutique',
              url: correctUrl
            };
          });
          finalMusicData = mappedMusicData;
          setMusics(mappedMusicData);
          if (mappedMusicData.length > 0) {
            const randomIdx = Math.floor(Math.random() * mappedMusicData.length);
            setCurrentTrackIndex(randomIdx);
          }
        } else {
          finalMusicData = [];
          setMusics([]);
        }

        // Fetch weekly news/notices
        let finalNoticeData = [];
        const resNotice = await fetch(`${apiBaseUrl}/api/notice`, { headers: tunnelHeaders });
        if (resNotice.ok) {
          const noticeData = await resNotice.json();
          const extractedUrls = [];
          if (noticeData && noticeData.length > 0) {
            noticeData.forEach(doc => {
              Object.keys(doc).forEach(key => {
                if (key.startsWith('urlN') && doc[key]) {
                  extractedUrls.push({
                    key,
                    url: doc[key]
                  });
                }
              });
            });
            extractedUrls.sort((a, b) => {
              const numA = parseInt(a.key.replace('urlN', ''), 10) || 0;
              const numB = parseInt(b.key.replace('urlN', ''), 10) || 0;
              return numA - numB;
            });
          }
          finalNoticeData = extractedUrls.map(item => item.url);
          setNotices(finalNoticeData);
        } else {
          finalNoticeData = [];
          setNotices([]);
        }

        // Fetch discounts from DB
        try {
          const resDesc = await fetch(`${apiBaseUrl}/api/descuentos`, { headers: tunnelHeaders });
          if (resDesc.ok) {
            const descData = await resDesc.json();
            if (Array.isArray(descData) && descData.length > 0) {
              setDescuentosRules(descData);
              localStorage.setItem('byangels_descuentos_rules', JSON.stringify(descData));
            }
          }
        } catch (descErr) {
          console.warn('⚠️ Could not fetch descuentos config:', descErr.message);
        }

        // Store new data in localStorage cache
        try {
          localStorage.setItem('byangels_products', JSON.stringify(shopData));
          localStorage.setItem('byangels_musics', JSON.stringify(finalMusicData));
          localStorage.setItem('byangels_notices', JSON.stringify(finalNoticeData));
          localStorage.setItem('byangels_cache_timestamp', Date.now().toString());
          console.log('⚡ Saved fetched API data to cache (localStorage)');
        } catch (saveErr) {
          console.warn('⚠️ Failed to save data to localStorage cache:', saveErr);
        }

      } catch (err) {
        console.warn('⚠️ API Connection failed:', err);
        setProducts([]);
        setMusics([]);
        setNotices([]);
        setSelectedProductId(null);
      } finally {
        setLoading(false);
        setNoticesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Global click listener to play water drop sound when pressing any interactive button
  useEffect(() => {
    let globalAudioCtx = null;

    const getAudioContext = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!globalAudioCtx) {
          globalAudioCtx = new AudioContextClass();
        }
        if (globalAudioCtx.state === 'suspended') {
          globalAudioCtx.resume().catch(() => {});
        }
        return globalAudioCtx;
      } catch (e) {
        return null;
      }
    };

    const playWaterDropSound = () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        const now = ctx.currentTime;
        
        // Water drop sound frequency sweep: fast low-to-high pitch
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        
        // Decay envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.11);
      } catch (e) {
        console.warn('Audio synthesis blocked or failed:', e);
      }
    };

    const handleGlobalClick = (event) => {
      const target = event.target;
      if (!target) return;
      
      // Matches any button, role=button, or custom action element
      const interactiveButton = target.closest(
        'button, .btn, .btn-buy-floating, .btn-ctrl, .music-toggle-btn, [role="button"], .common-button'
      );
      if (interactiveButton) {
        playWaterDropSound();
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      if (globalAudioCtx) {
        try {
          globalAudioCtx.close();
        } catch (e) {}
      }
    };
  }, []);

  // Sync Selected Product changes to model poses array
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Model pose images
  let activeProductPoses = activeProduct
    ? [
        activeProduct.imgReel1,
        activeProduct.imgReel2,
        activeProduct.imgReel3,
        activeProduct.imgReel4,
        activeProduct.imgReel5,
        activeProduct.imgReel6
      ].filter(Boolean)
    : [];

  if (activeProduct && activeProductPoses.length === 0 && activeProduct.imgReel0) {
    activeProductPoses = [activeProduct.imgReel0];
  }

  // Filter products locally on client side for immediate smooth updates
  const getFilteredProducts = () => {
    let result = [...products];

    // Filter by styles categories (if it is a category/flag filter)
    if (styleFilter !== '' && styleFilter !== 'precio_asc' && styleFilter !== 'precio_desc') {
      const filter = styleFilter.toLowerCase();
      if (filter === 'nuevo') {
        result = result.filter(p => 
          p.Nuevo === true || 
          p.Nuevo === 'true' || 
          (typeof p.Nuevo === 'string' && (p.Nuevo.toLowerCase() === 'si' || p.Nuevo.toLowerCase() === 'yes' || p.Nuevo.toLowerCase() === 'true'))
        );
      } else if (filter === 'tendencia') {
        result = result.filter(p => 
          p.Tendencia === true || 
          p.Tendencia === 'true' || 
          (typeof p.Tendencia === 'string' && (p.Tendencia.toLowerCase() === 'si' || p.Tendencia.toLowerCase() === 'yes' || p.Tendencia.toLowerCase() === 'true'))
        );
      } else {
        result = result.filter(p => p.Categoria && p.Categoria.toLowerCase() === filter);
      }
    }

    // Filter by search string
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => p.Nombre && p.Nombre.toLowerCase().includes(q));
    }

    // Sort products based on price or priority 'numorden'
    if (styleFilter === 'precio_asc' || styleFilter === 'precio-asc') {
      result.sort((a, b) => (Number(a.Precio) || 0) - (Number(b.Precio) || 0));
    } else if (styleFilter === 'precio_desc' || styleFilter === 'precio-desc') {
      result.sort((a, b) => (Number(b.Precio) || 0) - (Number(a.Precio) || 0));
    } else {
      result.sort((a, b) => {
        const valA = a.numorden !== undefined ? a.numorden : a.numOrden;
        const valB = b.numorden !== undefined ? b.numorden : b.numOrden;
        const numA = Number(valA);
        const numB = Number(valB);
        const orderA = (valA !== undefined && valA !== null && valA !== '' && !isNaN(numA)) ? numA : Infinity;
        const orderB = (valB !== undefined && valB !== null && valB !== '' && !isNaN(numB)) ? numB : Infinity;
        return orderA - orderB;
      });
    }

    return result;
  };

  const filteredProductsList = useMemo(() => {
    return getFilteredProducts();
  }, [products, searchQuery, styleFilter, language]);

  // Ensure an initial product is selected if none is active yet, but preserve user selection when filtering
  useEffect(() => {
    if (products && products.length > 0) {
      const existsInProducts = products.some(p => p.id === selectedProductId);
      if (!selectedProductId || !existsInProducts) {
        setSelectedProductId(products[0].id);
        setSelectedPoseIndex(0);
      }
    }
  }, [products, selectedProductId]);

  const [numberBump, setNumberBump] = useState(false);

  // Add Item to Cart from Card or Modal button with curved flying shine animation
  const handleAddToCartFromCard = (productToAdd, e, size = 'M') => {
    const btnRect = e.currentTarget.getBoundingClientRect();
    const cartBtn = document.querySelector('.btn-buy-floating');

    if (!cartBtn) {
      handleAddToCart(productToAdd, size);
      return;
    }

    const endRect = cartBtn.getBoundingClientRect();
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    // Destello brilloso curveado dirigido exactamente a la esquina superior donde aparece el número
    const badgeEl = cartBtn.querySelector('.cart-floating-badge');
    let targetX = endRect.right - 8;
    let targetY = endRect.top + 2;

    if (badgeEl) {
      const badgeRect = badgeEl.getBoundingClientRect();
      targetX = badgeRect.left + badgeRect.width / 2;
      targetY = badgeRect.top + badgeRect.height / 2;
    }

    // Calcular arco de curvatura amplio hacia afuera y arriba (como en la imagen de referencia)
    const dx = targetX - startX;
    const dy = targetY - startY;
    let ctrlX, ctrlY;

    if (startX >= targetX) {
      // Viene de la derecha hacia la izquierda (comportamiento de la imagen con card a la derecha)
      ctrlX = startX + Math.max(50, Math.abs(dx) * 0.28);
      ctrlY = Math.min(startY, targetY) - Math.max(65, Math.abs(dy) * 0.35);
    } else {
      ctrlX = startX - Math.max(50, Math.abs(dx) * 0.28);
      ctrlY = Math.min(startY, targetY) - Math.max(65, Math.abs(dy) * 0.35);
    }

    // Contenedor principal de la escena de animación
    const scene = document.createElement('div');
    scene.className = 'curved-cart-glow-scene';

    // SVG para el trazo brilloso curveado
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'curved-glow-svg');
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

    const pathD = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="goldBeamGrad" gradientUnits="userSpaceOnUse" x1="${startX}" y1="${startY}" x2="${targetX}" y2="${targetY}">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="30%" stop-color="#ffd700" stop-opacity="1" />
          <stop offset="70%" stop-color="#ffb300" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
        </linearGradient>
        <filter id="goldGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path class="arc-glow-beam" d="${pathD}" />
      <path class="arc-core-beam" d="${pathD}" />
    `;

    scene.appendChild(svg);

    // Función para calcular puntos a lo largo de la curva cuadrática
    const getBezierPoint = (t) => {
      const invT = 1 - t;
      const x = invT * invT * startX + 2 * invT * t * ctrlX + t * t * targetX;
      const y = invT * invT * startY + 2 * invT * t * ctrlY + t * t * targetY;
      return { x, y };
    };

    // Generar partículas brillantes de destello (estrellas y polvillo dorado) a lo largo de la curva
    const sparklesCount = 12;
    const starIcons = ['✨', '✦', '★', '⋆'];
    for (let i = 1; i <= sparklesCount; i++) {
      const t = i / (sparklesCount + 1);
      const pt = getBezierPoint(t);
      const jitterX = (Math.random() - 0.5) * 28;
      const jitterY = (Math.random() - 0.5) * 28;
      const sparkle = document.createElement('div');
      sparkle.className = 'arc-stardust';
      sparkle.style.left = `${pt.x + jitterX}px`;
      sparkle.style.top = `${pt.y + jitterY}px`;
      sparkle.style.animationDelay = `${t * 380}ms`;
      sparkle.innerHTML = starIcons[i % starIcons.length];
      scene.appendChild(sparkle);
    }

    // Elemento volador (miniatura del producto + halo brillante)
    const flyer = document.createElement('div');
    flyer.className = 'curved-flyer-item';
    const productImg = productToAdd.imgReel0 || productToAdd.imgreel0 || productToAdd.img || '';
    flyer.innerHTML = `
      <div class="flyer-halo-ring"></div>
      ${productImg ? `<img src="${productImg.replace('/736x/', '/236x/')}" class="flyer-garment-thumb" alt="" />` : ''}
      <span class="flyer-star s-lead">✨</span>
      <span class="flyer-star s-trail">✦</span>
    `;
    scene.appendChild(flyer);
    document.body.appendChild(scene);

    // Animar el trazo SVG con su longitud exacta
    const glowBeam = svg.querySelector('.arc-glow-beam');
    const coreBeam = svg.querySelector('.arc-core-beam');
    if (glowBeam && coreBeam) {
      try {
        const pathLength = glowBeam.getTotalLength();
        [glowBeam, coreBeam].forEach(beam => {
          beam.style.strokeDasharray = `${pathLength}`;
          beam.style.strokeDashoffset = `${pathLength}`;
          beam.animate([
            { strokeDashoffset: pathLength, opacity: 0 },
            { strokeDashoffset: 0, opacity: 1, offset: 0.6 },
            { strokeDashoffset: 0, opacity: 0.85, offset: 0.85 },
            { strokeDashoffset: 0, opacity: 0, offset: 1 }
          ], {
            duration: 720,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
          });
        });
      } catch (err) {}
    }

    // Animar elemento volador a lo largo de la curva
    const numFrames = 30;
    const keyframes = [];
    for (let i = 0; i <= numFrames; i++) {
      const t = i / numFrames;
      const pt = getBezierPoint(t);
      const scale = t < 0.45 ? 0.75 + t * 0.9 : 1.15 - (t - 0.45) * 1.5;
      const rotate = (t * 50 - 25);
      const opacity = t > 0.93 ? (1 - t) / 0.07 : 1;
      keyframes.push({
        transform: `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) scale(${Math.max(0.15, scale)}) rotate(${rotate}deg)`,
        opacity
      });
    }

    const flyerAnim = flyer.animate(keyframes, {
      duration: 680,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    });

    flyerAnim.onfinish = () => {
      // Destello de impacto redondo y explosión estelar en el número en la esquina superior
      const burst = document.createElement('div');
      burst.className = 'badge-impact-burst';
      burst.style.left = `${targetX}px`;
      burst.style.top = `${targetY}px`;
      burst.innerHTML = `
        <span class="burst-ring"></span>
        <span class="burst-ring r2"></span>
        <span class="burst-star b1">✦</span>
        <span class="burst-star b2">✨</span>
        <span class="burst-star b3">✦</span>
        <span class="burst-star b4">★</span>
      `;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 700);

      // Limpiar escena completa de animación
      setTimeout(() => scene.remove(), 250);

      // Actualizar estado del carrito
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === productToAdd.id && item.size === size);
        if (existingItem) {
          return prevCart.map(item => 
            (item.product.id === productToAdd.id && item.size === size)
              ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
              : item
          );
        } else {
          return [...prevCart, { product: productToAdd, size, quantity: 1 }];
        }
      });

      // Reacción de rebote en el botón Mi Carrito y número dorado
      cartBtn.classList.remove('cart-bump-impact');
      void cartBtn.offsetWidth; // force reflow
      cartBtn.classList.add('cart-bump-impact');
      setTimeout(() => cartBtn.classList.remove('cart-bump-impact'), 600);

      setNumberBump(true);
      setTimeout(() => setNumberBump(false), 550);
    };
  };

  // Add Item to Cart
  const handleAddToCart = (productToAdd, size = 'M') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === productToAdd.id && item.size === size);
      if (existingItem) {
        return prevCart.map(item => 
          (item.product.id === productToAdd.id && item.size === size)
            ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
            : item
        );
      } else {
        return [...prevCart, { product: productToAdd, size, quantity: 1 }];
      }
    });
    // Open cart drawer immediately for visual feedback
    setCartVisible(true);
  };

  const handleAddToCartFromModal = (productToAdd, size = 'M', e = null) => {
    if (e && e.currentTarget) {
      handleAddToCartFromCard(productToAdd, e, size);
    } else {
      handleAddToCart(productToAdd, size);
    }
  };

  // Modify Cart Item quantity
  const handleCartQuantityChange = (productId, size, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId, size);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        (item.product.id === productId && item.size === size)
          ? { ...item, quantity: Math.min(newQuantity, 99) }
          : item
      )
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (productId, size) => {
    setCart(prevCart => prevCart.filter(item => !(item.product.id === productId && item.size === size)));
  };

  // Calculate overall quantity count for badge indicator
  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSkinToneToggle = () => {
    setSkinToneMode((prev) => {
      const nextMode = prev === 'clara' ? 'morena' : 'clara';
      setSelectedPoseIndex(nextMode === 'clara' ? 0 : 3);
      return nextMode;
    });
  };

  return (
    <main className="app-container">

      {/* Left Panel: Active Garment Model Pose Display & Rotator */}
      <MainModelDisplay
        images={activeProductPoses}
        currentPoseIndex={selectedPoseIndex}
        brandName="Angel Girl"
        language={language}
        loading={loading}
        onPoseChange={(newPose) => setSelectedPoseIndex(newPose)}
        onCartClick={() => setCartVisible(true)}
        cartBadgeCount={cartTotalQuantity}
        onLanguageToggle={() => setLanguage(language === 'es' ? 'en' : 'es')}
        onNoticeClick={() => setShowNoticeModal(true)}
        onVideoClick={() => setShowPasarelaModal(true)}
        skinToneMode={skinToneMode}
        onSkinToneToggle={handleSkinToneToggle}
      />

      {/* Right Panel: Catalog, Search, and Audio Controls */}
      <section className="right-panel" ref={rightPanelRef}>
        
        
        {/* Search Bar & Styles Dropdown */}
        <SearchFilter
          searchValue={searchQuery}
          selectedStyle={styleFilter}
          placeholder={activeLabels.searchPlaceholder}
          stylesLabel={activeLabels.stylesLabel}
          allLabel={activeLabels.allStyles}
          options={activeLabels.stylesList}
          onSearchChange={(val) => setSearchQuery(val)}
          onStyleChange={(val) => setStyleFilter(val)}
        />

        {loading ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-light)' }}>
            <h3>Loading Catalog...</h3>
          </div>
        ) : (
          /* Clothing Reel Cards Grid */
          <div className="catalog-grid" ref={catalogGridRef}>
            {filteredProductsList.map((productItem) => (
              <ProductCard
                key={productItem.id}
                text={productItem.Nombre}
                price={productItem.Precio}
                precioDolares={productItem.precioDolares || productItem.PrecioDolares}
                language={language}
                imageSource={productItem.imgReel0} // Uses 1st image for catalog card representation
                isActive={productItem.id === selectedProductId}
                isNew={
                  productItem.Nuevo === true || 
                  productItem.Nuevo === 'true' || 
                  (typeof productItem.Nuevo === 'string' && ['si', 'sí', 'yes', 'true'].includes(productItem.Nuevo.trim().toLowerCase())) ||
                  productItem.nuevo === true ||
                  (typeof productItem.nuevo === 'string' && ['si', 'sí', 'yes', 'true'].includes(productItem.nuevo.trim().toLowerCase()))
                }
                newBadgeLabel={activeLabels.newBadge}
                viewButtonLabel={activeLabels.viewButton || (language === 'es' ? 'Añadir' : 'Add')}
                onClick={() => {
                  setSelectedProductId(productItem.id);
                  setSelectedPoseIndex(0); // Reset pose index when switching garments
                }}
                onAddToCart={() => setDetailProduct(productItem)}
                onViewDetail={() => setDetailProduct(productItem)}
              />
            ))}

            {filteredProductsList.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--color-accent-light)', opacity: 0.8 }}>
                <h3>{language === 'es' ? 'No se encontraron prendas' : 'No clothing items found'}</h3>
              </div>
            )}
          </div>
        )}

      </section>

      {/* Floating Cart & Upsell Group (Anuncio flotante ARRIBA, Botón Mi Carrito ABAJO) */}
      {!showWelcome && (
        <div className="cart-floating-container">
          {/* 1. Anuncio Flotante ARRIBA (cuando falta 1 prenda para acceder al descuento) */}
          {upsellInfo && (
            <div
              className="floating-upsell-banner"
              onClick={() => setCartVisible(true)}
              role="button"
              tabIndex={0}
              title={language === 'es' ? 'Ver oferta en el carrito' : 'View offer in cart'}
            >
              <div className="upsell-badge-icon">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="upsell-text-content">
                <div className="upsell-headline">
                  {language === 'es'
                    ? `¡Estás a solo 1 conjunto del súper descuento ${upsellInfo.promoText}!`
                    : `You're only 1 item away from the super discount ${upsellInfo.promoText}!`}
                </div>
                <div className="upsell-progress-row">
                  <div className="upsell-progress-track">
                    <div
                      className="upsell-progress-fill"
                      style={{ width: `${Math.min(100, Math.round((upsellInfo.current / upsellInfo.target) * 100))}%` }}
                    >
                      {Array.from({ length: upsellInfo.current }).map((_, i) => (
                        <span key={i} className="upsell-check-badge">✓</span>
                      ))}
                    </div>
                    <div className="upsell-progress-dots">
                      {Array.from({ length: upsellInfo.target }).map((_, i) => (
                        <span
                          key={i}
                          className={`upsell-dot ${i < upsellInfo.current ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="upsell-progress-counter">
                    {upsellInfo.current}/{upsellInfo.target}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Botón Mi Carrito ABAJO (siempre rosa con borde blanco) */}
          <button
            type="button"
            className="btn-buy-floating btn-pink-cart"
            onClick={() => setCartVisible(true)}
            aria-label={language === 'es' ? 'Ver Mi Carrito' : 'View My Cart'}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            <span>{language === 'es' ? 'Mi Carrito' : 'My Cart'}</span>
            {totalGarmentsInCart > 0 && (
              <span className={`cart-floating-badge ${numberBump ? 'badge-bump' : ''}`}>
                <span className="badge-sparkle top-left">✦</span>
                <span className="badge-number">{totalGarmentsInCart}</span>
                <span className="badge-sparkle bottom-right">✦</span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Music Player Widget */}
      <MusicPlayer
        playlist={musics}
        isPlaying={isPlayingMusic}
        currentTrackIndex={currentTrackIndex}
        language={language}
        onPlayPauseChange={(playing) => setIsPlayingMusic(playing)}
        onTrackIndexChange={(idx) => setCurrentTrackIndex(idx)}
      />



      {/* Mobile Smooth Pull-to-Refresh Gesture Indicator */}
      <PullToRefresh language={language} />

      {/* Floating Order Closing Countdown Timer Widget */}
      {!showWelcome && (
        <CountdownTimer apiUrl={apiBaseUrl} />
      )}

      {/* Slide-In Shopping Cart Drawer */}
      <Cart
        visible={cartVisible}
        cartItems={cart}
        language={language}
        labels={activeLabels}
        whatsappNumber={appConfig.whatsappNumber}
        apiBaseUrl={apiBaseUrl}
        externalDescuentosRules={descuentosRules}
        onQuantityChange={handleCartQuantityChange}
        onRemove={handleRemoveFromCart}
        onClose={() => setCartVisible(false)}
        onOpen={() => setCartVisible(true)}
      />

      {/* Detailed Modal Carousel Slider */}
      <ProductModal
        visible={detailProduct !== null}
        product={detailProduct}
        language={language}
        labels={activeLabels}
        onClose={() => setDetailProduct(null)}
        onCartAdded={handleAddToCartFromModal}
        onVideoClick={(prod) => {
          if (prod) setDetailProduct(prod);
          setShowPasarelaModal(true);
        }}
      />

      {/* News/Notice Reels Modal */}
      <NoticeModal
        visible={showNoticeModal}
        reels={notices}
        loading={noticesLoading}
        onClose={() => setShowNoticeModal(false)}
      />

      {/* Pasarela Virtual Video Modal */}
      <PasarelaModal
        visible={showPasarelaModal}
        product={detailProduct || (products.find(p => p.id === selectedProductId) || products[0] || null)}
        language={language}
        onClose={() => setShowPasarelaModal(false)}
      />

      {/* Fullscreen Entry Screen */}
      {showWelcome && (
        <WelcomeScreen
          apiUrl={apiBaseUrl}
          onEnter={() => {
            setShowWelcome(false);
            setShowNoticeModal(true);
            // Autoplay music upon click on 'Entrar' (valid user gesture)
            if (musics.length > 0) {
              setIsPlayingMusic(true);
            }
          }}
        />
      )}

    </main>
  );
}

export default App;
