import React from "react";
import { SystemNotification } from "@/types/notification";
import { NotificationMarkdown } from "../NotificationMarkdown.tsx";
import { ArrowRight } from "lucide-react";

export const NewsContent = ({
  data,
  onDismiss,
}: {
  data: SystemNotification;
  onDismiss: () => void;
}) => (
  <>
    {data.imageUrl && (
      <div className="h-48 w-full relative bg-gray-100">
        <img
          src={data.imageUrl}
          alt={data.title}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <h2 className="absolute bottom-4 left-6 text-2xl font-bold text-white shadow-sm">
          {data.title}
        </h2>
      </div>
    )}
    <div className="p-6">
      {!data.imageUrl && (
        <h2 className="text-2xl font-bold text-primary mb-4">{data.title}</h2>
      )}

      <div className="max-h-[60vh] overflow-y-auto mb-6 custom-scrollbar">
        <NotificationMarkdown content={data.content} />
      </div>

      <button
        onClick={() => {
          if (data.actionUrl) window.open(data.actionUrl, "_blank");
          onDismiss();
        }}
        className="w-full py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2">
        {data.actionUrl ? "Confira Agora" : "Legal, entendi!"}
        {data.actionUrl && <ArrowRight size={18} />}
      </button>
    </div>
  </>
);
