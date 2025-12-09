import React from "react";
import { X } from "lucide-react";

interface WrapperProps {
  children: React.ReactNode;
  onClose: () => void;
  mandatory?: boolean;
}

export const SystemModalWrapper: React.FC<WrapperProps> = ({
  children,
  onClose,
  mandatory,
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200">
      {!mandatory && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1 bg-white/80 rounded-full hover:bg-gray-100 text-neutral-dark transition-colors">
          <X size={20} />
        </button>
      )}
      {children}
    </div>
  </div>
);
