import React from 'react';
import Label from './Label';

/**
 * Componente ComboBox (Select) flexible y reutilizable.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {string} [props.label] - Etiqueta superior del control.
 * @param {string|number} props.value - Valor seleccionado.
 * @param {Array<Object>} props.options - Listado de opciones [{ value, label }].
 * @param {Function} props.onChange - Evento disparado al cambiar la selección.
 * @param {string} [props.placeholder] - Opción por defecto vacía / deshabilitada.
 * @param {boolean} [props.disabled=false] - Deshabilita el selector.
 * @param {boolean} [props.error=false] - Cambia el borde a color de error.
 * @param {string} [props.helperText] - Texto informativo o mensaje de error.
 * @param {string} props.name - Nombre del atributo.
 * @param {string} props.id - ID único del elemento.
 * @param {boolean} [props.required=false] - Indica obligatoriedad.
 * @param {string} [props.className=""] - Clases del contenedor principal.
 */
function ComboBox({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  name,
  id,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`common-field-wrapper ${error ? 'common-field-wrapper--error' : ''} ${className}`}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}

      <div className="common-select-container">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`common-select ${error ? 'common-select--error' : ''}`}
          {...props}
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        <span className="common-select-arrow">
          <i className="fa-solid fa-chevron-down" />
        </span>
      </div>

      {helperText && (
        <span className={`common-field-helper ${error ? 'common-field-helper--error' : ''}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}

export default ComboBox;
