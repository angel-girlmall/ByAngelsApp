import React from 'react';
import ComboBox from './common/ComboBox';

/**
 * SearchFilter Component
 * Properties (Inputs):
 *  - searchValue: string
 *  - selectedStyle: string
 *  - placeholder: string
 *  - stylesLabel: string
 *  - options: Object (key-value translations for categories)
 *  - allLabel: string (e.g. "Todos los estilos")
 * Events (Outputs):
 *  - onSearchChange: Function(value)
 *  - onStyleChange: Function(value)
 */
function SearchFilter({ 
  searchValue = '', 
  selectedStyle = '', 
  placeholder = 'Search...', 
  stylesLabel = 'Styles', 
  options = {}, 
  allLabel = 'All styles',
  onSearchChange, 
  onStyleChange 
}) {
  const filterOptions = [
    { value: '', label: allLabel },
    ...Object.entries(options).map(([key, label]) => ({
      value: key,
      label: label
    }))
  ];

  return (
    <div className="filters-container">
      {/* Search Input Box */}
      <div className="search-input-wrapper">
        <input
          type="text"
          id="search-input-field"
          className="search-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
      </div>

      {/* Styles Custom ComboBox (Matches ProductModal ComboBox design) */}
      <div className="styles-combobox-wrapper">
        <ComboBox
          id="style-select-dropdown"
          name="style"
          value={selectedStyle}
          placeholder={allLabel}
          options={filterOptions}
          placement="bottom"
          onChange={(e) => onStyleChange && onStyleChange(e.target.value)}
          className="filter-combobox"
        />
      </div>
    </div>
  );
}

export default SearchFilter;
