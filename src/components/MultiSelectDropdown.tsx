import React, { useState, useEffect, useRef, useMemo } from 'react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  searchable?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((item) => item !== option)
      : [...selectedValues, option];
    onChange(newSelectedValues);
  };

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} Selected`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 text-white rounded-md border border-slate-600 px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-sky-500 flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonText()}</span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg">
          <ul
            className="max-h-60 overflow-auto text-white"
            role="listbox"
          >
            {searchable && (
              <div className="p-2 sticky top-0 bg-slate-700">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-slate-600 text-white rounded-md border border-slate-500 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {filteredOptions.map((option) => (
              <li
                key={option}
                className="px-3 py-2 cursor-pointer hover:bg-slate-600 flex items-center"
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={selectedValues.includes(option)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => {}} // click is handled by li
                  className="mr-2 h-4 w-4 rounded border-slate-500 text-sky-600 focus:ring-sky-500 bg-slate-800"
                />
                {option}
              </li>
            ))}
            {filteredOptions.length === 0 && (
                <li className="px-3 py-2 text-slate-400">No options found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;