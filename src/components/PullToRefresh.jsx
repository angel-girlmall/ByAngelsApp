import React, { useState, useEffect, useRef } from 'react';

/**
 * PullToRefresh Component
 * Enables smooth pull-down-to-reload gesture on mobile devices.
 */
function PullToRefresh({ language = 'es' }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 75; // Distance in px to trigger reload

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only initiate pull-to-refresh if window is at the top (scrollTop <= 5)
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop <= 5 && e.touches && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      } else {
        isPulling.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY.current;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop <= 5 && diffY > 0) {
        // Apply resistance damping formula
        const distance = Math.min(Math.pow(diffY, 0.85), 110);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current || refreshing) return;
      isPulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(55); // Hold spinner position while reloading

        // Clear local storage cache timestamp to force fresh API load, then reload page
        try {
          localStorage.removeItem('byangels_cache_timestamp');
        } catch (err) {}

        setTimeout(() => {
          window.location.reload();
        }, 350);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing]);

  if (pullDistance === 0 && !refreshing) return null;

  const isReady = pullDistance >= PULL_THRESHOLD;

  return (
    <div 
      className="pull-to-refresh-indicator"
      style={{
        transform: `translateY(${pullDistance}px)`,
        opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
      }}
    >
      <div className="pull-to-refresh-content">
        <i className={`fa-solid ${refreshing ? 'fa-spinner fa-spin' : isReady ? 'fa-arrow-down-long rotate-180' : 'fa-arrow-down-long'}`}></i>
        <span>
          {refreshing
            ? (language === 'es' ? 'Recargando catálogo...' : 'Reloading catalog...')
            : isReady
            ? (language === 'es' ? 'Suelta para recargar' : 'Release to reload')
            : (language === 'es' ? 'Desliza hacia abajo para recargar' : 'Pull down to reload')}
        </span>
      </div>
    </div>
  );
}

export default PullToRefresh;
