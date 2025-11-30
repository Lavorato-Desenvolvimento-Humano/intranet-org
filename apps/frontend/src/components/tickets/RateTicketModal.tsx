// src/components/tickets/RateTicketModal.tsx
import React, { useState } from "react";
import { Star, X, Loader2, MessageSquare } from "lucide-react";
import toast from "@/utils/toast";
import { ticketService } from "@/services/ticket";

interface RateTicketModalProps {
  ticketId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RateTicketModal: React.FC<RateTicketModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    try {
      setIsSubmitting(true);
      await ticketService.rate(ticketId, rating, comment);
      toast.success("Obrigado pela sua avaliação!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Avaliar Atendimento</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 flex flex-col items-center space-y-6">
          <div className="text-center space-y-2">
            <h4 className="text-lg font-medium text-gray-700">
              Como foi sua experiência?
            </h4>
            <p className="text-sm text-gray-500">
              Sua opinião é fundamental para melhorarmos.
            </p>
          </div>

          {/* Estrelas */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}>
                <Star
                  size={32}
                  className={`${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-100 text-gray-300"
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>

          {/* Label da Nota */}
          <div className="h-6 text-sm font-medium text-primary">
            {rating === 1 && "Muito Insatisfeito 😠"}
            {rating === 2 && "Insatisfeito 😕"}
            {rating === 3 && "Neutro 😐"}
            {rating === 4 && "Satisfeito 🙂"}
            {rating === 5 && "Muito Satisfeito! 🤩"}
          </div>

          {/* Comentário */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">
              Comentário (Opcional)
            </label>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte-nos mais sobre o atendimento..."
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                rows={3}
              />
              <MessageSquare
                className="absolute right-3 bottom-3 text-gray-300"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Avaliação"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
