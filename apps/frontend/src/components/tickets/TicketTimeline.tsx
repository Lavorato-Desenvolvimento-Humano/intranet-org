// src/components/tickets/TicketTimeline.tsx
import React from "react";
import { TicketInteraction, InteractionType } from "@/types/ticket";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, FileText, Bot } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Assumindo contexto de auth

interface TicketTimelineProps {
  interactions: TicketInteraction[];
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({
  interactions,
}) => {
  const { user } = useAuth(); // Para alinhar minhas mensagens à direita

  return (
    <div className="space-y-6 p-4">
      {interactions.map((item) => {
        const isMe = user?.id === item.userId;
        const isSystem = item.type === InteractionType.SYSTEM_LOG;
        const isAttachment = item.type === InteractionType.ATTACHMENT;

        // 1. Logs de Sistema (Centralizados, cinza)
        if (isSystem) {
          return (
            <div key={item.id} className="flex justify-center my-4">
              <span className="bg-gray-100 text-gray-500 text-xs py-1 px-3 rounded-full flex items-center">
                <Bot size={12} className="mr-1" />
                {item.content} -{" "}
                {format(new Date(item.createdAt), "dd/MM HH:mm")}
              </span>
            </div>
          );
        }

        // 2. Comentários e Anexos (Chat Bubble)
        return (
          <div
            key={item.id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${isMe ? "bg-primary ml-2" : "bg-gray-400 mr-2"}`}>
                {item.userName?.charAt(0) || <User size={14} />}
              </div>

              {/* Balão */}
              <div
                className={`p-3 rounded-lg shadow-sm text-sm 
                ${
                  isMe
                    ? "bg-blue-50 border border-blue-100 text-gray-800 rounded-tr-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                }`}>
                {/* Cabeçalho do Balão */}
                <div
                  className={`flex justify-between items-center mb-1 text-xs ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="font-bold text-gray-700">
                    {item.userName}
                  </span>
                  <span className="text-gray-400 mx-2">
                    {format(new Date(item.createdAt), "HH:mm")}
                  </span>
                </div>

                {/* Conteúdo */}
                {isAttachment ? (
                  <div className="flex items-center p-2 bg-gray-50 border rounded mt-1">
                    <FileText className="text-primary mr-2" size={20} />
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{item.content}</p>
                      <a
                        href={`/api/files/download?path=${item.attachmentUrl}`} // Ajustar rota de download real
                        target="_blank"
                        className="text-primary hover:underline text-xs">
                        Baixar Anexo
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{item.content}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
