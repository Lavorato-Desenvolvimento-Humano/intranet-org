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
import { StatusDto } from "@/types/clinical";
import { fichaService, guiaService, statusService } from "@/services/clinical";
import { toast } from "react-hot-toast";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface ClinicalItem {
  id: string;
  code: string;
  patientName: string;
  status: string;
  type: "GUIA" | "FICHA";
  date?: string;
}

export const MassUpdateModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [inputValue, setInputValue] = useState("");
  // Estado unificado para itens (Guias e Fichas)
  const [items, setItems] = useState<ClinicalItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [availableStatuses, setAvailableStatuses] = useState<StatusDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

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
      statuses.sort((a, b) => (a.ordemExibicao || 0) - (b.ordemExibicao || 0));
      setAvailableStatuses(statuses);
    } catch (err) {
      console.error("Erro ao carregar status", err);
      setError("Não foi possível carregar as opções de status.");
    }
  };

  const resetState = () => {
    setInputValue("");
    setItems([]);
    setSelectedIds(new Set());
    setTargetStatus("");
    setError(null);
    setProcessing(false);
  };

  const handleAddItems = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setError(null);

    const codes = inputValue.split(/[\s,]+/).filter(Boolean);
    // Usa 'items' aqui para verificar duplicatas
    const currentCodes = new Set(items.map((i) => i.code));

    const newItems: ClinicalItem[] = [];
    const notFoundCodes: string[] = [];

    // Processamento sequencial
    for (const code of codes) {
      if (currentCodes.has(code)) continue; // Pula se já estiver na lista

      let found = false;

      // 1. Tenta buscar como GUIA
      try {
        const guiaRes = await guiaService.searchByNumeroGuia(code, 0, 5);
        const guia = guiaRes.content.find((g) => g.numeroGuia === code);

        if (guia) {
          newItems.push({
            id: guia.id,
            code: guia.numeroGuia,
            patientName: guia.pacienteNome,
            status: guia.status,
            type: "GUIA",
            date: guia.validade,
          });
          found = true;
        }
      } catch (e) {
        console.error(e);
      }

      // 2. Se não achou guia, tenta buscar como FICHA
      if (!found) {
        try {
          const fichaRes = await fichaService.searchByCodigoFicha(code, 0, 5);
          const ficha = fichaRes.content.find((f) => f.codigoFicha === code);

          if (ficha) {
            newItems.push({
              id: ficha.id,
              code: ficha.codigoFicha,
              patientName: ficha.pacienteNome,
              status: ficha.status,
              type: "FICHA",
              date: ficha.createdAt,
            });
            found = true;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (!found) notFoundCodes.push(code);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      // Auto-selecionar novos itens
      setSelectedIds((prev) => {
        const next = new Set(prev);
        newItems.forEach((i) => next.add(i.id));
        return next;
      });
      setInputValue("");
    }

    if (notFoundCodes.length > 0) {
      setError(`Não encontrado: ${notFoundCodes.join(", ")}`);
    } else if (newItems.length === 0 && codes.length > 0) {
      setError("Os códigos informados já estão na lista.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItems();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
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
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    setProcessing(true);

    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    const guiasIds = selectedItems
      .filter((i) => i.type === "GUIA")
      .map((i) => i.id);
    const fichasIds = selectedItems
      .filter((i) => i.type === "FICHA")
      .map((i) => i.id);

    try {
      const promises = [];

      if (guiasIds.length > 0) {
        promises.push(
          guiaService.updateGuiasStatusBulk({
            ids: guiasIds,
            novoStatus: targetStatus,
            motivo: "Atualização em massa",
            observacoes: "Via Painel",
          })
        );
      }

      if (fichasIds.length > 0) {
        promises.push(
          fichaService.updateFichasStatusBulk({
            ids: fichasIds,
            novoStatus: targetStatus,
            motivo: "Atualização em massa",
            observacoes: "Via Painel",
          })
        );
      }

      await Promise.all(promises);
      toast.success("Atualização realizada com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      setError("Erro ao atualizar. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < items.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true">
      <div
        className="absolute inset-0 bg-neutral-dark/60 backdrop-blur-sm transition-opacity"
        onClick={!processing ? onClose : undefined}></div>

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200">
        {/* Header - Cor Primária */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-md z-10">
          <h2
            className="text-xl font-semibold text-white tracking-wide"
            id="modal-title">
            Atualização em Massa
          </h2>
          {!processing && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Input Section */}
          <div className="bg-neutral-light/10 p-4 rounded-lg border border-neutral-light/30">
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Adicionar Guias ou Fichas
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-medium" />
                </div>
                {/* Correção de COR DO TEXTO aqui (text-neutral-dark) */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || processing}
                  placeholder="Digite números de guias ou códigos de fichas..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-neutral-light/50 rounded-md leading-5 bg-white text-neutral-dark placeholder-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow shadow-sm disabled:opacity-60"
                />
              </div>
              <button
                onClick={handleAddItems}
                disabled={loading || processing || !inputValue.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <Loader2 size={18} className="animate-spin mr-1.5" />
                ) : (
                  <Plus size={18} className="mr-1.5" />
                )}
                Adicionar
              </button>
            </div>
            {error && (
              <div className="mt-2 flex items-center text-red-500 text-sm animate-pulse">
                <AlertCircle size={16} className="mr-1.5" />
                {error}
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-neutral-dark font-medium flex items-center gap-2">
                Itens na Lista
                <span className="bg-neutral-light/20 text-neutral-dark text-xs px-2 py-0.5 rounded-full">
                  {items.length}
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

            <div className="border border-neutral-light/30 rounded-lg overflow-hidden flex-1 relative bg-white shadow-sm">
              {items.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-medium opacity-60">
                  <Search size={48} strokeWidth={1} className="mb-2" />
                  <p>Nenhum item adicionado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto h-full max-h-[400px]">
                  <table className="min-w-full divide-y divide-neutral-light/20">
                    <thead className="bg-neutral-light/10 sticky top-0 z-10">
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
                            className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded cursor-pointer disabled:opacity-50"
                          />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-neutral-dark uppercase tracking-wider">
                          Tipo
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-neutral-dark uppercase tracking-wider">
                          Código
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-neutral-dark uppercase tracking-wider hidden sm:table-cell">
                          Paciente
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-neutral-dark uppercase tracking-wider hidden md:table-cell">
                          Data Ref.
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold text-neutral-dark uppercase tracking-wider">
                          Status Atual
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-light/20">
                      {items.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                              isSelected ? "bg-primary/10" : ""
                            }`}
                            onClick={() =>
                              !processing && toggleSelectOne(item.id)
                            }>
                            <td
                              className="px-6 py-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={processing}
                                onChange={() => toggleSelectOne(item.id)}
                                className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded cursor-pointer disabled:opacity-50"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.type === "GUIA" ? (
                                <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-1 rounded-full font-medium">
                                  GUIA
                                </span>
                              ) : (
                                <span className="bg-neutral-light/20 text-neutral-dark border border-neutral-medium/20 text-xs px-2 py-1 rounded-full font-medium">
                                  FICHA
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-dark">
                              {item.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium hidden sm:table-cell">
                              {item.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium hidden md:table-cell">
                              {item.date
                                ? new Date(item.date).toLocaleDateString(
                                    "pt-BR"
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-light/10 text-neutral-dark border border-neutral-light/30">
                                {item.status}
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
        <div className="bg-neutral-light/5 border-t border-neutral-light/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
          <div className="w-full sm:w-auto flex items-center gap-2 text-sm text-neutral-medium">
            {selectedIds.size > 0 ? (
              <span>
                <strong>{selectedIds.size}</strong> itens selecionados para
                alteração.
              </span>
            ) : (
              <span>Selecione os itens que deseja alterar.</span>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-64">
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                disabled={processing}
                className="block w-full pl-3 pr-10 py-2.5 text-base border-neutral-light/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-neutral-dark shadow-sm bg-white disabled:opacity-60">
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
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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
