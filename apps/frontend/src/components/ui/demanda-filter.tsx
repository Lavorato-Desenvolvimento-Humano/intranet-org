// src/components/ui/demanda-filter.tsx
import React, { useState } from "react";
import { Filter, X, Search } from "lucide-react";
import { DemandaFilterParams } from "@/types/demanda";
import { UserDto } from "@/services/user";

interface DemandaFilterProps {
  initialFilters: DemandaFilterParams;
  onFilterChange: (filters: DemandaFilterParams) => void;
  usuarios?: UserDto[];
  showUserFilter?: boolean;
}

const DemandaFilter: React.FC<DemandaFilterProps> = ({
  initialFilters,
  onFilterChange,
  usuarios = [],
  showUserFilter = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<DemandaFilterParams>(initialFilters);
  const [searchText, setSearchText] = useState(initialFilters.textoBusca || "");

  // Manipular mudanças nos filtros
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    const updatedFilters = {
      ...filters,
      [name]: value || undefined, // Usar undefined em vez de string vazia
    };

    setFilters(updatedFilters);
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFilterChange({
      ...filters,
      textoBusca: searchText || undefined,
    });
    setIsOpen(false);
  };

  // Limpar filtros
  const clearFilters = () => {
    const emptyFilters: DemandaFilterParams = {
      page: 0,
      size: initialFilters.size,
    };
    setFilters(emptyFilters);
    setSearchText("");
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  // Lidar com busca por texto (quando Enter for pressionado)
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onFilterChange({
        ...filters,
        textoBusca: searchText || undefined,
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-4 flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <Filter className="h-5 w-5 mr-2" />
          <span>Filtros</span>
        </button>
      </div>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filtros</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={filters.status || ""}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Prioridade
              </label>
              <select
                name="prioridade"
                value={filters.prioridade || ""}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            {showUserFilter && usuarios.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Atribuído para
                </label>
                <select
                  name="atribuidoParaId"
                  value={filters.atribuidoParaId || ""}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Todos</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Data de início
              </label>
              <input
                type="date"
                name="dataInicio"
                value={filters.dataInicio || ""}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data de fim
              </label>
              <input
                type="date"
                name="dataFim"
                value={filters.dataFim || ""}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Limpar
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandaFilter;
