// utils/toast.ts
import toast from "react-hot-toast";

/**
 * Utilitário para exibir notificações toast na aplicação
 */
const toastUtil = {
  /**
   * Exibe uma mensagem de sucesso
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * Exibe uma mensagem de erro
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Exibe uma mensagem de informação
   */
  info: (message: string) => {
    toast(message, {
      icon: "ℹ️",
    });
  },

  /**
   * Exibe uma mensagem de alerta
   */
  warning: (message: string) => {
    toast(message, {
      icon: "⚠️",
      style: {
        border: "1px solid #ff9800",
      },
    });
  },

  /**
   * Exibe uma mensagem de carregamento que pode ser atualizada posteriormente
   * @returns id do toast para atualização
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Atualiza um toast existente
   */
  update: (
    toastId: string,
    message: string,
    type: "success" | "error" | "loading"
  ) => {
    toast.dismiss(toastId);

    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.loading(message);
    }
  },

  /**
   * Remove um toast específico
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Remove todos os toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

export default toastUtil;
