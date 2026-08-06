import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function WelcomeScreen({ onEnter, apiUrl }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchWelcomeImage = async () => {
      // Check cache first
      try {
        const cachedTimestamp = localStorage.getItem('byangels_welcome_cache_timestamp');
        const cachedImage = localStorage.getItem('byangels_welcome_image');
        const now = Date.now();
        if (cachedTimestamp && cachedImage && (now - parseInt(cachedTimestamp, 10) < 2 * 60 * 1000)) {
          console.log('⚡ Using cached Welcome Screen media URL from localStorage');
          setImageUrl(cachedImage);
          return;
        }
      } catch (cacheErr) {
        console.warn('⚠️ Error reading Welcome cache:', cacheErr);
      }

      try {
        const base = apiUrl || 'http://localhost:5000';
        const res = await fetch(`${base}/api/inicio`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Extract Pinterest url from the collection documents
          if (data && data.length > 0) {
            const doc = data[0];
            let url = doc.UrlInicio || doc.url || doc.imagen || doc.imageUrl || doc.img || doc.urlN0;
            if (url) {
              // If URL is a Pinterest pin link, extract the raw video stream via API
              if (url.includes('pinterest.com/pin/') || url.includes('pin.it/')) {
                try {
                  console.log('📌 Extracting Pinterest Video stream for WelcomeScreen...');
                  const pRes = await fetch(`${base}/api/pinterest-video?url=${encodeURIComponent(url)}`, {
                    headers: {
                      'Bypass-Tunnel-Reminder': 'true',
                      'ngrok-skip-browser-warning': 'true'
                    }
                  });
                  if (pRes.ok) {
                    const pData = await pRes.json();
                    if (pData && pData.videoUrl) {
                      url = pData.videoUrl;
                      console.log('✅ Extracted Pinterest MP4/HLS stream:', url);
                    }
                  }
                } catch (pErr) {
                  console.warn('⚠️ Could not extract Pinterest video:', pErr);
                }
              }

              setImageUrl(url);
              // Save to cache
              try {
                localStorage.setItem('byangels_welcome_image', url);
                localStorage.setItem('byangels_welcome_cache_timestamp', Date.now().toString());
              } catch (saveErr) {
                console.warn('⚠️ Failed to save Welcome image to cache:', saveErr);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not load Welcome image from backend:', err);
      }
      setImageUrl('');
      setLoading(false);
    };

    fetchWelcomeImage();
  }, [apiUrl]);

  useEffect(() => {
    if (!imageUrl || !videoRef.current) return;
    const video = videoRef.current;
    
    // Check if the URL is an HLS stream (.m3u8)
    const isHls = imageUrl.includes('.m3u8');
    
    video.muted = true; // Video background is completely silent now
    
    let hlsInstance = null;
    
    if (isHls) {
      const base = apiUrl || 'http://localhost:5000';
      // Strip v1.pinimg.com domain if present to construct path-based proxy URL
      const cleanPath = imageUrl.replace('https://v1.pinimg.com/videos/', '');
      const proxiedUrl = `${base}/api/proxy-video/${cleanPath}`;
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr, url) => {
            xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
            xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
          }
        });
        hlsInstance = hls;
        hls.loadSource(proxiedUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log("Play failed:", e));
          setLoading(false);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS fatal error:", data);
            setLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari / iOS)
        video.src = proxiedUrl;
        const playHandler = () => {
          video.play().catch(e => console.log("Play failed:", e));
          setLoading(false);
        };
        const errorHandler = () => {
          setLoading(false);
        };
        video.addEventListener('loadedmetadata', playHandler);
        video.addEventListener('error', errorHandler);
      } else {
        console.error("HLS is not supported in this browser");
        setLoading(false);
      }
    } else if (isVideoUrl(imageUrl)) {
      // Normal video URL
      video.src = imageUrl;
      video.load();
      const playHandler = () => {
        video.play().catch(e => console.log("Play failed:", e));
        setLoading(false);
      };
      const errorHandler = () => {
        setLoading(false);
      };
      video.addEventListener('loadedmetadata', playHandler);
      video.addEventListener('error', errorHandler);
    }

    // Cleanup resources to ensure video stops immediately when unmounted
    return () => {
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch (e) {
          console.error("Error destroying HLS:", e);
        }
      }
      try {
        video.pause();
        video.src = "";
        video.removeAttribute("src");
        video.load();
      } catch (err) {
        // Ignore unmount error
      }
    };
  }, [imageUrl, apiUrl]);

  const handleEnterClick = (e) => {
    setFadeOut(true);
    // Pause video and clear source to release resources immediately
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch (err) {
        console.warn("Error releasing video resources on click:", err);
      }
    }
    // Let the animation finish before calling onEnter
    setTimeout(() => {
      onEnter();
    }, 600); // match CSS transition duration
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return (
      /\.(mp4|webm|ogg|mov|m4v|m3u8)($|\?)/i.test(url) ||
      url.includes('/video/') ||
      url.includes('v.pinimg.com') ||
      url.includes('v/video') ||
      url.includes('pinterest.com/pin/') ||
      url.includes('pin.it/')
    );
  };

  return (
    <div className={`welcome-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Background Media (Image or Video) */}
      {imageUrl && (
        isVideoUrl(imageUrl) ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="welcome-bg-image"
            style={{ pointerEvents: 'none' }}
            onLoadedData={() => {
              if (!imageUrl.includes('.m3u8')) {
                setLoading(false);
              }
            }}
            onError={() => setLoading(false)}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Boutique Welcome"
            className="welcome-bg-image"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )
      )}
      
      {/* Dark tint overlay */}
      <div className="welcome-overlay"></div>

      {/* Content card */}
      <div className="welcome-content">
        <p className="welcome-subtitle">Boutique & Trends</p>
        
        {loading ? (
          <div className="welcome-spinner"></div>
        ) : (
          <button className="welcome-btn" onClick={handleEnterClick}>
            Entrar
          </button>
        )}
      </div>
    </div>
  );
}
