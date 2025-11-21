import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Check } from "lucide-react";

// 1. Defina o que o componente aceita (Interface)
interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[]; // A lista padronizada
  value: string | number; // O ID selecionado (vêm do pai)
  onChange: (value: string | number) => void; // Avisa o pai
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

  // 2. EFEITO: Sincronizar o texto com o valor externo
  // Se o 'value' (ID) mudar lá fora, precisamos achar o label (Nome) correspondente
  useEffect(() => {
    const selectedOption = options.find((opt) => opt.value === value);
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, options]);

  // 3. LÓGICA: Filtrar as opções baseado no que foi digitado
  const filteredOptions = options.filter((option) =>
    // Dica: use toLowerCase() para comparar
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
  });

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
          // Eventos do Input:
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true); // Digitou? Abre a lista
            // DICA: Se o usuário digita, o ID selecionado tecnicamente deixa de existir até ele clicar
            if (value) onChange("");
          }}
          onClick={() => setIsOpen(true)} // Clicou? Abre a lista
        />

        {/* ÍCONES (X para limpar, Seta para indicar dropdown) */}
        <div className="absolute right-2 top-2.5 flex items-center gap-1">
          {/* Aqui você coloca a lógica: Se tiver valor, mostra o X, senão mostra a Seta */}
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(""); // Limpa valor real
                setSearchTerm(""); // Limpa texto
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
                  // AQUI É A MÁGICA
                  // 1. Atualiza o valor real (chama onChange)
                  onChange(option.value);
                  // 2. Atualiza o texto visual
                  setSearchTerm(option.label);
                  // 3. Fecha a lista
                  setIsOpen(false);
                }}>
                <span>{option.label}</span>
                {/* Mostra um check se estiver selecionado */}
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
