import React from "react";
import {
  FileText,
  Link,
  User,
  Calendar,
  Activity,
  Building,
  Hash,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RelatorioDataDto, RelatorioItemDto } from "@/types/relatorio";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

interface RelatorioDataComponentProps {
  dados: RelatorioDataDto;
}

// Componente para badge de status melhorado
const StatusBadge = ({ status, tipo }: { status: string; tipo?: string }) => {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    if (
      normalizedStatus?.includes("aprovado") ||
      normalizedStatus?.includes("concluido")
    ) {
      return { className: "bg-green-100 text-green-800", icon: CheckCircle };
    }
    if (
      normalizedStatus?.includes("pendente") ||
      normalizedStatus?.includes("processando")
    ) {
      return { className: "bg-yellow-100 text-yellow-800", icon: Clock };
    }
    if (
      normalizedStatus?.includes("rejeitado") ||
      normalizedStatus?.includes("erro")
    ) {
      return { className: "bg-red-100 text-red-800", icon: AlertCircle };
    }
    return { className: "bg-gray-100 text-gray-800", icon: Activity };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
      {tipo && <span className="ml-1 text-xs opacity-75">({tipo})</span>}
    </span>
  );
};

// Componente para mostrar relacionamento Ficha-Guia
const FichaGuiaRelation = ({ item }: { item: RelatorioItemDto }) => {
  if (item.tipoEntidade !== "FICHA" || !item.numeroGuia) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-2">
      <div className="flex items-center text-sm text-blue-800">
        <Link className="h-4 w-4 mr-2" />
        <span className="font-medium">Vinculação:</span>
      </div>
      <div className="mt-1 flex items-center text-sm text-blue-700">
        <span className="font-mono bg-blue-100 px-2 py-1 rounded">
          Ficha {item.codigoFicha}
        </span>
        <ArrowRight className="h-4 w-4 mx-2" />
        <span className="font-mono bg-blue-100 px-2 py-1 rounded">
          Guia {item.numeroGuia}
        </span>
      </div>
      {item.vinculacaoInfo && (
        <div className="mt-1 text-xs text-blue-600">{item.vinculacaoInfo}</div>
      )}
    </div>
  );
};

// Componente para informações detalhadas do item
const ItemDetailCard = ({ item }: { item: RelatorioItemDto }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header com identificação principal */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 text-lg">
            {item.descricaoCompleta ||
              `${item.tipoEntidade} - ${item.pacienteNome}`}
          </h4>
          {item.identificadorCompleto && (
            <p className="text-sm text-gray-600 font-mono mt-1">
              {item.identificadorCompleto}
            </p>
          )}
        </div>
        <div className="text-right">
          <StatusBadge status={item.status} />
          {item.tipoFicha && (
            <div className="mt-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {item.tipoFicha}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Informações organizadas em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
        {/* Coluna 1: Paciente e Identificadores */}
        <div>
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <User className="h-4 w-4 mr-1" />
            Paciente
          </h5>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Nome:</strong> {item.pacienteNome || "N/A"}
            </p>
            <p>
              <strong>Unidade:</strong> {item.unidade || "N/A"}
            </p>
          </div>

          {(item.codigoFicha || item.numeroGuia) && (
            <div className="mt-3">
              <h6 className="font-medium text-gray-700 mb-1 flex items-center">
                <Hash className="h-4 w-4 mr-1" />
                Identificadores
              </h6>
              <div className="space-y-1 text-sm">
                {item.codigoFicha && (
                  <p>
                    <strong>Código Ficha:</strong>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">
                      {item.codigoFicha}
                    </span>
                  </p>
                )}
                {item.numeroGuia && (
                  <p>
                    <strong>Número Guia:</strong>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">
                      {item.numeroGuia}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 2: Convênio e Especialidade */}
        <div>
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <Building className="h-4 w-4 mr-1" />
            Assistência
          </h5>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Convênio:</strong> {item.convenioNome || "N/A"}
            </p>
            <p>
              <strong>Especialidade:</strong> {item.especialidade || "N/A"}
            </p>
            <p>
              <strong>Quantidade:</strong> {item.quantidadeAutorizada || "N/A"}
            </p>
          </div>
        </div>

        {/* Coluna 3: Datas e Responsável */}
        <div>
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Informações Temporais
          </h5>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Período:</strong> {item.mes}/{item.ano}
            </p>
            <p>
              <strong>Atualizado:</strong>{" "}
              {formatDateTime(item.dataAtualizacao)}
            </p>
            <p>
              <strong>Responsável:</strong>{" "}
              {item.usuarioResponsavelNome || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Status específicos se houver diferença */}
      {item.statusFicha &&
        item.statusGuia &&
        item.statusFicha !== item.statusGuia && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
            <h6 className="font-medium text-yellow-800 mb-2">
              Status Específicos:
            </h6>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Ficha:</span>
                <StatusBadge status={item.statusFicha} tipo="Ficha" />
              </div>
              <div>
                <span className="text-yellow-700">Guia:</span>
                <StatusBadge status={item.statusGuia} tipo="Guia" />
              </div>
            </div>
          </div>
        )}

      {/* Relacionamento Ficha-Guia */}
      <FichaGuiaRelation item={item} />

      {/* Histórico de mudança de status */}
      {item.statusAnterior && item.statusNovo && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-3">
          <h6 className="font-medium text-gray-700 mb-2">Mudança de Status:</h6>
          <div className="flex items-center text-sm">
            <StatusBadge status={item.statusAnterior} />
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <StatusBadge status={item.statusNovo} />
          </div>
          {item.motivoMudanca && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Motivo:</strong> {item.motivoMudanca}
            </p>
          )}
          {item.dataMudancaStatus && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(item.dataMudancaStatus)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const RelatorioDataComponent: React.FC<RelatorioDataComponentProps> = ({
  dados,
}) => {
  return (
    <div className="space-y-6">
      {/* Resumo do Relatório */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">
            Dados do Relatório
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total de Registros:</p>
            <p className="text-2xl font-bold text-blue-600">
              {dados.totalRegistros}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Período:</p>
            <p className="font-semibold">
              {formatDate(dados.periodoInicio)} até{" "}
              {formatDate(dados.periodoFim)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Gerado em:</p>
            <p className="font-semibold">{formatDateTime(dados.dataGeracao)}</p>
          </div>
        </div>
      </div>

      {/* Lista de Itens Melhorada */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalhamento dos Registros ({dados.itens.length})
        </h3>

        <div className="space-y-4">
          {dados.itens.map((item, index) => (
            <ItemDetailCard key={`${item.entidadeId}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
