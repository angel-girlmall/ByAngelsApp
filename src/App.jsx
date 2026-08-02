import React, { useState, useEffect } from 'react';
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
          setSelectedProductId(shopData[0].id);
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

  const filteredProductsList = getFilteredProducts();

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
      <section className="right-panel">
        
        
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
          <div className="catalog-grid">
            {filteredProductsList.map((productItem) => (
              <ProductCard
                key={productItem.id}
                text={productItem.Nombre}
                price={productItem.Precio}
                precioDolares={productItem.precioDolares || productItem.PrecioDolares}
                language={language}
                imageSource={productItem.imgReel0} // Uses 1st image for catalog card representation
                isActive={productItem.id === selectedProductId}
                isNew={productItem.Nuevo === true || productItem.Nuevo === 'true'}
                newBadgeLabel={activeLabels.newBadge}
                viewButtonLabel={activeLabels.viewButton}
                onClick={() => {
                  setSelectedProductId(productItem.id);
                  setSelectedPoseIndex(0); // Reset pose index when switching garments
                }}
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

      {/* Floating Buy Button */}
      {!showWelcome && (
        <button
          type="button"
          className={`btn-buy-floating ${cart.length === 0 ? 'empty' : 'has-items'}`}
          onClick={() => {
            if (cart.length > 0) {
              setCartVisible(true);
            }
          }}
        >
          <i className="fa-solid fa-cart-shopping"></i>
          <span>{language === 'es' ? 'Comprar' : 'Buy'}</span>
        </button>
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
        onQuantityChange={handleCartQuantityChange}
        onRemove={handleRemoveFromCart}
        onClose={() => setCartVisible(false)}
      />

      {/* Detailed Modal Carousel Slider */}
      <ProductModal
        visible={detailProduct !== null}
        product={detailProduct}
        language={language}
        labels={activeLabels}
        onClose={() => setDetailProduct(null)}
        onCartAdded={handleAddToCart}
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
        product={detailProduct || selectedProduct}
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
