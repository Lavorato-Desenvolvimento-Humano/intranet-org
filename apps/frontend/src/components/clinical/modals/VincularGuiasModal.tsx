"use client";

import React, { useState, useEffect } from "react";
import { Link, X, Eye, AlertTriangle, Check } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { fichaService, guiaService } from "@/services/clinical";
import { GuiaSummaryDto, PageResponse } from "@/types/clinical";
import { formatDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

interface VincularGuiaModalProps {
  fichaId: string;
  pacienteNome: string;
  especialidade: string;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

export const VincularGuiaModal: React.FC<VincularGuiaModalProps> = ({
  fichaId,
  pacienteNome,
  especialidade,
  onClose,
  onSuccess,
  isOpen,
}) => {
  // Estados
  const [guias, setGuias] = useState<PageResponse<GuiaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });

  const [selectedGuiaId, setSelectedGuiaId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Carregar guias quando modal abrir
  useEffect(() => {
    if (isOpen) {
      resetModal();
      loadGuias();
    }
  }, [isOpen, searchTerm, currentPage]);

  const resetModal = () => {
    setSelectedGuiaId("");
    setSearchTerm("");
    setCurrentPage(0);
  };

  const loadGuias = async () => {
    try {
      setLoading(true);

      let guiasData: PageResponse<GuiaSummaryDto>;

      if (searchTerm.trim()) {
        // Buscar por número da guia
        guiasData = await guiaService.searchByNumeroGuia(
          searchTerm,
          currentPage,
          10
        );
      } else {
        // Buscar todas as guias
        guiasData = await guiaService.getAllGuias(currentPage, 10);
      }

      setGuias(guiasData);
    } catch (err) {
      console.error("Erro ao carregar guias:", err);
      toastUtil.error("Erro ao carregar guias disponíveis");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Verificar se guia é compatível
  const isGuiaCompativel = (guia: GuiaSummaryDto): boolean => {
    const mesmoPaciente = guia.pacienteNome === pacienteNome;
    const temEspecialidade = guia.itens?.some(
      (item) => item.especialidade === especialidade
    );
    return mesmoPaciente && temEspecialidade;
  };

  const handleVincular = async () => {
    if (!selectedGuiaId) {
      toastUtil.error("Selecione uma guia");
      return;
    }

    try {
      setVinculando(true);
      await fichaService.vincularFichaAGuia(fichaId, selectedGuiaId);

      const guiaSelecionada = guias.content.find(
        (g) => g.id === selectedGuiaId
      );
      toastUtil.success(
        `Ficha vinculada à guia #${guiaSelecionada?.numeroGuia} com sucesso!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao vincular ficha:", err);
      toastUtil.error(
        err.response?.data?.message || "Erro ao vincular ficha à guia"
      );
    } finally {
      setVinculando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Link className="mr-2 h-5 w-5 text-blue-600" />
              Vincular Ficha à Guia
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Paciente:</strong> {pacienteNome} •{" "}
              <strong>Especialidade:</strong> {especialidade}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={vinculando}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Busca */}
          <div className="mb-6">
            <SearchInput
              placeholder="Buscar por número da guia ou nome do paciente..."
              value={searchTerm}
              onChange={handleSearch}
              //   disabled={loading || vinculando}
            />
          </div>

          {/* Aviso */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Critérios para vinculação:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Mesmo paciente: {pacienteNome}</li>
                  <li>• Especialidade: {especialidade}</li>
                  <li>
                    • Guia não pode ter outra ficha da mesma especialidade
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lista de Guias */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando guias disponíveis...</p>
            </div>
          ) : guias.content.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {searchTerm
                  ? `Nenhuma guia encontrada para "${searchTerm}"`
                  : "Nenhuma guia disponível"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {guias.content.map((guia) => {
                const compativel = isGuiaCompativel(guia);

                return (
                  <div
                    key={guia.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedGuiaId === guia.id
                        ? "border-blue-500 bg-blue-50"
                        : compativel
                          ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                          : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                    onClick={() => compativel && setSelectedGuiaId(guia.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="radio"
                            name="guia"
                            value={guia.id}
                            checked={selectedGuiaId === guia.id}
                            onChange={() =>
                              compativel && setSelectedGuiaId(guia.id)
                            }
                            disabled={!compativel || vinculando}
                            className="text-blue-600 focus:ring-blue-500"
                          />

                          <h4 className="font-semibold text-gray-900">
                            Guia #{guia.numeroGuia}
                          </h4>

                          <StatusBadge status={guia.status} size="xs" />

                          {compativel ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <Check className="h-3 w-3 mr-1" />
                              Compatível
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              ✕ Incompatível
                            </span>
                          )}
                        </div>

                        <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Paciente:</p>
                            <p
                              className={`font-medium ${
                                guia.pacienteNome === pacienteNome
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}>
                              {guia.pacienteNome}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Especialidades:</p>
                            <div>
                              <p className="text-gray-600">Especialidades:</p>
                              <p className="font-medium">
                                {/* Proteção (guia.itens || []) caso venha nulo */}
                                {(guia.itens || []).map((item, index) => (
                                  <React.Fragment key={index}>
                                    {index > 0 && ", "}
                                    <span
                                      className={
                                        // Compara item.especialidade com a prop especialidade
                                        item.especialidade === especialidade
                                          ? "text-green-700 font-semibold"
                                          : ""
                                      }>
                                      {item.especialidade}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Validade:</p>
                            <p
                              className={`font-medium ${
                                new Date(guia.validade) < new Date()
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}>
                              {formatDate(guia.validade)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Convênio:</p>
                            <p className="font-medium">{guia.convenioNome}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Quantidade:</p>
                            <p className="font-medium">
                              {guia.quantidadeAutorizada}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Período:</p>
                            <p className="font-medium">
                              {String(guia.mes).padStart(2, "0")}/{guia.ano}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <CustomButton
                          variant="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/guias/${guia.id}`, "_blank");
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={vinculando}>
                          <Eye className="h-4 w-4" />
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {!loading && guias.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {guias.numberOfElements} de {guias.totalElements}{" "}
                guias
              </p>

              <div className="flex space-x-2">
                <CustomButton
                  variant="primary"
                  size="small"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={guias.first || loading || vinculando}>
                  Anterior
                </CustomButton>

                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {currentPage + 1} de {guias.totalPages}
                </span>

                <CustomButton
                  variant="primary"
                  size="small"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={guias.last || loading || vinculando}>
                  Próxima
                </CustomButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <CustomButton
            type="button"
            variant="primary"
            onClick={onClose}
            disabled={vinculando}>
            Cancelar
          </CustomButton>

          <CustomButton
            type="button"
            variant="primary"
            onClick={handleVincular}
            disabled={!selectedGuiaId || vinculando || loading}>
            {vinculando ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Vinculando...
              </div>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Vincular à Guia
              </>
            )}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};
