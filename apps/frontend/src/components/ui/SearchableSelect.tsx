import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Check } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
}: SearchableSelectProps) => {
  // ESTADOS
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // REF (Para detectar clique fora do componente)
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);

        const selectedOption = options.find((opt) => opt.value === value);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [value, options]);

  useEffect(() => {
    const selectedOption = options.find((opt) => opt.value === value);
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, options]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // CONTAINER PRINCIPAL (O 'relative' é crucial)
    <div className="relative w-full" ref={containerRef}>
      {/* INPUT AREA */}
      <div className="relative">
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2 pr-8 focus:outline-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onClick={() => setIsOpen(true)}
        />

        {/* ÍCONES (X para limpar, Seta para indicar dropdown) */}
        <div className="absolute right-2 top-2.5 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSearchTerm("");
              }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* LISTA FLUTUANTE (Só renderiza se isOpen for true) */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                onClick={() => {
                  onChange(option.value);
                  setSearchTerm(option.label);
                  setIsOpen(false);
                }}>
                <span>{option.label}</span>
                {option.value === value && (
                  <Check size={14} className="text-blue-500" />
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};
