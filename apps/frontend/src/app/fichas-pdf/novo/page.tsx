"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FichaPdfPacienteRequest,
  FichaPdfConvenioRequest,
  FichaPdfLoteRequest,
  FichaPdfPreviaDto,
  ConvenioDto,
  PacienteVerificacaoDto,
  fichaPdfHelpers,
} from "@/types/fichaPdf";
import fichaPdfService from "@/services/ficha-pdf";
import PacienteSearchSelect from "@/components/fichas-pdf/PacienteSearchSelect";
import {
  ArrowLeft,
  Users,
  Building2,
  Package,
  Calendar,
  Eye,
  Play,
  AlertTriangle,
  CheckCircle,
  Info,
  Search,
  X,
  FileText,
  User,
} from "lucide-react";
import toast from "@/utils/toast";

type TipoGeracao = "paciente" | "convenio" | "lote";

interface FormData {
  tipo: TipoGeracao;
  pacienteId: string;
  convenioId: string;
  convenioIds: string[];
  mes: number;
  ano: number;
  especialidades: string[];
  incluirInativos: boolean;
}

export default function NovaGeracaoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    tipo: "paciente",
    pacienteId: "",
    convenioId: "",
    convenioIds: [],
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    especialidades: [],
    incluirInativos: false,
  });

  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [previa, setPrevia] = useState<FichaPdfPreviaDto | null>(null);
  const [pacienteVerificacao, setPacienteVerificacao] =
    useState<PacienteVerificacaoDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(false);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const [verificandoPaciente, setVerificandoPaciente] = useState(false);
  const [pacienteNomeSelecionado, setPacienteNomeSelecionado] = useState("");

  const especialidadesDisponiveis = [
    "Fisioterapia",
    "Fonoaudiologia",
    "Terapia ocupacional",
    "Psicoterapia",
    "Nutrição",
    "Psicopedagogia",
    "Psicomotricidade",
    "Musicoterapia",
    "Avaliação neuropsicológica",
    "Arteterapia",
  ];

  useEffect(() => {
    carregarConvenios();
  }, []);

  useEffect(() => {
    if (
      formData.tipo === "paciente" &&
      formData.pacienteId &&
      formData.mes &&
      formData.ano
    ) {
      // Adicionar um delay para evitar muitas chamadas
      const timer = setTimeout(() => {
        verificarPaciente();
      }, 1000); // 1 segundo de delay

      return () => clearTimeout(timer);
    }
  }, [formData.pacienteId, formData.mes, formData.ano]);

  const carregarConvenios = async () => {
    try {
      const conveniosData = await fichaPdfService.getConveniosHabilitados();
      setConvenios(conveniosData);
    } catch (error) {
      console.error("Erro ao carregar convênios:", error);
      toast.error("Erro ao carregar convênios habilitados");
    }
  };

  const verificarPaciente = async () => {
    if (!formData.pacienteId || !formData.mes || !formData.ano) {
      toast.error("Dados incompletos para verificação");
      return;
    }

    try {
      setVerificandoPaciente(true);

      const verificacao = await fichaPdfService.verificarFichasPaciente(
        formData.pacienteId,
        formData.mes,
        formData.ano
      );

      setPacienteVerificacao(verificacao);

      // Feedback para o usuário
      if (verificacao.temFichasDisponiveis) {
        toast.success(`Fichas disponíveis para ${verificacao.pacienteNome}`);
      } else {
        toast.warning(
          `Nenhuma ficha pendente para ${verificacao.pacienteNome} no período ${formData.mes}/${formData.ano}`
        );
      }
    } catch (error) {
      console.error("Erro ao verificar paciente:", error);
      toast.error("Erro ao verificar dados do paciente");
      setPacienteVerificacao(null);
    } finally {
      setVerificandoPaciente(false);
    }
  };

  const gerarPrevia = async () => {
    if (formData.tipo !== "convenio" || !formData.convenioId) {
      toast.error("A prévia só está disponível para a geração por convênio.");
      return;
    }

    try {
      setGerandoPrevia(true);

      const request: FichaPdfConvenioRequest = {
        convenioId: formData.convenioId,
        mes: formData.mes,
        ano: formData.ano,
        especialidades:
          formData.especialidades.length > 0
            ? formData.especialidades
            : undefined,
        incluirInativos: formData.incluirInativos,
      };

      const previaData = await fichaPdfService.gerarPreviaConvenio(request);
      setPrevia(previaData);
    } catch (error) {
      console.error("Erro ao gerar prévia:", error);
      toast.error("Erro ao gerar prévia");
    } finally {
      setGerandoPrevia(false);
    }
  };

  const validarFormulario = (): boolean => {
    if (!formData.mes || !formData.ano) {
      toast.error("Mês e ano são obrigatórios");
      return false;
    }

    const validacaoPeriodo = fichaPdfHelpers.validarPeriodo(
      formData.mes,
      formData.ano
    );
    if (!validacaoPeriodo.valido) {
      toast.error(validacaoPeriodo.erro || "Período inválido");
      return false;
    }

    if (formData.tipo === "paciente" && !formData.pacienteId) {
      toast.error("Selecione um paciente");
      return false;
    }

    if (formData.tipo === "convenio" && !formData.convenioId) {
      toast.error("Selecione um convênio");
      return false;
    }

    if (formData.tipo === "lote" && formData.convenioIds.length === 0) {
      toast.error("Selecione pelo menos um convênio para o lote");
      return false;
    }

    return true;
  };

  const submeterFormulario = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      if (formData.tipo === "paciente") {
        const request: FichaPdfPacienteRequest = {
          pacienteId: formData.pacienteId,
          mes: formData.mes,
          ano: formData.ano,
          especialidades:
            formData.especialidades.length > 0
              ? formData.especialidades
              : undefined,
          incluirInativos: formData.incluirInativos,
        };

        const response = await fichaPdfService.gerarFichasPaciente(request);

        if (response.sucesso) {
          toast.success("Fichas geradas com sucesso!");
          router.push("/fichas-pdf");
        } else {
          toast.error(response.mensagem || "Erro ao gerar fichas");
        }
      } else if (formData.tipo === "convenio") {
        const request: FichaPdfConvenioRequest = {
          convenioId: formData.convenioId,
          mes: formData.mes,
          ano: formData.ano,
          especialidades:
            formData.especialidades.length > 0
              ? formData.especialidades
              : undefined,
          incluirInativos: formData.incluirInativos,
        };

        const response = await fichaPdfService.gerarFichasConvenio(request);
        toast.success(
          "Geração iniciada com sucesso! Você pode acompanhar o progresso na lista de jobs."
        );
        router.push(`/fichas-pdf/job/${response.jobId}`);
      } else if (formData.tipo === "lote") {
        const request: FichaPdfLoteRequest = {
          convenioIds: formData.convenioIds,
          mes: formData.mes,
          ano: formData.ano,
          especialidades:
            formData.especialidades.length > 0
              ? formData.especialidades
              : undefined,
          incluirInativos: formData.incluirInativos,
        };

        const response = await fichaPdfService.gerarFichasLote(request);
        toast.success("Geração em lote iniciada com sucesso!");
        router.push(`/fichas-pdf/job/${response.jobId}`);
      }
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      toast.error("Erro ao iniciar geração de fichas");
    } finally {
      setLoading(false);
    }
  };

  const renderTipoSeletor = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tipo de Geração
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFormData({ ...formData, tipo: "paciente" })}
          className={`p-4 border-2 rounded-lg transition-colors ${
            formData.tipo === "paciente"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}>
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <h4 className="font-medium text-gray-900">Paciente</h4>
          <p className="text-sm text-gray-600">
            Gerar fichas para um paciente específico
          </p>
        </button>

        <button
          onClick={() => setFormData({ ...formData, tipo: "convenio" })}
          className={`p-4 border-2 rounded-lg transition-colors ${
            formData.tipo === "convenio"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}>
          <Building2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <h4 className="font-medium text-gray-900">Convênio</h4>
          <p className="text-sm text-gray-600">
            Gerar fichas para um convênio completo
          </p>
        </button>

        <button
          onClick={() => setFormData({ ...formData, tipo: "lote" })}
          className={`p-4 border-2 rounded-lg transition-colors ${
            formData.tipo === "lote"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}>
          <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <h4 className="font-medium text-gray-900">Lote</h4>
          <p className="text-sm text-gray-600">
            Gerar fichas para múltiplos convênios
          </p>
        </button>
      </div>
    </div>
  );

  const renderFormularioPaciente = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Dados do Paciente</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paciente *
          </label>

          {/* Novo componente de busca integrado */}
          <PacienteSearchSelect
            value={formData.pacienteId}
            onChange={(pacienteId, pacienteNome) => {
              setFormData((prev) => ({ ...prev, pacienteId }));
              setPacienteNomeSelecionado(pacienteNome || "");

              // Limpar verificação anterior quando trocar de paciente
              if (pacienteVerificacao?.pacienteId !== pacienteId) {
                setPacienteVerificacao(null);
              }
            }}
            placeholder="Digite o nome do paciente para buscar..."
            error={!formData.pacienteId}
          />

          {/* Botão de verificação manual - só aparece quando há paciente selecionado */}
          {formData.pacienteId && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => verificarPaciente()}
                disabled={verificandoPaciente}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {verificandoPaciente ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-2" />
                    Verificar Fichas
                  </>
                )}
              </button>
            </div>
          )}

          {/* Informações de verificação do paciente */}
          {pacienteVerificacao && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900">
                    {pacienteVerificacao.pacienteNome}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                    pacienteVerificacao.temFichasDisponiveis
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                  {pacienteVerificacao.temFichasDisponiveis ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fichas disponíveis
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sem fichas pendentes
                    </>
                  )}
                </span>
              </div>

              {/* Período atual */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center text-sm text-blue-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Período selecionado:{" "}
                    <strong>
                      {formData.mes}/{formData.ano}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Fichas já existentes */}
              {pacienteVerificacao.fichasExistentes &&
                pacienteVerificacao.fichasExistentes.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Fichas já geradas:
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {pacienteVerificacao.fichasExistentes.map(
                        (ficha, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded border border-gray-100">
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-900">
                                {fichaPdfHelpers.formatarMesAno(
                                  ficha.mes,
                                  ficha.ano
                                )}
                              </span>
                              <span className="text-gray-600 mx-2">•</span>
                              <span className="text-gray-700">
                                {ficha.especialidade}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                              {ficha.numeroIdentificacao}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Avisos ou mensagens */}
              {pacienteVerificacao.mensagem && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                    <span className="text-sm text-blue-800">
                      {pacienteVerificacao.mensagem}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validação de erro */}
          {!formData.pacienteId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Selecione um paciente para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFormularioConvenio = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Dados do Convênio
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Convênio *
          </label>
          <select
            value={formData.convenioId}
            onChange={(e) =>
              setFormData({ ...formData, convenioId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione um convênio</option>
            {convenios.map((convenio) => (
              <option key={convenio.id} value={convenio.id}>
                {convenio.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderFormularioLote = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Convênios para Lote
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Convênios Selecionados ({formData.convenioIds.length})
          </label>

          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
            {convenios.map((convenio) => (
              <label
                key={convenio.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                <input
                  type="checkbox"
                  checked={formData.convenioIds.includes(convenio.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        convenioIds: [...formData.convenioIds, convenio.id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        convenioIds: formData.convenioIds.filter(
                          (id) => id !== convenio.id
                        ),
                      });
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {convenio.name}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between mt-2">
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  convenioIds: convenios.map((c) => c.id),
                })
              }
              className="text-sm text-blue-600 hover:text-blue-800">
              Selecionar todos
            </button>
            <button
              onClick={() => setFormData({ ...formData, convenioIds: [] })}
              className="text-sm text-gray-600 hover:text-gray-800">
              Desmarcar todos
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPeriodoEFiltros = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Período e Filtros
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mês *
          </label>
          <select
            value={formData.mes}
            onChange={(e) =>
              setFormData({ ...formData, mes: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
              <option key={mes} value={mes}>
                {fichaPdfHelpers.formatarMesAno(mes, 2024).split(" ")[0]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ano *
          </label>
          <select
            value={formData.ano}
            onChange={(e) =>
              setFormData({ ...formData, ano: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i
            ).map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Especialidades (opcional)
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
          {especialidadesDisponiveis.map((especialidade) => (
            <label
              key={especialidade}
              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
              <input
                type="checkbox"
                checked={formData.especialidades.includes(especialidade)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      especialidades: [
                        ...formData.especialidades,
                        especialidade,
                      ],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      especialidades: formData.especialidades.filter(
                        (e) => e !== especialidade
                      ),
                    });
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">
                {especialidade}
              </span>
            </label>
          ))}
        </div>

        {formData.especialidades.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.especialidades.map((especialidade) => (
              <span
                key={especialidade}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {especialidade}
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      especialidades: formData.especialidades.filter(
                        (e) => e !== especialidade
                      ),
                    })
                  }
                  className="ml-1 h-3 w-3 text-blue-600 hover:text-blue-800">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.incluirInativos}
            onChange={(e) =>
              setFormData({ ...formData, incluirInativos: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-900">
            Incluir pacientes inativos
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Marque esta opção para incluir pacientes que não tiveram atividade
          recente
        </p>
      </div>
    </div>
  );

  const renderPrevia = () => {
    if (!previa) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Prévia da Geração
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {previa.totalFichasEstimadas}
            </div>
            <div className="text-sm text-blue-800">Fichas estimadas</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {previa.pacientesComFichas.length}
            </div>
            <div className="text-sm text-green-800">Pacientes</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(previa.fichasPorEspecialidade).length}
            </div>
            <div className="text-sm text-purple-800">Especialidades</div>
          </div>
        </div>

        {previa.avisos.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                Avisos
              </span>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {previa.avisos.map((aviso, index) => (
                <li key={index}>• {aviso}</li>
              ))}
            </ul>
          </div>
        )}

        {previa.bloqueios.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-2">
              <X className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Bloqueios
              </span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {previa.bloqueios.map((bloqueio, index) => (
                <li key={index}>• {bloqueio}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Distribuição por Convênio
            </h4>
            <div className="space-y-1">
              {Object.entries(previa.fichasPorConvenio).map(
                ([convenio, quantidade]) => (
                  <div key={convenio} className="flex justify-between text-sm">
                    <span className="text-gray-600">{convenio}</span>
                    <span className="text-gray-900">{quantidade}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Distribuição por Especialidade
            </h4>
            <div className="space-y-1">
              {Object.entries(previa.fichasPorEspecialidade).map(
                ([especialidade, quantidade]) => (
                  <div
                    key={especialidade}
                    className="flex justify-between text-sm">
                    <span className="text-gray-600">{especialidade}</span>
                    <span className="text-gray-900">{quantidade}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-2 h-6 w-6" />
              Nova Geração de Fichas
            </h1>
            <p className="text-gray-600">
              Configure os parâmetros para gerar fichas PDF
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Seletor de tipo */}
        {renderTipoSeletor()}

        {/* Formulário específico por tipo */}
        {formData.tipo === "paciente" && renderFormularioPaciente()}
        {formData.tipo === "convenio" && renderFormularioConvenio()}
        {formData.tipo === "lote" && renderFormularioLote()}

        {/* Período e filtros */}
        {renderPeriodoEFiltros()}

        {/* Prévia */}
        {renderPrevia()}

        {/* Ações */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {previa && (
                <span>
                  Tempo estimado:{" "}
                  {fichaPdfHelpers.calcularTempoEstimado(
                    previa.totalFichasEstimadas
                  )}
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={gerarPrevia}
                disabled={gerandoPrevia || !validarFormulario()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                {gerandoPrevia ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Gerar Prévia
              </button>

              <button
                onClick={submeterFormulario}
                disabled={
                  loading ||
                  !validarFormulario() ||
                  (previa !== null && previa.bloqueios.length > 0)
                }
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Iniciar Geração
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
