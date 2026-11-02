import React from 'react';

/**
 * SizeGuideModal Component
 * Modal réplica idéntica a la imagen de referencia:
 * - Título: "Guía de Talla - Medidas" en tipografía elegante serif.
 * - Píldora turquesa pastel con carrito: "🛒 Tela Stretch - Cede hasta +10cm".
 * - Tabla con encabezados: Talla | TÚ USAS | Busto | Cintura | Cadera.
 * - Filas: XS (26), S (28), M (30), L (32-34).
 * - Solo se resalta la fila si el usuario ha seleccionado una talla (selectedSize).
 * - Pie de tabla: "*Medidas referenciales".
 * - Botón de cierre superior 'X'.
 */
export default function SizeGuideModal({ visible, onClose, language = 'es', selectedSize = '' }) {
  if (!visible) return null;

  const currentSizeUpper = (selectedSize || '').trim().toUpperCase();

  const rows = [
    { size: 'XS', uses: '26', bust: '82-92 cm', waist: '62-72 cm', hips: '88-98 cm' },
    { size: 'S',  uses: '28', bust: '86-96 cm', waist: '66-76 cm', hips: '92-102 cm' },
    { size: 'M',  uses: '30', bust: '90-100 cm', waist: '70-80 cm', hips: '96-106 cm' },
    { size: 'L',  uses: '32-34', bust: '94-104 cm', waist: '74-84 cm', hips: '100-110 cm' }
  ];

  return (
    <div className="size-guide-modal-overlay" onClick={(e) => { e.stopPropagation(); if (onClose) onClose(e); }}>
      <div 
        className="size-guide-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X */}
        <button 
          type="button" 
          className="size-guide-close-btn"
          onClick={(e) => { e.stopPropagation(); if (onClose) onClose(e); }}
          aria-label="Cerrar guía de tallas"
        >
          ✕
        </button>

        {/* Título elegante */}
        <h3 className="size-guide-title">
          {language === 'es' ? 'Guía de Talla - Medidas' : 'Size Guide - Measurements'}
        </h3>

        {/* Píldora Tela Stretch */}
        <div className="size-guide-stretch-pill">
          <span className="stretch-pill-cart">🛒</span>
          <span className="stretch-pill-text">
            {language === 'es' ? 'Tela Stretch - Cede hasta +10cm' : 'Stretch Fabric - Expands up to +10cm'}
          </span>
        </div>

        {/* Tabla de medidas */}
        <div className="size-guide-table-wrapper">
          <table className="size-guide-table">
            <thead>
              <tr>
                <th>{language === 'es' ? 'Talla' : 'Size'}</th>
                <th>{language === 'es' ? 'TÚ USAS' : 'YOU WEAR'}</th>
                <th>{language === 'es' ? 'Busto' : 'Bust'}</th>
                <th>{language === 'es' ? 'Cintura' : 'Waist'}</th>
                <th>{language === 'es' ? 'Cadera' : 'Hips'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = currentSizeUpper === row.size;
                return (
                  <tr key={row.size} className={isSelected ? 'size-row-highlighted' : ''}>
                    <td className={`size-cell-name ${isSelected ? 'with-check' : ''}`}>
                      {isSelected && <span className="size-check-icon">✓</span>}
                      <span>{row.size}</span>
                    </td>
                    <td>{row.uses}</td>
                    <td>{row.bust}</td>
                    <td>{row.waist}</td>
                    <td>{row.hips}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Nota al pie */}
        <p className="size-guide-footer-note">
          {language === 'es' ? '*Medidas referenciales' : '*Referential measurements'}
        </p>
      </div>
    </div>
  );
}
