// hooks/useViewport.ts
import { useState, useEffect } from "react";

export type Viewport = "mobile" | "tablet" | "desktop";

export function useViewport(): Viewport {
  // Define breakpoints (alinhados com Tailwind)
  const mobileBreakpoint = 768; // md
  const tabletBreakpoint = 1024; // lg

  // Estado padrão é desktop para evitar incompatibilidade com SSR
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    // Função para atualizar o estado com base na largura da janela
    const updateViewport = () => {
      const width = window.innerWidth;
      if (width < mobileBreakpoint) {
        setViewport("mobile");
      } else if (width < tabletBreakpoint) {
        setViewport("tablet");
      } else {
        setViewport("desktop");
      }
    };

    // Define o valor inicial
    updateViewport();

    // Adiciona event listener para resize
    window.addEventListener("resize", updateViewport);

    // Cleanup
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return viewport;
}
