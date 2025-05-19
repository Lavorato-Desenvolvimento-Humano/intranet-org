// src/components/ui/color-picker.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  error?: string;
}

const colorOptions = [
  "#808080", // Cinza - padrão
  "#2ea6b8", // Azul primário do sistema
  "#58c5d6", // Azul claro
  "#3498db", // Azul
  "#2ecc71", // Verde
  "#f39c12", // Laranja
  "#e74c3c", // Vermelho
  "#9b59b6", // Roxo
  "#34495e", // Azul escuro
  "#1abc9c", // Turquesa
  "#f1c40f", // Amarelo
  "#d35400", // Laranja escuro
  "#c0392b", // Vermelho escuro
  "#7f8c8d", // Cinza claro
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(color || "#808080");
  const [customColor, setCustomColor] = useState(color || "#808080");
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Atualizar o estado interno quando a cor externa mudar
    if (color && color !== currentColor) {
      setCurrentColor(color);
      setCustomColor(color);
    }
  }, [color]);

  useEffect(() => {
    // Fechar o seletor de cores quando clicar fora dele
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleColorClick = (newColor: string) => {
    setCurrentColor(newColor);
    setCustomColor(newColor);
    onChange(newColor);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setCurrentColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="relative" ref={colorPickerRef}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div
        className="flex items-center border rounded-lg p-2 cursor-pointer hover:border-primary"
        onClick={() => setIsOpen(!isOpen)}>
        <div
          className="w-6 h-6 rounded-full mr-2"
          style={{ backgroundColor: currentColor }}></div>
        <span className="text-sm">{currentColor}</span>
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-3 w-64">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {colorOptions.map((c) => (
              <div
                key={c}
                className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                  c === currentColor ? "ring-2 ring-black" : ""
                }`}
                style={{ backgroundColor: c }}
                onClick={() => handleColorClick(c)}></div>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium mb-1">
              Cor personalizada:
            </label>
            <div className="flex items-center">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-8 h-8 p-0 border-0"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                }}
                onBlur={() => {
                  // Validar e aplicar a cor personalizada ao perder o foco
                  try {
                    // Verificar se é uma cor válida
                    const tempDiv = document.createElement("div");
                    tempDiv.style.color = customColor;
                    if (tempDiv.style.color) {
                      setCurrentColor(customColor);
                      onChange(customColor);
                    }
                  } catch (error) {
                    // Em caso de erro, reverter para a cor atual
                    setCustomColor(currentColor);
                  }
                }}
                className="ml-2 w-full p-1 text-xs border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
