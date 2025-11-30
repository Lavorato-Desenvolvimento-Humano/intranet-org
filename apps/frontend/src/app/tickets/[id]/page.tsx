"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTicket } from "@/hooks/useTicket";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { TicketStatus, TicketPriority } from "@/types/ticket";
import {
  Loader2,
  Send,
  ArrowLeft,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Clock,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { RateTicketModal } from "@/components/tickets/RateTicketModal";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params.id);
  const { user } = useAuth();
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const {
    ticket,
    interactions,
    loading,
    addComment,
    claimTicket,
    resolveTicket,
    refresh,
  } = useTicket(ticketId);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll para o fim do chat ao carregar ou receber msg
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interactions]);

  const handleSend = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    const success = await addComment(commentText);
    if (success) setCommentText("");
    setSending(false);
  };

  // Funções de UI Auxiliares
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

  // Helper para renderizar estrelas estáticas (leitura)
  const renderStaticStars = (rating: number) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!ticket) return null;

  // Verifica se sou o dono do ticket
  const isRequester = user?.id === ticket.requester.id;

  // Verifica se pode avaliar (Resolvido e sou o dono)
  const canRate = ticket.status === TicketStatus.RESOLVED && isRequester;

  return (
    <div className="container mx-auto py-6 max-w-5xl h-[calc(100vh-80px)] flex flex-col">
      {/* 1. Header do Chamado */}
      <div className="bg-white p-4 rounded-lg shadow-sm border-b border-gray-200 mb-4 flex justify-between items-start">
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
            Equipe:{" "}
            <span className="font-medium">{ticket.targetTeam?.nome}</span> •
            Aberto por:{" "}
            <span className="font-medium">{ticket.requester.fullName}</span>
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          {ticket.status === TicketStatus.OPEN && !ticket.assignee && (
            <button
              onClick={claimTicket}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              <UserPlus size={16} className="mr-2" />
              Assumir Chamado
            </button>
          )}

          {ticket.status === TicketStatus.IN_PROGRESS && (
            <button
              onClick={resolveTicket}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
              <CheckCircle size={16} className="mr-2" />
              Resolver
            </button>
          )}

          {/* BOTÃO DE AVALIAR (Novo) */}
          {canRate && (
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition shadow-sm animate-pulse">
              <Star size={16} className="mr-2 fill-white" />
              Avaliar Atendimento
            </button>
          )}

          {/* EXIBIÇÃO DA NOTA (Se já fechado) */}
          {ticket.status === TicketStatus.CLOSED && ticket.rating && (
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs text-gray-500 font-bold uppercase mb-1">
                Avaliação do Usuário
              </span>
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <span className="font-bold text-yellow-700 mr-2">
                  {ticket.rating}.0
                </span>
                {renderStaticStars(ticket.rating)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* 2. Área Principal (Descrição + Chat) */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Descrição Fixa */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Descrição do Problema
            </h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Timeline Scrollável */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <TicketTimeline interactions={interactions} />
            <div ref={bottomRef} />
          </div>

          {/* Input de Chat */}
          {ticket.status !== TicketStatus.CLOSED && (
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário ou resposta..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-12 md:h-20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !commentText.trim()}
                  className="px-4 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center">
                  {sending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Sidebar (Detalhes Técnicos) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">
            Detalhes do SLA
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">
                Prioridade
              </span>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-bold border 
                ${
                  ticket.priority === TicketPriority.CRITICAL
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700"
                }`}>
                {ticket.priority}
              </span>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">
                Vencimento (SLA)
              </span>
              <div className="flex items-center text-sm text-gray-700">
                <Clock size={14} className="mr-2 text-gray-400" />
                {ticket.dueDate
                  ? format(new Date(ticket.dueDate), "dd/MM/yyyy HH:mm")
                  : "N/A"}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">
                Atendente Atual
              </span>
              <div className="flex items-center mt-1">
                {ticket.assignee ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2">
                      {ticket.assignee.fullName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">
                      {ticket.assignee.fullName}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    Aguardando técnico
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">
                Criado em
              </span>
              <span className="text-sm text-gray-600">
                {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE AVALIAÇÃO */}
      <RateTicketModal
        ticketId={ticket.id}
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
