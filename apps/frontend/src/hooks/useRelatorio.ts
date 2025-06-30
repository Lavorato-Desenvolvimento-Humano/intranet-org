// apps/frontend/src/hooks/useRelatorio.ts

import { useState, useEffect, useCallback } from "react";
import relatorioService from "@/services/relatorio";
import {
  RelatorioDto,
  RelatorioSummaryDto,
  RelatorioPageResponse,
  RelatorioCreateRequest,
  RelatorioFilterRequest,
  RelatorioCompartilhamentoDto,
  CompartilhamentoPageResponse,
  RelatorioEstatisticas,
  StatusRelatorioEnum,
} from "@/types/relatorio";
import toastUtil from "@/utils/toast";

// Hook principal para gerenciar relatórios
export const useRelatorio = () => {
  const [relatorios, setRelatorios] = useState<RelatorioPageResponse>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRelatorios = useCallback(
    async (page: number = 0, size: number = 20) => {
      try {
        setLoading(true);
        setError(null);

        const data = await relatorioService.getMeusRelatorios(page, size);
        setRelatorios(data);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao carregar relatórios";
        setError(errorMessage);
        toastUtil.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchRelatorios = useCallback(
    async (
      filter: RelatorioFilterRequest,
      page: number = 0,
      size: number = 20
    ) => {
      try {
        setLoading(true);
        setError(null);

        const data = await relatorioService.buscarRelatorios(
          filter,
          page,
          size
        );
        setRelatorios(data);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao buscar relatórios";
        setError(errorMessage);
        toastUtil.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const criarRelatorio = useCallback(
    async (request: RelatorioCreateRequest): Promise<RelatorioDto | null> => {
      try {
        setLoading(true);
        const novoRelatorio = await relatorioService.gerarRelatorio(request);
        toastUtil.success("Relatório criado com sucesso!");
        return novoRelatorio;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao criar relatório";
        toastUtil.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const excluirRelatorio = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await relatorioService.excluirRelatorio(id);
        toastUtil.success("Relatório excluído com sucesso!");
        // Recarregar lista
        await loadRelatorios();
        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao excluir relatório";
        toastUtil.error(errorMessage);
        return false;
      }
    },
    [loadRelatorios]
  );

  return {
    relatorios,
    loading,
    error,
    loadRelatorios,
    searchRelatorios,
    criarRelatorio,
    excluirRelatorio,
  };
};

// Hook para detalhes de um relatório específico
export const useRelatorioDetalhes = (relatorioId: string) => {
  const [relatorio, setRelatorio] = useState<RelatorioDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRelatorio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await relatorioService.getRelatorioById(relatorioId);
      setRelatorio(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao carregar relatório";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [relatorioId]);

  const reprocessarRelatorio = useCallback(async (): Promise<boolean> => {
    try {
      await relatorioService.reprocessarRelatorio(relatorioId);
      toastUtil.success("Reprocessamento iniciado!");
      await loadRelatorio();
      return true;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao reprocessar relatório";
      toastUtil.error(errorMessage);
      return false;
    }
  }, [relatorioId, loadRelatorio]);

  const baixarPDF = useCallback(async (): Promise<boolean> => {
    try {
      if (relatorio?.statusRelatorio !== StatusRelatorioEnum.CONCLUIDO) {
        toastUtil.warning("Relatório ainda está sendo processado");
        return false;
      }

      const blob = await relatorioService.baixarRelatorioPDF(relatorioId);
      const filename = `relatorio-${relatorio.titulo.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      relatorioService.downloadFile(blob, filename);
      toastUtil.success("Download iniciado!");
      return true;
    } catch (err: any) {
      toastUtil.error("Erro ao baixar relatório");
      return false;
    }
  }, [relatorioId, relatorio]);

  useEffect(() => {
    if (relatorioId) {
      loadRelatorio();
    }
  }, [relatorioId, loadRelatorio]);

  return {
    relatorio,
    loading,
    error,
    loadRelatorio,
    reprocessarRelatorio,
    baixarPDF,
  };
};

// Hook para compartilhamentos
export const useCompartilhamentos = () => {
  const [compartilhamentosRecebidos, setCompartilhamentosRecebidos] =
    useState<CompartilhamentoPageResponse>({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
    });

  const [compartilhamentosEnviados, setCompartilhamentosEnviados] =
    useState<CompartilhamentoPageResponse>({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
    });

  const [loading, setLoading] = useState(false);
  const [countNaoVisualizados, setCountNaoVisualizados] = useState(0);

  const loadCompartilhamentosRecebidos = useCallback(
    async (page: number = 0, size: number = 20) => {
      try {
        setLoading(true);
        const data = await relatorioService.getCompartilhamentosRecebidos(
          page,
          size
        );
        setCompartilhamentosRecebidos(data);
      } catch (err: any) {
        toastUtil.error("Erro ao carregar compartilhamentos recebidos");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadCompartilhamentosEnviados = useCallback(
    async (page: number = 0, size: number = 20) => {
      try {
        setLoading(true);
        const data = await relatorioService.getCompartilhamentosEnviados(
          page,
          size
        );
        setCompartilhamentosEnviados(data);
      } catch (err: any) {
        toastUtil.error("Erro ao carregar compartilhamentos enviados");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadCountNaoVisualizados = useCallback(async () => {
    try {
      const count =
        await relatorioService.countCompartilhamentosNaoVisualizados();
      setCountNaoVisualizados(count);
    } catch (err: any) {
      console.error("Erro ao contar compartilhamentos não visualizados:", err);
    }
  }, []);

  const marcarComoVisualizado = useCallback(
    async (compartilhamentoId: string): Promise<boolean> => {
      try {
        await relatorioService.marcarCompartilhamentoComoVisualizado(
          compartilhamentoId
        );
        toastUtil.success("Marcado como visualizado!");
        // Recarregar dados
        await loadCompartilhamentosRecebidos();
        await loadCountNaoVisualizados();
        return true;
      } catch (err: any) {
        toastUtil.error("Erro ao marcar como visualizado");
        return false;
      }
    },
    [loadCompartilhamentosRecebidos, loadCountNaoVisualizados]
  );

  const compartilharRelatorio = useCallback(
    async (
      relatorioId: string,
      usuarioDestinoId: string,
      observacao?: string
    ): Promise<boolean> => {
      try {
        await relatorioService.compartilharRelatorio(relatorioId, {
          usuarioDestinoId,
          observacao,
        });
        toastUtil.success("Relatório compartilhado com sucesso!");
        // Recarregar compartilhamentos enviados
        await loadCompartilhamentosEnviados();
        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao compartilhar relatório";
        toastUtil.error(errorMessage);
        return false;
      }
    },
    [loadCompartilhamentosEnviados]
  );

  return {
    compartilhamentosRecebidos,
    compartilhamentosEnviados,
    countNaoVisualizados,
    loading,
    loadCompartilhamentosRecebidos,
    loadCompartilhamentosEnviados,
    loadCountNaoVisualizados,
    marcarComoVisualizado,
    compartilharRelatorio,
  };
};

// Hook para estatísticas
export const useEstatisticasRelatorio = () => {
  const [estatisticas, setEstatisticas] =
    useState<RelatorioEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await relatorioService.getEstatisticasRelatorios();
      setEstatisticas(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao carregar estatísticas";
      setError(errorMessage);
      toastUtil.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstatisticas();
  }, [loadEstatisticas]);

  return {
    estatisticas,
    loading,
    error,
    loadEstatisticas,
  };
};

// Hook para monitoramento de status de relatório em tempo real
export const useRelatorioStatus = (
  relatorioId: string,
  intervalMs: number = 5000
) => {
  const [status, setStatus] = useState<StatusRelatorioEnum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!relatorioId) return;

    const checkStatus = async () => {
      try {
        const relatorio = await relatorioService.getRelatorioById(relatorioId);
        setStatus(relatorio.statusRelatorio);
        setLoading(false);

        // Parar polling se relatório não estiver mais processando
        if (relatorio.statusRelatorio !== StatusRelatorioEnum.PROCESSANDO) {
          return true; // Para o polling
        }
      } catch (err) {
        console.error("Erro ao verificar status do relatório:", err);
        setLoading(false);
        return true; // Para o polling em caso de erro
      }
      return false; // Continua o polling
    };

    // Verificação inicial
    checkStatus();

    // Polling apenas se relatório estiver processando
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [relatorioId, intervalMs]);

  return {
    status,
    loading,
    isProcessando: status === StatusRelatorioEnum.PROCESSANDO,
    isConcluido: status === StatusRelatorioEnum.CONCLUIDO,
    isErro: status === StatusRelatorioEnum.ERRO,
  };
};
