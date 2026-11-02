import React, { useState } from 'react';
import SizeGuideModal from './SizeGuideModal';

/**
 * HelpInfoModal Component
 * Panel informativo de inicio que explica lo que hace cada botón y acción de Lua Mila.
 */
export default function HelpInfoModal({ visible, onClose, language = 'es' }) {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  if (!visible) return null;

  const items = language === 'es' ? [
    {
      type: 'pasarela',
      title: 'Pasarela',
      desc: 'Mira los desfiles en video'
    },
    {
      type: 'carrito',
      title: 'Mi carrito',
      desc: 'agregar productos'
    },
    {
      type: 'buscar',
      title: 'Buscar',
      desc: 'Encuentra prendas'
    },
    {
      type: 'estilos',
      title: 'Todos los estilos',
      desc: 'Elige Tus estilos  Casual , urbano y deportivo'
    },
    {
      type: 'cierre',
      title: 'Cierre de pedidos',
      desc: 'Haz tu pedido antes del cierre de pedidos'
    },
    {
      type: 'noticias',
      title: 'Noticias',
      desc: 'Nuevos modelos de estreno Y Promos de temporada'
    },
    {
      type: 'morena',
      title: 'Cambiar el color/tono de la modelo',
      desc: 'Alterna entre tono clara y morena'
    },
    {
      type: 'girar',
      title: 'Girar',
      desc: 'Gira ala modelo'
    },
    {
      type: 'idioma',
      title: 'Idioma / dólares',
      desc: 'Cambia a EN y a dólares'
    },
    {
      type: 'musica',
      title: 'Música',
      desc: 'Elige tu canción en la playlist'
    },
    {
      type: 'tallas',
      title: 'Guía de tallas',
      desc: 'Consulta medidas y equivalencias'
    }
  ] : [
    {
      type: 'pasarela',
      title: 'Runway',
      desc: 'Watch runway videos'
    },
    {
      type: 'carrito',
      title: 'My Cart',
      desc: 'Add products'
    },
    {
      type: 'buscar',
      title: 'Search',
      desc: 'Find garments'
    },
    {
      type: 'estilos',
      title: 'All styles',
      desc: 'Choose your styles: Casual, Urbano & Deportivo'
    },
    {
      type: 'cierre',
      title: 'Order closing',
      desc: 'Place your order before closing time'
    },
    {
      type: 'noticias',
      title: 'News & Releases',
      desc: 'New releases and seasonal promotions'
    },
    {
      type: 'morena',
      title: 'Change model skin tone',
      desc: 'Switch between light and brunette model'
    },
    {
      type: 'girar',
      title: 'Rotate',
      desc: 'Rotate model view'
    },
    {
      type: 'idioma',
      title: 'Language / Currency',
      desc: 'Switch to EN and dollars'
    },
    {
      type: 'musica',
      title: 'Music',
      desc: 'Choose your song in the playlist'
    },
    {
      type: 'tallas',
      title: 'Size Guide',
      desc: 'Check measurements and sizing'
    }
  ];

  const renderIconSvg = (type) => {
    switch (type) {
      case 'pasarela':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2.5" />
            <path d="M7 4v4M12 4v4M17 4v4M2 8h20M7 8l-3 4M12 8l-3 4M17 8l-3 4" strokeWidth="1.3" />
            <polygon points="10 11 15 14 10 17" fill="currentColor" stroke="none" />
          </svg>
        );
      case 'carrito':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M1 2h3.5l2.6 13h12.4l3.5-9H6" />
          </svg>
        );
      case 'buscar':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        );
      case 'estilos':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M7 12h10M10 18h4" />
          </svg>
        );
      case 'cierre':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <polyline points="12 9 12 13 14.5 14.5" />
            <path d="M12 2v3M10 2h4" />
          </svg>
        );
      case 'noticias':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      case 'morena':
        return (
          <span style={{ fontSize: '1.25rem', lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>
            👩🏼
          </span>
        );
      case 'girar':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <polyline points="3 3 3 8 8 8" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <polyline points="21 21 21 16 16 16" />
          </svg>
        );
      case 'idioma':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v12M14.5 8.5h-3.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H9" />
          </svg>
        );
      case 'musica':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
            <path d="M11 18V6l10-2v12" />
          </svg>
        );
      case 'tallas':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div 
        className="help-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Destello glow superior en el marco */}
        <div className="help-modal-ambient-glow" />

        {/* Header con icono circular e interrogación */}
        <div className="help-modal-header">
          <div className="help-header-icon-circle">
            <div className="help-sparkle-dot top-left" />
            <span className="help-question-mark">?</span>
          </div>
          <h2 className="help-modal-title">
            ¿Cómo usar Lua Mila?
          </h2>
        </div>

        {/* Lista scrolleable con los items */}
        <div className="help-modal-list">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={`help-modal-item ${item.type === 'tallas' ? 'is-clickable' : ''}`}
              onClick={item.type === 'tallas' ? () => setShowSizeGuide(true) : undefined}
            >
              <div className="help-item-icon-circle">
                <div className="help-icon-sheen" />
                <div className="help-item-svg-wrap">
                  {renderIconSvg(item.type)}
                </div>
              </div>
              <div className="help-item-texts">
                <span className="help-item-title">{item.title}</span>
                <span className="help-item-desc">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Indicador inferior: Desliza para ver más con flecha morada */}
        <div className="help-modal-scroll-hint">
          <span>{language === 'es' ? 'Desliza para ver más' : 'Scroll for more'}</span>
          <svg className="help-scroll-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a768d6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Botón Entendido idéntico en dorado perla */}
        <button 
          type="button" 
          className="help-modal-btn-confirm"
          onClick={onClose}
        >
          {language === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>

      {/* Modal Guía de Tallas */}
      <SizeGuideModal
        visible={showSizeGuide}
        language={language}
        onClose={() => setShowSizeGuide(false)}
      />
    </div>
  );
}
