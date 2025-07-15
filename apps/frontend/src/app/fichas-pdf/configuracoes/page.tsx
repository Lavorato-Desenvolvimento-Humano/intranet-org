"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FichaPdfConfiguracaoDto,
  ConvenioDto,
  FichaPdfInfoDto,
} from "@/types/fichaPdf";
import fichaPdfService from "@/services/ficha-pdf";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Settings,
  Users,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Save,
  Trash2,
  Info,
  Server,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Zap,
} from "lucide-react";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [configuracoes, setConfiguracoes] =
    useState<FichaPdfConfiguracaoDto | null>(null);
  const [infoSistema, setInfoSistema] = useState<FichaPdfInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [limpandoCache, setLimpandoCache] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [configData, infoData] = await Promise.all([
        fichaPdfService.getConfiguracoes().catch(() => null),
        fichaPdfService.getInfo().catch(() => null),
      ]);

      setConfiguracoes(configData);
      setInfoSistema(infoData);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const toggleConvenio = async (convenioId: string, habilitado: boolean) => {
    try {
      setSalvando(true);
      await fichaPdfService.toggleConvenioHabilitado(convenioId, habilitado);

      // Atualizar estado local
      if (configuracoes) {
        const conveniosAtualizados = configuracoes.conveniosHabilitados.map(
          (convenio) =>
            convenio.id === convenioId
              ? { ...convenio, active: habilitado }
              : convenio
        );

        setConfiguracoes({
          ...configuracoes,
          conveniosHabilitados: conveniosAtualizados,
        });
      }

      toast.success(
        habilitado
          ? "Convênio habilitado para geração de fichas PDF"
          : "Convênio desabilitado para geração de fichas PDF"
      );
    } catch (error) {
      console.error("Erro ao alterar status do convênio:", error);
      toast.error("Erro ao alterar configuração do convênio");
    } finally {
      setSalvando(false);
    }
  };

  const limparCache = async () => {
    try {
      setLimpandoCache(true);
      await fichaPdfService.limparCache();
      toast.success("Cache limpo com sucesso");

      // Recarregar informações do sistema
      const infoData = await fichaPdfService.getInfo();
      setInfoSistema(infoData);
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache");
    } finally {
      setLimpandoCache(false);
    }
  };

  const renderStatusSistema = () => {
    if (!infoSistema) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2" />
          Status do Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status do Serviço:</span>
              <div className="flex items-center">
                {infoSistema.statusServico.ativo ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    infoSistema.statusServico.ativo
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {infoSistema.statusServico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Fila de Processamento:
              </span>
              <span className="text-sm font-medium">
                {infoSistema.statusServico.queueSize} jobs
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Processando Atualmente:
              </span>
              <span className="text-sm font-medium">
                {infoSistema.statusServico.processandoAtualmente} jobs
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Versão do Sistema:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {infoSistema.versaoSistema}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Jobs Simultâneos (Máx):
              </span>
              <span className="text-sm font-medium">
                {infoSistema.limitesOperacionais.maxJobSimultaneos}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Fichas por Job (Máx):
              </span>
              <span className="text-sm font-medium">
                {infoSistema.limitesOperacionais.maxFichasPorJob.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Retenção de Arquivos:
              </span>
              <span className="text-sm font-medium">
                {infoSistema.limitesOperacionais.tempoRetencaoArquivos}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Formato Padrão:</span>
              <span className="text-sm font-medium">
                {infoSistema.configuracaoGlobal.formatoPadrao}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfiguracaoGlobal = () => {
    if (!configuracoes) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Configuração Global
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Batch Size
              </span>
              <HardDrive className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {configuracoes.configuracaoGlobal.batchSize}
            </div>
            <div className="text-xs text-gray-500">fichas por lote</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Timeout</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {configuracoes.configuracaoGlobal.timeoutMinutos}
            </div>
            <div className="text-xs text-gray-500">minutos</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Qualidade
              </span>
              <Zap className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {configuracoes.configuracaoGlobal.qualidade}
            </div>
            <div className="text-xs text-gray-500">
              Compressão:{" "}
              {configuracoes.configuracaoGlobal.compressao
                ? "Ativa"
                : "Inativa"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConveniosHabilitados = () => {
    if (!configuracoes) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Convênios Habilitados ({configuracoes.totalConvenios})
            </h3>
            <span className="text-sm text-gray-500">
              {
                configuracoes.conveniosHabilitados.filter((c) => c.active)
                  .length
              }{" "}
              ativos
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {configuracoes.conveniosHabilitados.map((convenio) => (
            <div key={convenio.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {convenio.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Código: {convenio.code}
                    {convenio.description && ` • ${convenio.description}`}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      convenio.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                    {convenio.active ? "Habilitado" : "Desabilitado"}
                  </span>

                  <button
                    onClick={() =>
                      toggleConvenio(convenio.id, !convenio.active)
                    }
                    disabled={salvando}
                    className="transition-colors">
                    {convenio.active ? (
                      <ToggleRight className="h-6 w-6 text-green-600 hover:text-green-700" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {configuracoes.conveniosHabilitados.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Nenhum convênio encontrado
            </h3>
            <p className="text-sm text-gray-500">
              Não há convênios disponíveis para configuração.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderAcoesManutencao = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Ações de Manutenção
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Limpar Cache
              </h4>
              <p className="text-sm text-gray-500">
                Remove templates e imagens em cache para forçar recarregamento
              </p>
            </div>
            <button
              onClick={limparCache}
              disabled={limpandoCache}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
              {limpandoCache ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {limpandoCache ? "Limpando..." : "Limpar Cache"}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Atualizar Configurações
              </h4>
              <p className="text-sm text-gray-500">
                Recarrega todas as configurações do sistema
              </p>
            </div>
            <button
              onClick={carregarDados}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600">
              Gerencie configurações do sistema de fichas PDF
            </p>
          </div>
        </div>
      </div>

      {/* Alerta se não tiver permissão para algumas configurações */}
      {!configuracoes && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Algumas configurações podem não estar disponíveis devido a
              permissões de acesso.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Status do sistema */}
        {renderStatusSistema()}

        {/* Configuração global */}
        {renderConfiguracaoGlobal()}

        {/* Convênios habilitados */}
        {renderConveniosHabilitados()}

        {/* Ações de manutenção */}
        {renderAcoesManutencao()}

        {/* Informações adicionais */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Informações Importantes:</p>
              <ul className="space-y-1 text-blue-700">
                <li>
                  • Alterações nas configurações de convênios são aplicadas
                  imediatamente
                </li>
                <li>• O cache é automaticamente limpo quando necessário</li>
                <li>
                  • Jobs em andamento não são afetados por mudanças nas
                  configurações
                </li>
                <li>
                  • Apenas administradores podem acessar todas as configurações
                </li>
                <li>
                  • As configurações globais são aplicadas a todos os novos jobs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
