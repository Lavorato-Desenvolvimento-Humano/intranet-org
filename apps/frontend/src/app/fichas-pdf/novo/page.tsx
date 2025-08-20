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

  const gerarPrevia = async () => {
    if (formData.tipo !== "convenio") {
      toast.error("Prévia disponível apenas para geração por convênio");
      return;
    }

    if (!formData.convenioId) {
      toast.error("Selecione um convênio para gerar a prévia");
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

      console.log("Enviando requisição de prévia:", request);

      const response = await fichaPdfService.gerarPreviaConvenio(request);

      console.log("Resposta da prévia recebida:", response);

      // VALIDAÇÃO ROBUSTA: Verificar se a resposta tem a estrutura esperada
      if (!response || typeof response !== "object") {
        throw new Error("Resposta inválida da API");
      }

      // GARANTIR estrutura mínima obrigatória
      const previaSegura: FichaPdfPreviaDto = {
        totalPacientesConvenio: response.totalPacientesConvenio || 0,
        pacientesComFichas: response.pacientesComFichas || 0,
        pacientesSemFichas: response.pacientesSemFichas || 0,
        seraGeradoPara: response.seraGeradoPara || 0,
        eficiencia: response.eficiencia || 0,
        recomendacao: response.recomendacao || "Sem recomendação disponível",
        periodo: response.periodo || `${formData.mes}/${formData.ano}`,
        convenioId: response.convenioId || formData.convenioId,
        dataConsulta: response.dataConsulta || new Date().toISOString(),

        // GARANTIR que fichasExistentes sempre exista com estrutura completa
        fichasExistentes: {
          convenioId:
            response.fichasExistentes?.convenioId || formData.convenioId,
          convenioNome:
            response.fichasExistentes?.convenioNome || "Nome não disponível",
          totalFichas: response.fichasExistentes?.totalFichas || 0,
          totalPacientes: response.fichasExistentes?.totalPacientes || 0,
          fichasGeradasMes: response.fichasExistentes?.fichasGeradasMes || 0,
          fichasGeradasAno: response.fichasExistentes?.fichasGeradasAno || 0,
          pacientesAtivos: response.fichasExistentes?.pacientesAtivos || 0,
          especialidadesCobertas:
            response.fichasExistentes?.especialidadesCobertas || [],
          fichasPorEspecialidade:
            response.fichasExistentes?.fichasPorEspecialidade || {},
          fichasPorStatus: response.fichasExistentes?.fichasPorStatus || {},
          primeiraFicha: response.fichasExistentes?.primeiraFicha,
          ultimaFicha: response.fichasExistentes?.ultimaFicha,
          mediaFichasPorPaciente:
            response.fichasExistentes?.mediaFichasPorPaciente || 0,
          mes: response.fichasExistentes?.mes || formData.mes,
          ano: response.fichasExistentes?.ano || formData.ano,
          geradoEm:
            response.fichasExistentes?.geradoEm || new Date().toISOString(),
        },

        // Campos opcionais com valores padrão
        totalFichasEstimadas:
          response.totalFichasEstimadas || response.seraGeradoPara || 0,
        avisos: Array.isArray(response.avisos) ? response.avisos : [],
        bloqueios: Array.isArray(response.bloqueios) ? response.bloqueios : [],
        fichasPorConvenio: response.fichasPorConvenio || {
          [response.fichasExistentes?.convenioNome || "Convênio"]:
            response.seraGeradoPara || 0,
        },
      };

      setPrevia(previaSegura);

      if (previaSegura.seraGeradoPara === 0) {
        toast.info("Todos os pacientes já possuem fichas para este período");
      } else {
        toast.success(
          `Prévia gerada: ${previaSegura.seraGeradoPara} fichas serão criadas`
        );
      }
    } catch (error: any) {
      console.error("Erro detalhado ao gerar prévia:", error);

      let mensagemErro = "Erro ao gerar prévia";
      if (error?.response?.data?.mensagem) {
        mensagemErro = error.response.data.mensagem;
      } else if (error?.response?.data?.message) {
        mensagemErro = error.response.data.message;
      } else if (error?.message) {
        mensagemErro = error.message;
      }

      toast.error(mensagemErro);
      setPrevia(null);
    } finally {
      setGerandoPrevia(false);
    }
  };

  const renderPrevia = () => {
    if (!previa) return null;

    // FUNÇÃO HELPER: Processar dados com máxima segurança
    const processarDadosPrevia = (previa: FichaPdfPreviaDto) => {
      // Garantir que fichasExistentes nunca seja undefined/null
      const fichasExistentes = previa.fichasExistentes || {
        convenioId: "",
        convenioNome: "Nome não disponível",
        totalFichas: 0,
        totalPacientes: 0,
        fichasGeradasMes: 0,
        fichasGeradasAno: 0,
        pacientesAtivos: 0,
        especialidadesCobertas: [],
        fichasPorEspecialidade: {},
        fichasPorStatus: {},
        mediaFichasPorPaciente: 0.0,
        mes: 0,
        ano: 0,
        geradoEm: "",
      };

      // Garantir que objetos sejam sempre objetos válidos
      const fichasPorEspecialidadeSeguro =
        fichasExistentes.fichasPorEspecialidade &&
        typeof fichasExistentes.fichasPorEspecialidade === "object"
          ? fichasExistentes.fichasPorEspecialidade
          : {};

      const fichasPorStatusSeguro =
        fichasExistentes.fichasPorStatus &&
        typeof fichasExistentes.fichasPorStatus === "object"
          ? fichasExistentes.fichasPorStatus
          : {};

      const fichasPorConvenioSeguro =
        previa.fichasPorConvenio && typeof previa.fichasPorConvenio === "object"
          ? previa.fichasPorConvenio
          : {
              [fichasExistentes.convenioNome || "Convênio"]:
                previa.seraGeradoPara || 0,
            };

      return {
        // Dados principais (sempre números válidos)
        totalFichasEstimadas:
          Number(previa.totalFichasEstimadas || previa.seraGeradoPara) || 0,
        totalPacientesConvenio: Number(previa.totalPacientesConvenio) || 0,
        pacientesComFichas: Number(previa.pacientesComFichas) || 0,
        pacientesSemFichas: Number(previa.pacientesSemFichas) || 0,
        eficiencia: Number(previa.eficiencia) || 0,
        recomendacao: String(
          previa.recomendacao || "Sem recomendação disponível"
        ),
        periodo: String(previa.periodo || `${formData.mes}/${formData.ano}`),

        // Dados das fichas existentes (sempre objetos/arrays válidos)
        fichasPorEspecialidade: fichasPorEspecialidadeSeguro,
        fichasPorStatus: fichasPorStatusSeguro,
        totalFichasExistentes: Number(fichasExistentes.totalFichas) || 0,
        especialidadesCobertas: Array.isArray(
          fichasExistentes.especialidadesCobertas
        )
          ? fichasExistentes.especialidadesCobertas
          : [],
        convenioNome: String(
          fichasExistentes.convenioNome || "Nome não disponível"
        ),
        mediaFichasPorPaciente:
          Number(fichasExistentes.mediaFichasPorPaciente) || 0,

        // Dados para compatibilidade
        fichasPorConvenio: fichasPorConvenioSeguro,
        avisos: Array.isArray(previa.avisos) ? previa.avisos : [],
        bloqueios: Array.isArray(previa.bloqueios) ? previa.bloqueios : [],
      };
    };

    const dados = processarDadosPrevia(previa);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Prévia da Geração
        </h3>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {dados.totalFichasEstimadas}
            </div>
            <div className="text-sm text-blue-800">Fichas a serem geradas</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {dados.totalPacientesConvenio}
            </div>
            <div className="text-sm text-green-800">Total de pacientes</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {dados.pacientesComFichas}
            </div>
            <div className="text-sm text-yellow-800">Já possuem fichas</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(dados.fichasPorEspecialidade).length}
            </div>
            <div className="text-sm text-purple-800">Especialidades ativas</div>
          </div>
        </div>

        {/* Recomendação */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Info className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              Recomendação do Sistema
            </span>
          </div>
          <p className="text-sm text-gray-700">{dados.recomendacao}</p>
          {dados.eficiencia > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Eficiência de geração: {dados.eficiencia.toFixed(1)}%
            </p>
          )}
          <p className="text-xs text-gray-500">
            Período: {dados.periodo} • Convênio: {dados.convenioNome}
          </p>
        </div>

        {/* Avisos (se existirem) */}
        {dados.avisos.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                Avisos Importantes
              </span>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {dados.avisos.map((aviso, index) => (
                <li key={index}>• {aviso}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Bloqueios (se existirem) */}
        {dados.bloqueios.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-2">
              <X className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Bloqueios Identificados
              </span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {dados.bloqueios.map((bloqueio, index) => (
                <li key={index}>• {bloqueio}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Distribuições lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribuição por Convênio */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Distribuição por Convênio
            </h4>
            <div className="space-y-2">
              {Object.entries(dados.fichasPorConvenio).map(
                ([convenio, quantidade]) => (
                  <div
                    key={convenio}
                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 truncate">{convenio}</span>
                    <span className="text-gray-900 font-medium">
                      {quantidade}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Fichas Existentes por Especialidade */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Fichas Existentes por Especialidade
            </h4>
            <div className="space-y-2">
              {Object.keys(dados.fichasPorEspecialidade).length > 0 ? (
                Object.entries(dados.fichasPorEspecialidade).map(
                  ([especialidade, quantidade]) => (
                    <div
                      key={especialidade}
                      className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                      <span className="text-blue-700 truncate">
                        {especialidade}
                      </span>
                      <span className="text-blue-900 font-medium">
                        {quantidade}
                      </span>
                    </div>
                  )
                )
              ) : (
                <p className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                  Nenhuma ficha existente no período selecionado
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas adicionais das fichas existentes */}
        {dados.totalFichasExistentes > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">
              Estatísticas das Fichas Existentes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {dados.totalFichasExistentes}
                </div>
                <div className="text-gray-600">Total de fichas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {dados.especialidadesCobertas.length}
                </div>
                <div className="text-gray-600">Especialidades</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {dados.mediaFichasPorPaciente.toFixed(1)}
                </div>
                <div className="text-gray-600">Média por paciente</div>
              </div>
            </div>
          </div>
        )}
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
                    previa.totalFichasEstimadas || 0
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
                  !!(
                    previa &&
                    Array.isArray(previa.bloqueios) &&
                    previa.bloqueios.length > 0
                  )
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
