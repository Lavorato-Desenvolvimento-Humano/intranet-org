// src/components/tickets/TicketTimeline.tsx
import React from "react";
import { TicketInteraction, InteractionType } from "@/types/ticket";
import { format } from "date-fns";
import { User, FileText, Bot, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ticketService } from "@/services/ticket";
interface TicketTimelineProps {
  interactions: TicketInteraction[];
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({
  interactions,
}) => {
  const { user } = useAuth();

  const handleDownload = async (path: string | undefined, content: string) => {
    if (!path) return;

    // Tenta extrair um nome de arquivo limpo, ou usa o conteúdo como fallback
    // O backend gera algo como "uuid_nomeOriginal.pdf"
    const fileName = path.split("/").pop() || "anexo";

    await ticketService.downloadAttachment(path, fileName);
  };

  return (
    <div className="space-y-6 p-4">
      {interactions.map((item) => {
        const isMe = user?.id === item.userId;
        const isSystem = item.type === InteractionType.SYSTEM_LOG;
        const isAttachment = item.type === InteractionType.ATTACHMENT;

        // 1. Logs de Sistema
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

        // 2. Chat Bubble (Comentários e Anexos)
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
                {item.userProfileImage ? (
                  <img
                    src={item.userProfileImage}
                    alt=""
                    className="rounded-full h-8 w-8"
                  />
                ) : (
                  item.userName?.charAt(0) || <User size={14} />
                )}
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
                    {item.userName || "Usuário"} {/* Ajustado DTO */}
                  </span>
                  <span className="text-gray-400 mx-2">
                    {format(new Date(item.createdAt), "HH:mm")}
                  </span>
                </div>

                {/* Conteúdo */}
                {isAttachment ? (
                  <div className="flex items-center p-2 bg-white border border-gray-200 rounded mt-1 max-w-[250px]">
                    <div className="bg-primary/10 p-2 rounded mr-3">
                      <FileText className="text-primary" size={24} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p
                        className="text-xs text-gray-500 mb-1 truncate"
                        title={item.content}>
                        {item.content}
                      </p>

                      <button
                        onClick={() =>
                          handleDownload(item.attachmentUrl, item.content)
                        }
                        className="text-primary hover:text-primary-dark hover:underline text-xs flex items-center font-medium transition-colors"
                        type="button">
                        <Download size={12} className="mr-1" />
                        Baixar Arquivo
                      </button>
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
