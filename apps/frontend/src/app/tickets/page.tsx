// src/app/tickets/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { useTickets, TicketViewType } from "@/hooks/useTickets";
import { Ticket } from "@/types/ticket";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LayoutList, Inbox, UserCheck, PlusCircle } from "lucide-react";

export default function TicketsPage() {
  const router = useRouter();
  const {
    tickets,
    loading,
    viewType,
    setViewType,
    getPriorityColor,
    getPriorityLabel,
    getStatusColor,
    getStatusLabel,
  } = useTickets("my_assignments");

  // Definição das colunas para o DataTable
  const columns: Column<Ticket>[] = [
    {
      key: "id",
      header: "# ID",
      width: "80px",
      sortable: true,
      render: (val) => <span className="font-mono text-gray-600">#{val}</span>,
    },
    {
      key: "title",
      header: "Assunto",
      sortable: true,
      render: (val, item) => (
        <div>
          <div className="font-medium text-gray-900">{val}</div>
          <div className="text-xs text-gray-500 truncate max-w-[300px]">
            {item.targetTeamNome}
          </div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Prioridade",
      sortable: true,
      width: "120px",
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(val)}`}>
          {getPriorityLabel(val)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "120px",
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(val)}`}>
          {getStatusLabel(val)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Aberto em",
      sortable: true,
      width: "150px",
      render: (val) => (
        <span className="text-sm text-gray-600">
          {val
            ? format(new Date(val), "dd/MM/yy HH:mm", { locale: ptBR })
            : "-"}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Vencimento",
      sortable: true,
      width: "150px",
      render: (val, item) => {
        if (!val) return "-";
        const date = new Date(val);
        const isExpired =
          date < new Date() &&
          item.status !== "CLOSED" &&
          item.status !== "RESOLVED";
        return (
          <span
            className={`text-sm ${isExpired ? "text-red-600 font-bold" : "text-gray-600"}`}>
            {format(date, "dd/MM/yy HH:mm", { locale: ptBR })}
          </span>
        );
      },
    },
  ];

  // Componente de Abas para Filtragem
  const TabButton = ({
    type,
    label,
    icon: Icon,
  }: {
    type: TicketViewType;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setViewType(type)}
      className={`
        flex items-center px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
        ${
          viewType === type
            ? "border-primary text-primary bg-blue-50/50"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }
      `}>
      <Icon size={16} className="mr-2" />
      {label}
    </button>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service Desk</h1>
          <p className="text-gray-500">Gerencie seus chamados e atendimentos</p>
        </div>

        <button
          onClick={() => router.push("/tickets/novo")}
          className="flex items-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors shadow-sm">
          <PlusCircle size={18} className="mr-2" />
          Novo Chamado
        </button>
      </div>

      {/* Abas de Navegação */}
      <div className="flex border-b border-gray-200 mb-4">
        <TabButton
          type="my_assignments"
          label="Meus Atendimentos"
          icon={UserCheck}
        />
        <TabButton type="team_queue" label="Fila da Equipe" icon={Inbox} />
        <TabButton
          type="created_by_me"
          label="Meus Pedidos"
          icon={LayoutList}
        />
      </div>

      <DataTable
        title={
          viewType === "my_assignments"
            ? "Chamados sob minha responsabilidade"
            : viewType === "team_queue"
              ? "Chamados aguardando atendimento"
              : "Histórico de solicitações"
        }
        data={tickets}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchable={true}
        searchKeys={["title", "id", "status", "priority"]}
        onRowClick={(item) => router.push(`/tickets/${item.id}`)}
        emptyMessage="Nenhum chamado encontrado nesta visualização."
      />
    </div>
  );
}
