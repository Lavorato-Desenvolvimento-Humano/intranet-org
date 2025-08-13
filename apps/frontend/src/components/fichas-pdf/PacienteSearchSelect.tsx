"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";
import { PacienteSummaryDto } from "@/types/clinical";
import fichaPdfService from "@/services/ficha-pdf";

interface PacienteSearchSelectProps {
  value: string; // pacienteId
  onChange: (pacienteId: string, pacienteNome?: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function PacienteSearchSelect({
  value,
  onChange,
  placeholder = "Digite o nome do paciente...",
  className = "",
  error = false,
}: PacienteSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [selectedPaciente, setSelectedPaciente] =
    useState<PacienteSummaryDto | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce para busca
  useEffect(() => {
    if (searchTerm.length < 2) {
      setPacientes([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const resultados =
          await fichaPdfService.buscarPacientesParaFichaPdf(searchTerm);
        setPacientes(resultados);
        setIsOpen(true);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        setPacientes([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar paciente selecionado pelo ID quando componente carrega
  useEffect(() => {
    if (value && !selectedPaciente) {
      // Se temos um ID mas não temos o paciente carregado, buscar
      const buscarPacienteSelecionado = async () => {
        try {
          // Fazer uma busca ampla para encontrar o paciente
          const todos = await fichaPdfService.buscarPacientesParaFichaPdf(
            "",
            1000
          );
          const pacienteEncontrado = todos.find((p) => p.id === value);
          if (pacienteEncontrado) {
            setSelectedPaciente(pacienteEncontrado);
            setSearchTerm(pacienteEncontrado.nome);
          }
        } catch (error) {
          console.error("Erro ao buscar paciente selecionado:", error);
        }
      };
      buscarPacienteSelecionado();
    }
  }, [value, selectedPaciente]);

  const handleSelectPaciente = (paciente: PacienteSummaryDto) => {
    setSelectedPaciente(paciente);
    setSearchTerm(paciente.nome);
    setIsOpen(false);
    onChange(paciente.id, paciente.nome);
  };

  const handleClearSelection = () => {
    setSelectedPaciente(null);
    setSearchTerm("");
    setPacientes([]);
    onChange("", "");
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // Se o usuário está digitando e já tinha um paciente selecionado, limpar seleção
    if (selectedPaciente && newValue !== selectedPaciente.nome) {
      setSelectedPaciente(null);
      onChange("", "");
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (pacientes.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />

        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

        {selectedPaciente && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-r-transparent rounded-full mr-2"></div>
              Buscando...
            </div>
          )}

          {!loading && pacientes.length === 0 && searchTerm.length >= 2 && (
            <div className="p-3 text-center text-gray-500">
              Nenhum paciente encontrado
            </div>
          )}

          {!loading && pacientes.length > 0 && (
            <>
              {pacientes.map((paciente) => (
                <button
                  key={paciente.id}
                  type="button"
                  onClick={() => handleSelectPaciente(paciente)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {paciente.nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {paciente.convenioNome} • {paciente.unidade}
                        {paciente.responsavel &&
                          ` • Resp: ${paciente.responsavel}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Informações do paciente selecionado */}
      {selectedPaciente && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">
              {selectedPaciente.nome}
            </span>
            <span className="text-blue-600 mx-2">•</span>
            <span className="text-blue-700">
              {selectedPaciente.convenioNome}
            </span>
            <span className="text-blue-600 mx-2">•</span>
            <span className="text-blue-700">{selectedPaciente.unidade}</span>
          </div>
        </div>
      )}
    </div>
  );
}
