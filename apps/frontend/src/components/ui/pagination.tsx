// src/components/ui/pagination.tsx
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) => {
  // Não renderizar se não houver páginas ou apenas uma página
  if (totalPages <= 1) {
    return null;
  }

  // Determinar quais páginas mostrar
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    // Caso simples - mostrar todas as páginas se forem poucas
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Sempre mostrar a primeira e última página
    const firstPage = 1;
    const lastPage = totalPages;

    // Calcular o intervalo central
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(lastPage - 1, currentPage + 1);

    // Ajustar o intervalo para garantir que mostremos o número correto de páginas
    const pagesInCenter = endPage - startPage + 1;
    if (pagesInCenter < 3) {
      if (startPage === 2) {
        endPage = Math.min(lastPage - 1, endPage + (3 - pagesInCenter));
      } else if (endPage === lastPage - 1) {
        startPage = Math.max(2, startPage - (3 - pagesInCenter));
      }
    }

    // Adicionar primeira página
    pageNumbers.push(firstPage);

    // Adicionar elipsis se necessário
    if (startPage > 2) {
      pageNumbers.push("ellipsis-start");
    }

    // Adicionar páginas do meio
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Adicionar elipsis se necessário
    if (endPage < lastPage - 1) {
      pageNumbers.push("ellipsis-end");
    }

    // Adicionar última página se não for igual à primeira
    if (lastPage !== firstPage) {
      pageNumbers.push(lastPage);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        {totalItems !== undefined && pageSize !== undefined && (
          <span>
            Mostrando{" "}
            {Math.min(currentPage * pageSize, totalItems) - pageSize + 1} a{" "}
            {Math.min(currentPage * pageSize, totalItems)} de {totalItems} itens
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {/* Botão para primeira página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Primeira página">
          <ChevronsLeft size={16} />
        </button>

        {/* Botão para página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Página anterior">
          <ChevronLeft size={16} />
        </button>

        {/* Botões de página */}
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <span
                key={`${page}-${index}`}
                className="px-3 py-2 text-gray-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={`Página ${page}`}
              aria-current={currentPage === page ? "page" : undefined}>
              {page}
            </button>
          );
        })}

        {/* Botão para próxima página */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Próxima página">
          <ChevronRight size={16} />
        </button>

        {/* Botão para última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Última página">
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
