// src/components/workflow/WorkflowStats.tsx
import React from "react";
import { WorkflowStatsDto } from "@/types/workflow";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  ArchiveIcon,
  BarChart,
} from "lucide-react";

interface WorkflowStatsProps {
  stats: WorkflowStatsDto;
}

const WorkflowStats: React.FC<WorkflowStatsProps> = ({ stats }) => {
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Em Andamento"
          value={stats.inProgressCount}
          icon={Clock}
          color="bg-blue-500"
        />
        <StatCard
          title="Concluídos"
          value={stats.completedCount}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Pausados"
          value={stats.pausedCount}
          icon={PauseCircle}
          color="bg-orange-500"
        />
        <StatCard
          title="Cancelados"
          value={stats.canceledCount}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Total de Fluxos</p>
            <p className="text-xl font-bold">{stats.totalWorkflows}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Fluxos Atrasados</p>
            <p className="text-xl font-bold text-red-500">
              {stats.overdueCount}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Próximos do Prazo</p>
            <p className="text-xl font-bold text-orange-500">
              {stats.nearDeadlineCount}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Taxa de Conclusão</p>
            <p className="text-xl font-bold">
              {Math.round(stats.completionRate)}%
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Tempo Médio por Etapa</p>
            <p className="text-xl font-bold">
              {Math.round(stats.averageTimePerStep)} dias
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Dentro do Prazo</p>
            <p className="text-xl font-bold">{stats.onTrackCount}</p>
          </div>
        </div>
      </div>

      {Object.keys(stats.workflowsByTemplate).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Fluxos por Template</h3>
          <div className="space-y-2">
            {Object.entries(stats.workflowsByTemplate).map(
              ([template, count]) => (
                <div
                  key={template}
                  className="flex items-center justify-between">
                  <span className="text-gray-700">{template}</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {Object.keys(stats.workflowsByTeam).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Fluxos por Equipe</h3>
          <div className="space-y-2">
            {Object.entries(stats.workflowsByTeam).map(([team, count]) => (
              <div key={team} className="flex items-center justify-between">
                <span className="text-gray-700">{team}</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStats;
