import React, { useState, useRef, useEffect } from 'react';
import Label from './Label';

/**
 * Luxury Boutique ComboBox Component
 * Replicates editorial boutique aesthetic with golden radio indicators and serif italic typography.
 *
 * @param {Object} props
 * @param {string} [props.label] - Upper label
 * @param {string|number} props.value - Selected size/option value
 * @param {Array<Object>} props.options - [{ value, label }]
 * @param {Function} props.onChange - Triggered upon selection { target: { value, name } }
 * @param {string} [props.placeholder] - Fallback placeholder text
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.error=false]
 * @param {string} [props.helperText]
 * @param {string} props.name
 * @param {string} props.id
 * @param {boolean} [props.required=false]
 * @param {string} [props.className=""]
 */
function ComboBox({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Seleccionar talla',
  disabled = false,
  error = false,
  helperText,
  name,
  id,
  required = false,
  className = '',
  prefix = '',
  placement = 'top',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when tapping anywhere outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = (optVal) => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { value: optVal, name } });
    }
    setIsOpen(false);
  };

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const displayText = selectedOption
    ? (prefix ? `${prefix}${selectedOption.label}` : selectedOption.label)
    : (placeholder || 'Seleccionar');

  return (
    <div
      ref={containerRef}
      className={`common-field-wrapper custom-combobox-wrapper ${error ? 'common-field-wrapper--error' : ''} ${className}`}
    >
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}

      <div className="custom-combobox-container">
        {/* Trigger Button with 50% opacity pink border and gold pill */}
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`custom-combobox-trigger ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="combobox-trigger-text">
            {displayText}
          </span>
          <span className={`combobox-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
            <i className="fa-solid fa-chevron-down"></i>
          </span>
        </button>

        {/* Dropdown Options Menu matching reference photo */}
        {isOpen && (
          <div className={`custom-combobox-dropdown placement-${placement}`} role="listbox">
            <div className="custom-combobox-options-list">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`custom-combobox-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span className="combobox-item-label">{opt.label}</span>
                    <span className={`combobox-radio-circle ${isSelected ? 'selected' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden select for accessibility & form compliance */}
        <select
          name={name}
          value={value}
          onChange={(e) => onChange && onChange(e)}
          tabIndex={-1}
          style={{ display: 'none' }}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
