import React from "react";
import { SystemNotification } from "@/types/notification";
import { NotificationMarkdown } from "../NotificationMarkdown.tsx";
import { AlertTriangle } from "lucide-react";

export const AnnouncementContent = ({
  data,
  onDismiss,
}: {
  data: SystemNotification;
  onDismiss: () => void;
}) => (
  <div className="p-6 text-center">
    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-600 animate-bounce">
      <AlertTriangle size={32} />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">{data.title}</h2>

    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-left text-sm text-gray-700 mb-6">
      <NotificationMarkdown content={data.content} />
    </div>

    <button
      onClick={onDismiss}
      className="w-full py-3 bg-neutral-dark hover:bg-gray-700 text-white font-medium rounded-lg transition-colors">
      {data.mandatory ? "Li e Concordo" : "Dispensar Aviso"}
    </button>
  </div>
);
