"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketInteraction, TicketStatus } from "@/types/ticket";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import {
  Loader2,
  Send,
  Paperclip,
  CheckCircle,
  PlayCircle,
  X,
  Image as ImageIcon, // Novos ícones
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { RateTicketModal } from "@/components/tickets/RateTicketModal"; // Verifique se o caminho está correto

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = Number(params.id);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [interactions, setInteractions] = useState<TicketInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Chat
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  // --- ESTADOS PARA O CTRL + V ---
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Referência para o input hidden

  // Modal de Avaliação
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [ticketId]);

  const loadData = async () => {
    try {
      const [ticketData, timelineData] = await Promise.all([
        ticketService.getById(ticketId),
        ticketService.getTimeline(ticketId),
      ]);
      setTicket(ticketData);
      setInteractions(timelineData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes do chamado");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DO PASTE (CTRL + V) ---
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Impede colar o binário como texto

        const file = item.getAsFile();
        if (file) {
          setAttachment(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          toast.success("Imagem colada! Clique em enviar.");
        }
        return;
      }
    }
  };

  // Lógica para Upload via Botão (Clipe)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!comment.trim() && !attachment) return;

    setSending(true);
    try {
      // Envia texto + anexo (se houver)
      const newInteraction = await ticketService.addComment(
        ticketId,
        comment,
        attachment
      );

      setInteractions((prev) => [...prev, newInteraction]);

      // Limpa tudo
      setComment("");
      removeAttachment();
      toast.success("Resposta enviada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar resposta");
    } finally {
      setSending(false);
    }
  };

  // Ações de Workflow
  const handleClaim = async () => {
    try {
      const updated = await ticketService.claim(ticketId);
      setTicket(updated);
      toast.success("Você assumiu este chamado");
      loadData(); // Recarrega timeline para ver o log
    } catch (error) {
      toast.error("Erro ao assumir chamado");
    }
  };

  const handleResolve = async () => {
    try {
      const updated = await ticketService.resolve(ticketId);
      setTicket(updated);
      toast.success("Chamado resolvido!");
      loadData();
    } catch (error) {
      toast.error("Erro ao resolver chamado");
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!ticket) return <div className="p-8">Chamado não encontrado</div>;

  const isResolved =
    ticket.status === TicketStatus.RESOLVED ||
    ticket.status === TicketStatus.CLOSED;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Cabeçalho */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-800">
              #{ticket.id} - {ticket.title}
            </h1>
            <span
              className={`px-2 py-1 rounded text-xs font-bold text-white 
              ${
                ticket.status === "OPEN"
                  ? "bg-blue-500"
                  : ticket.status === "RESOLVED"
                    ? "bg-green-500"
                    : "bg-gray-500"
              }`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-gray-500">
            {ticket.requesterName} •{" "}
            {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Botões de Ação (Workflow) */}
        <div className="flex gap-2">
          {ticket.status === TicketStatus.OPEN && !ticket.assigneeId && (
            <button
              onClick={handleClaim}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <PlayCircle size={18} /> Assumir Chamado
            </button>
          )}

          {ticket.status === TicketStatus.IN_PROGRESS && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <CheckCircle size={18} /> Resolver Chamado
            </button>
          )}

          {/* Botão de Avaliar (Para o usuário logado se for o dono) */}
          {ticket.status === TicketStatus.RESOLVED && (
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
              Avaliar Atendimento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Timeline e Chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição Original */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">
              Descrição da Solicitação
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Timeline Component */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-[500px] overflow-y-auto">
            <TicketTimeline interactions={interactions} />
          </div>

          {/* Área de Resposta (Input) */}
          {!isResolved && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {/* --- PREVIEW DA IMAGEM --- */}
              {attachment && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      {/* Se for imagem mostra o thumb, senão icone */}
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded border border-blue-200 bg-white"
                        />
                      ) : (
                        <Paperclip className="h-10 w-10 text-blue-400 p-2 bg-white rounded border" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeAttachment}
                    className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendComment} className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onPaste={handlePaste} // <--- EVENTO DE COLAR
                  placeholder="Escreva uma resposta ou cole uma imagem (Ctrl+V)..."
                  className="w-full p-4 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-32"
                  disabled={sending}
                />

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {/* Input de Arquivo Escondido */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Botão de Anexo (Clipe) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                    title="Anexar arquivo">
                    <Paperclip size={20} />
                  </button>

                  {/* Botão Enviar */}
                  <button
                    type="submit"
                    disabled={sending || (!comment.trim() && !attachment)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
                    {sending ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </form>
              <p className="text-xs text-gray-400 mt-2 text-right">
                Dica: Você pode colar prints diretamente na área de texto.
              </p>
            </div>
          )}
        </div>

        {/* Coluna Lateral: Detalhes */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">
              Detalhes
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block">Prioridade</span>
                <span
                  className={`font-medium ${
                    ticket.priority === "CRITICAL"
                      ? "text-red-600"
                      : ticket.priority === "HIGH"
                        ? "text-orange-500"
                        : "text-green-600"
                  }`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Equipe Responsável</span>
                <span className="font-medium text-gray-800">
                  {ticket.targetTeamNome || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Técnico</span>
                <span className="font-medium text-gray-800">
                  {ticket.assigneeName || "Não atribuído"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Prazo (SLA)</span>
                <span
                  className={`font-medium ${new Date(ticket.dueDate!) < new Date() ? "text-red-500" : "text-gray-800"}`}>
                  {ticket.dueDate
                    ? format(new Date(ticket.dueDate), "dd/MM/yyyy HH:mm")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Avaliação */}
      <RateTicketModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        ticketId={ticket.id}
        onSuccess={() => {
          loadData();
          setIsRateModalOpen(false);
        }}
      />
    </div>
  );
}
