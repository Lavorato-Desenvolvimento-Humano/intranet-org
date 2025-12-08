import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { GuiaSummaryDto, StatusDto } from "@/types/clinical";
import { guiaService, statusService } from "@/services/clinical";
import { toast } from "react-hot-toast";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback para recarregar a lista pai
}

export const MassUpdateModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [guides, setGuides] = useState<GuiaSummaryDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [availableStatuses, setAvailableStatuses] = useState<StatusDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar status e focar no input ao abrir
  useEffect(() => {
    if (isOpen) {
      loadStatuses();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      resetState();
    }
  }, [isOpen]);

  const loadStatuses = async () => {
    try {
      const statuses = await statusService.getAllStatusesAtivos();
      // Ordenar status se necessário (assumindo que StatusDto tem ordemExibicao)
      statuses.sort((a, b) => (a.ordemExibicao || 0) - (b.ordemExibicao || 0));
      setAvailableStatuses(statuses);
    } catch (err) {
      console.error("Erro ao carregar status", err);
      setError("Não foi possível carregar as opções de status.");
    }
  };

  const resetState = () => {
    setInputValue("");
    setGuides([]);
    setSelectedIds(new Set());
    setTargetStatus("");
    setError(null);
    setProcessing(false);
  };

  const handleAddGuide = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setError(null);

    const codes = inputValue.split(/[\s,]+/).filter(Boolean);
    const currentIds = new Set(guides.map((g) => g.id));
    const newGuides: GuiaSummaryDto[] = [];
    const notFoundCodes: string[] = [];

    try {
      // Busca cada guia sequencialmente (pode ser otimizado com Promise.all se a API aguentar)
      for (const code of codes) {
        // Verifica se já está na lista atual para evitar chamadas desnecessárias
        const alreadyAdded = guides.some((g) => g.numeroGuia === code);
        if (alreadyAdded) continue;

        try {
          // Usa o serviço de busca existente
          const response = await guiaService.searchByNumeroGuia(code, 0, 5);

          // Encontra a correspondência exata do número
          const exactMatch = response.content.find(
            (g) => g.numeroGuia === code
          );

          if (exactMatch && !currentIds.has(exactMatch.id)) {
            newGuides.push(exactMatch);
            currentIds.add(exactMatch.id); // Evita duplicatas no mesmo lote de inserção
          } else if (!exactMatch) {
            notFoundCodes.push(code);
          }
        } catch (err) {
          console.error(`Erro ao buscar guia ${code}`, err);
          notFoundCodes.push(code);
        }
      }

      if (notFoundCodes.length > 0) {
        setError(`Guias não encontradas: ${notFoundCodes.join(", ")}`);
      }

      if (newGuides.length > 0) {
        setGuides((prev) => [...prev, ...newGuides]);
        // Auto-selecionar as novas
        setSelectedIds((prev) => {
          const next = new Set(prev);
          newGuides.forEach((g) => next.add(g.id));
          return next;
        });
        setInputValue("");
      } else if (notFoundCodes.length === 0 && codes.length > 0) {
        setError("As guias informadas já estão na lista.");
      }
    } catch (err) {
      setError("Erro ao processar as guias.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddGuide();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === guides.length && guides.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(guides.map((g) => g.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleRemoveSelected = () => {
    setGuides((prev) => prev.filter((g) => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (selectedIds.size === 0 || !targetStatus) return;

    setProcessing(true);
    try {
      await guiaService.updateGuiasStatusBulk({
        ids: Array.from(selectedIds),
        novoStatus: targetStatus,
        motivo: "Atualização em massa via interface",
        observacoes: `Alteração em lote para ${targetStatus}`,
      });

      toast.success(`${selectedIds.size} guias enviadas para atualização!`);
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao processar atualização em massa.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const allSelected = guides.length > 0 && selectedIds.size === guides.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < guides.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!processing ? onClose : undefined}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shadow-md z-10">
          <h2
            className="text-xl font-semibold text-white tracking-wide"
            id="modal-title">
            Atualização em Massa de Guias
          </h2>
          {!processing && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Input Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adicionar Guias
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || processing}
                  placeholder="Digite os números das guias (separe por vírgula ou espaço)..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm disabled:opacity-60"
                />
              </div>
              <button
                onClick={handleAddGuide}
                disabled={loading || processing || !inputValue.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <Loader2 size={18} className="animate-spin mr-1.5" />
                ) : (
                  <Plus size={18} className="mr-1.5" />
                )}
                Adicionar
              </button>
            </div>
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm animate-pulse">
                <AlertCircle size={16} className="mr-1.5" />
                {error}
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-700 font-medium flex items-center gap-2">
                Guias na Lista
                <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                  {guides.length}
                </span>
              </h3>

              {selectedIds.size > 0 && !processing && (
                <button
                  onClick={handleRemoveSelected}
                  className="text-red-500 hover:text-red-600 text-sm flex items-center px-3 py-1 rounded hover:bg-red-50 transition-colors">
                  <Trash2 size={16} className="mr-1.5" />
                  Remover Selecionados ({selectedIds.size})
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 relative bg-white shadow-sm">
              {guides.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Search size={48} strokeWidth={1} className="mb-2" />
                  <p>Nenhuma guia adicionada ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto h-full max-h-[400px]">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            disabled={processing}
                            ref={(input) => {
                              if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                          />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Código da Guia
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                          Paciente
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                          Validade
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status Atual
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {guides.map((guide) => {
                        const isSelected = selectedIds.has(guide.id);
                        return (
                          <tr
                            key={guide.id}
                            className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/60" : ""}`}
                            onClick={() =>
                              !processing && toggleSelectOne(guide.id)
                            }>
                            <td
                              className="px-6 py-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={processing}
                                onChange={() => toggleSelectOne(guide.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {guide.numeroGuia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">
                              {guide.pacienteNome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                              {/* Formatação simples de data se vier ISO */}
                              {guide.validade
                                ? new Date(guide.validade).toLocaleDateString(
                                    "pt-BR"
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                {guide.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
          <div className="w-full sm:w-auto flex items-center gap-2 text-sm text-slate-500">
            {selectedIds.size > 0 ? (
              <span>
                <strong>{selectedIds.size}</strong> guias selecionadas para
                alteração.
              </span>
            ) : (
              <span>Selecione as guias que deseja alterar.</span>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-64">
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                disabled={processing}
                className="block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-slate-900 shadow-sm bg-white disabled:opacity-60">
                <option value="" disabled>
                  Selecione o novo status
                </option>
                {availableStatuses.map((s) => (
                  <option key={s.id} value={s.status}>
                    {s.status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={selectedIds.size === 0 || !targetStatus || processing}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Salvar Mudança
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
