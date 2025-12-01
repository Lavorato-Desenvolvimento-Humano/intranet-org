"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketInteraction, TicketStatus } from "@/types/ticket";
import {
  MessageCircle,
  X,
  Loader2,
  ChevronLeft,
  Send,
  Paperclip,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Importações do WebSocket
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

export function FloatingSupportWidget() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"LIST" | "CHAT">("LIST");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

  // Dados
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [interactions, setInteractions] = useState<TicketInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  // Input Chat
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref para o cliente WebSocket
  const stompClientRef = useRef<Client | null>(null);

  // --- CONTROLE DE VISIBILIDADE ---
  const shouldRender = () => {
    if (!user) return false;
    if (pathname === "/") return false;
    if (pathname.startsWith("/auth")) return false;
    return true;
  };

  // 1. Carregar Tickets ao abrir a lista
  useEffect(() => {
    if (isOpen && view === "LIST") {
      loadMyOpenTickets();
      disconnectWebSocket();
    }
  }, [isOpen, view]);

  // 2. Carregar Chat e Conectar WebSocket ao entrar no ticket
  useEffect(() => {
    if (activeTicketId && view === "CHAT") {
      loadChat(activeTicketId);
      connectWebSocket(activeTicketId);
    }
    // Cleanup ao sair do chat ou desmontar
    return () => disconnectWebSocket();
  }, [activeTicketId, view]);

  // 3. Auto-scroll
  useEffect(() => {
    if (view === "CHAT") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [interactions, view, previewUrl]);

  // --- LÓGICA DO WEBSOCKET (Baseada no useTicket.ts) ---
  const connectWebSocket = (ticketId: number) => {
    if (typeof window === "undefined") return;

    // Lógica robusta que funciona em produção e localhost
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.host;
    let socketUrl = `${protocol}//${host}/ws`;

    // Override para desenvolvimento local
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      socketUrl = "http://localhost:8080/ws";
    }

    // Se já existe conexão ativa, não recria
    if (stompClientRef.current && stompClientRef.current.active) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/tickets/${ticketId}`, (message: IMessage) => {
          if (message.body) {
            try {
              const newInteraction: TicketInteraction = JSON.parse(
                message.body
              );

              setInteractions((prev) => {
                // Evita duplicatas
                if (prev.some((i) => i.id === newInteraction.id)) return prev;
                return [...prev, newInteraction];
              });
            } catch (e) {
              console.error("Erro ao processar mensagem do WebSocket", e);
            }
          }
        });
      },

      // Remove logs excessivos em produção, mas mantém erros críticos
      onStompError: (frame) => {
        console.error("Broker error: " + frame.headers["message"]);
        console.error("Details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      if (stompClientRef.current.active) {
        stompClientRef.current.deactivate();
      }
      stompClientRef.current = null;
    }
  };

  // --- DOWNLOAD DE ANEXO ---
  const handleDownload = async (
    path: string | undefined,
    originalName: string
  ) => {
    if (!path) return;
    try {
      const fileName = originalName || path.split("/").pop() || "arquivo";
      await ticketService.downloadAttachment(path, fileName);
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const loadMyOpenTickets = async () => {
    setLoading(true);
    try {
      const all = await ticketService.getAll({ requesterId: "me" });
      const openOnly = all.filter(
        (t: Ticket) =>
          t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED
      );
      setMyTickets(openOnly);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (id: number) => {
    setLoading(true);
    try {
      const timeline = await ticketService.getTimeline(id);
      setInteractions(timeline);
    } catch (error) {
      toast.error("Erro ao carregar chat");
      setView("LIST");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setAttachment(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
        return;
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!comment.trim() && !attachment) || !activeTicketId) return;

    setSending(true);
    try {
      // Envia via API; o WebSocket vai receber a notificação e atualizar a UI
      await ticketService.addComment(activeTicketId, comment, attachment);

      setComment("");
      setAttachment(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  const selectTicket = (id: number) => {
    setActiveTicketId(id);
    setView("CHAT");
  };

  const goBack = () => {
    setActiveTicketId(null);
    setView("LIST");
    setInteractions([]);
  };

  if (!shouldRender()) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans print:hidden">
      {/* --- JANELA DO WIDGET --- */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mb-2">
          {/* HEADER */}
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between shrink-0">
            {view === "CHAT" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  className="hover:bg-blue-700 p-1 rounded-full transition">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3 className="font-bold text-sm">
                    Ticket #{activeTicketId}
                  </h3>
                  <p className="text-xs text-blue-100">Atendimento Online</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-lg">Suporte</h3>
                <p className="text-xs text-blue-100">Seus chamados em aberto</p>
              </div>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto bg-gray-50 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            )}

            {/* VIEW: LISTA DE TICKETS */}
            {view === "LIST" && (
              <div className="p-2 space-y-2">
                {myTickets.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center p-6">
                    <AlertCircle size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">Você não tem chamados em aberto.</p>
                    <a
                      href="/tickets/novo"
                      className="mt-4 text-blue-600 text-sm font-medium hover:underline">
                      Abrir novo chamado
                    </a>
                  </div>
                ) : (
                  myTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => selectTicket(ticket.id)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                          #{ticket.id} - {ticket.title}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${ticket.status === "OPEN" ? "bg-blue-500" : "bg-purple-500"}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>
                          {format(new Date(ticket.createdAt), "dd/MM HH:mm")}
                        </span>
                        <span>
                          {ticket.assigneeName
                            ? "Em atendimento"
                            : "Aguardando"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VIEW: CHAT */}
            {view === "CHAT" && (
              <div className="p-4 space-y-4">
                {interactions.map((msg) => {
                  const isMe = msg.userId === user?.id;
                  const isSystem = msg.type === "SYSTEM_LOG";
                  if (isSystem)
                    return (
                      <div
                        key={msg.id}
                        className="text-center text-[10px] text-gray-400 my-2 italic">
                        {msg.content}
                      </div>
                    );

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-700 border border-gray-200 rounded-bl-none"
                        }`}>
                        {msg.type === "ATTACHMENT" ? (
                          <div
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isMe ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
                            onClick={() =>
                              handleDownload(msg.attachmentUrl, msg.content)
                            }
                            title="Clique para baixar">
                            <div
                              className={`p-2 rounded ${isMe ? "bg-white/20" : "bg-white"}`}>
                              <FileText
                                size={20}
                                className={
                                  isMe ? "text-white" : "text-gray-500"
                                }
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="truncate font-medium text-xs max-w-[120px]">
                                {msg.content}
                              </span>
                              <span className="text-[10px] flex items-center gap-1 opacity-80">
                                <Download size={10} /> Baixar
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <span
                          className={`text-[10px] block mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* FOOTER (INPUT DO CHAT) */}
          {view === "CHAT" && (
            <div className="p-3 bg-white border-t border-gray-100">
              {/* Preview Anexo */}
              {attachment && (
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg mb-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <Paperclip size={16} />
                    )}
                    <span className="truncate max-w-[180px]">
                      {attachment.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAttachment(null);
                      setPreviewUrl(null);
                    }}>
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <textarea
                    className="w-full bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-24 min-h-[40px]"
                    placeholder="Mensagem..."
                    rows={1}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onPaste={handlePaste}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-3 bottom-2 text-gray-400 hover:text-blue-600">
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAttachment(e.target.files[0]);
                        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || (!comment && !attachment)}
                  className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition">
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- BOTÃO FLUTUANTE (FAB) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-[9999]
        ${isOpen ? "bg-gray-700 text-white rotate-90" : "bg-blue-600 text-white"}`}>
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageCircle size={28} />
            {myTickets.length > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-blue-600 animate-pulse"></span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
