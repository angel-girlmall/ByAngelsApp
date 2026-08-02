import React, { useState, useEffect } from 'react';

/**
 * CountdownTimer Component for ByAngelsApp
 * Displays a luxury top-right countdown clock showing total remaining hours,
 * minutes, and seconds until the next Order Closing deadline (supports 2 weekly cycles: Ciclo 1 & Ciclo 2).
 */
function CountdownTimer({ apiUrl = 'https://by-angels-apis.vercel.app' }) {
  const [config, setConfig] = useState({
    diaInicio1: 'Lunes',
    horaInicio1: '08:00',
    diaFin1: 'Miércoles',
    horaFin1: '23:59',

    diaInicio2: 'Jueves',
    horaInicio2: '08:00',
    diaFin2: 'Sábado',
    horaFin2: '23:59',

    titulo: 'Cierre de Pedidos',
    activo: true
  });

  const [timeLeft, setTimeLeft] = useState({
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
          const parsed = JSON.parse(cached);
          // Remove "Semanal" if present in cached title
          if (parsed.titulo && parsed.titulo.includes('Semanal')) {
            parsed.titulo = parsed.titulo.replace(/\s*Semanal\s*/i, '').trim();
          }
          setConfig(parsed);
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
          if (data.titulo && data.titulo.includes('Semanal')) {
            data.titulo = data.titulo.replace(/\s*Semanal\s*/i, '').trim();
          }
          setConfig(prev => ({ ...prev, ...data }));
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

  // Calculate nearest upcoming target date from either Cycle 1 or Cycle 2
  const getNearestTargetDate = () => {
    const now = new Date();

    const getCycleTarget = (diaFin, horaFin) => {
      const targetDayIndex = dayNameToIndex[(diaFin || 'viernes').toLowerCase()] ?? 5;
      const [targetHour, targetMin] = (horaFin || '23:59').split(':').map(Number);

      const candidate = new Date(now);
      candidate.setHours(targetHour || 23, targetMin || 59, 59, 999);

      const currentDayIndex = now.getDay();
      let daysUntil = targetDayIndex - currentDayIndex;

      if (daysUntil < 0 || (daysUntil === 0 && now > candidate)) {
        daysUntil += 7;
      }

      candidate.setDate(now.getDate() + daysUntil);
      return candidate;
    };

    // Candidate 1 (Ciclo 1)
    const target1 = getCycleTarget(config.diaFin1 || config.diaFin || 'Miércoles', config.horaFin1 || config.horaFin || '23:59');

    // Candidate 2 (Ciclo 2)
    const target2 = getCycleTarget(config.diaFin2 || 'Sábado', config.horaFin2 || '23:59');

    // Return whichever upcoming deadline is closer in time
    return target1.getTime() < target2.getTime() ? target1 : target2;
  };

  // Timer Tick Interval - Converts days directly into total hours (e.g. 48h + 5h = 53h)
  useEffect(() => {
    if (config.activo === false) return;

    const updateTimer = () => {
      const now = new Date();
      const target = getNearestTargetDate();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isFinished: true });
        return;
      }

      // Sum all days into total hours
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours: totalHours, minutes, seconds, isFinished: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (config.activo === false) return null;

  // Clean title text removing "Semanal" if present
  const displayTitle = (config.titulo || 'Cierre de Pedidos').replace(/\s*Semanal\s*/i, '').trim();

  return (
    <div className="countdown-timer-widget">
      <div className="countdown-timer-header">
        <i className="fa-solid fa-clock-rotate-left countdown-icon-glow"></i>
        <span className="countdown-timer-title">{displayTitle || 'Cierre de Pedidos'}</span>
      </div>

      {timeLeft.isFinished ? (
        <div className="countdown-timer-finished">
          <span>¡Cierre Finalizado!</span>
        </div>
      ) : (
        <div className="countdown-timer-units">
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
