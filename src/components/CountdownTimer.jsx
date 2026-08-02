import React, { useState, useEffect } from 'react';

/**
 * CountdownTimer Component for ByAngelsApp
 * Displays a luxury top-right countdown clock showing time remaining
 * until the next Order Closing deadline configured in ByAngelsAdmin.
 */
function CountdownTimer({ apiUrl = 'https://by-angels-apis.vercel.app' }) {
  const [config, setConfig] = useState({
    diaInicio: 'Lunes',
    horaInicio: '08:00',
    diaFin: 'Viernes',
    horaFin: '23:59',
    titulo: 'Cierre de Pedidos',
    activo: true
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFinished: false
  });

  const dayNameToIndex = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6
  };

  // Fetch Order Closing Schedule configuration from API or cache
  useEffect(() => {
    const fetchConfig = async () => {
      // Check local cache first
      try {
        const cached = localStorage.getItem('byangels_cierre_config');
        if (cached) {
          setConfig(JSON.parse(cached));
        }
      } catch (e) {}

      try {
        const res = await fetch(`${apiUrl}/api/cierre`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          try {
            localStorage.setItem('byangels_cierre_config', JSON.stringify(data));
          } catch (saveErr) {}
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch cierre config for timer widget:', err.message);
      }
    };

    fetchConfig();
  }, [apiUrl]);

  // Calculate target date for the upcoming order deadline
  const getTargetDate = () => {
    const now = new Date();
    const targetDayIndex = dayNameToIndex[(config.diaFin || 'viernes').toLowerCase()] ?? 5;
    const [targetHour, targetMin] = (config.horaFin || '23:59').split(':').map(Number);

    const result = new Date(now);
    result.setHours(targetHour || 23, targetMin || 59, 59, 999);

    const currentDayIndex = now.getDay();
    let daysUntilTarget = targetDayIndex - currentDayIndex;

    // If deadline day is today but time has passed, or deadline day is earlier in week
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now > result)) {
      daysUntilTarget += 7;
    }

    result.setDate(now.getDate() + daysUntilTarget);
    return result;
  };

  // Timer Tick Interval
  useEffect(() => {
    if (config.activo === false) return;

    const updateTimer = () => {
      const now = new Date();
      const target = getTargetDate();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isFinished: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (config.activo === false) return null;

  return (
    <div className="countdown-timer-widget">
      <div className="countdown-timer-header">
        <i className="fa-solid fa-clock-rotate-left countdown-icon-glow"></i>
        <span className="countdown-timer-title">{config.titulo || 'Cierre de Pedidos'}</span>
      </div>

      {timeLeft.isFinished ? (
        <div className="countdown-timer-finished">
          <span>¡Cierre Finalizado!</span>
        </div>
      ) : (
        <div className="countdown-timer-units">
          <div className="timer-unit-box">
            <span className="timer-unit-value">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="timer-unit-label">Días</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-unit-box">
            <span className="timer-unit-value">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="timer-unit-label">Hs</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-unit-box">
            <span className="timer-unit-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="timer-unit-label">Min</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-unit-box">
            <span className="timer-unit-value accent">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="timer-unit-label">Seg</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CountdownTimer;
