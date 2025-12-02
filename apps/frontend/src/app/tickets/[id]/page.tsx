"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTicket } from "@/hooks/useTicket"; // <--- Usando seu hook
import { TicketStatus, TicketPriority } from "@/types/ticket";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { RateTicketModal } from "@/components/tickets/RateTicketModal";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  Send,
  ArrowLeft,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Clock,
  Star,
  Paperclip,
  PlayCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params.id);
  const { user } = useAuth();

  // Hook que gerencia WebSocket e Dados
  const {
    ticket,
    interactions,
    loading,
    addComment,
    claimTicket,
    resolveTicket,
    refresh,
  } = useTicket(ticketId);

  // Estados locais apenas para UI (Inputs e Modais)
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll automático para o fim do chat
  useEffect(() => {
    if (interactions.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [interactions]);

  // --- LÓGICA DO PASTE (CTRL + V) ---
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          toast.success("Imagem colada! Clique em enviar.");
        }
        return;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim() && !selectedFile) return;

    setSending(true);
    // Usa a função do Hook
    const success = await addComment(commentText, selectedFile);

    if (success) {
      setCommentText("");
      removeAttachment();
    }
    setSending(false);
  };

  // Helper de UI
  const getStatusBadge = (status: TicketStatus) => {
    const styles = {
      [TicketStatus.OPEN]: "bg-blue-100 text-blue-800",
      [TicketStatus.IN_PROGRESS]: "bg-purple-100 text-purple-800",
      [TicketStatus.RESOLVED]: "bg-green-100 text-green-800",
      [TicketStatus.CLOSED]: "bg-gray-100 text-gray-800",
      [TicketStatus.WAITING]: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  const renderStaticStars = (rating: number) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-600">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!ticket)
    return (
      <div className="p-8 text-center text-gray-500">
        Chamado não encontrado
      </div>
    );

  const isRequester = user?.id === ticket.requesterId;
  const canRate = ticket.status === TicketStatus.RESOLVED && isRequester;
  const isClosedOrResolved =
    ticket.status === TicketStatus.RESOLVED ||
    ticket.status === TicketStatus.CLOSED;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl h-[calc(100vh-80px)] flex flex-col">
      {/* 1. Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border-b border-gray-200 mb-4 flex justify-between items-start shrink-0">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center text-sm">
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">
              #{ticket.id} - {ticket.title}
            </h1>
            {getStatusBadge(ticket.status)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.requesterName} •{" "}
            {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {ticket.status === TicketStatus.OPEN && !ticket.assigneeId && (
            <button
              onClick={claimTicket}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              <UserPlus size={16} className="mr-2" /> Assumir
            </button>
          )}
          {ticket.status === TicketStatus.IN_PROGRESS && (
            <button
              onClick={resolveTicket}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
              <CheckCircle size={16} className="mr-2" /> Resolver
            </button>
          )}
          {canRate && (
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition animate-pulse">
              <Star size={16} className="fill-white" /> Avaliar
            </button>
          )}
          {ticket.status === TicketStatus.CLOSED && ticket.rating && (
            <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                Avaliação
              </span>
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                <span className="font-bold text-yellow-700 mr-2 text-xs">
                  {ticket.rating}.0
                </span>
                {renderStaticStars(ticket.rating)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0">
        {/* 2. Área Principal (Descrição + Chat) */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 h-full">
          {/* Descrição */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0 max-h-48 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Descrição
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">
              {ticket.description}
            </p>
          </div>

          {/* Timeline Scrollável */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            <TicketTimeline interactions={interactions} />
            <div ref={bottomRef} />
          </div>

          {/* Input de Chat */}
          {!isClosedOrResolved && (
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              {/* Preview Anexo */}
              {selectedFile && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded-lg w-fit max-w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <Paperclip size={16} className="text-blue-500" />
                    )}
                    <span className="text-sm text-blue-900 truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={removeAttachment}
                    className="ml-2 text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="relative flex gap-2 items-end">
                <div className="relative flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Escreva uma resposta..."
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[50px] max-h-32"
                    rows={1}
                    disabled={sending}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-3 bottom-3 text-gray-400 hover:text-blue-600">
                    <Paperclip size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending || (!commentText.trim() && !selectedFile)}
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition shrink-0">
                  {sending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                Ctrl+V para colar imagens
              </p>
            </div>
          )}
        </div>

        {/* 3. Sidebar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
            Detalhes
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Prioridade</span>
              <span
                className={`font-medium ${ticket.priority === "CRITICAL" ? "text-red-600" : "text-gray-800"}`}>
                {ticket.priority}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Equipe</span>
              <span className="font-medium text-gray-800">
                {ticket.targetTeamNome}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Técnico</span>
              <div className="flex items-center gap-2 mt-1">
                {ticket.assigneeId ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {ticket.assigneeName?.charAt(0)}
                    </div>
                    <span>{ticket.assigneeName}</span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">--</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">SLA</span>
              <span
                className={`font-medium ${ticket.dueDate && new Date(ticket.dueDate) < new Date() ? "text-red-500" : "text-gray-800"}`}>
                {ticket.dueDate
                  ? format(new Date(ticket.dueDate), "dd/MM/yyyy HH:mm")
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <RateTicketModal
        ticketId={ticket.id}
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onSuccess={() => {
          refresh();
          setIsRateModalOpen(false);
        }}
      />
    </div>
  );
}
