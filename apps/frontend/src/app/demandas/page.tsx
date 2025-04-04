"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, ListFilter } from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import DemandaFilter from "@/components/ui/demanda-filter";
import DemandaCard from "@/components/ui/demanda-card";
import DemandaStatsCards from "@/components/ui/demanda-stats";
import Pagination from "@/components/ui/pagination";
import { Loading, CardLoading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";
import demandaService from "@/services/demanda";
import userService from "@/services/user";
import { Demanda, DemandaFilterParams, DemandaStats } from "@/types/demanda";
import { UserDto } from "@/services/user";

export default function DemandasPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Estados
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [stats, setStats] = useState<DemandaStats>({
    totalDemandas: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0,
    atrasadas: 0,
    proximasAVencer: 0,
  });
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusActionDemanda, setStatusActionDemanda] = useState<{
    id: string;
    status: string;
    titulo: string;
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<DemandaFilterParams>({
    page: 0,
    size: 10,
  });

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;
  const canCreate = true; // Todos podem criar demandas
  const canSeeAll = isAdmin || isSupervisor; // Supervisores e admin podem ver todas

  // Carregar demandas
  const loadDemandas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiFilters = {
        ...filters,
        page: currentPage - 1, // Ajustar para indexação baseada em 0
      };

      // Chamar API com base nas permissões
      const response = canSeeAll
        ? await demandaService.getAllDemandas(apiFilters)
        : await demandaService.getMinhasDemandas(apiFilters);

      setDemandas(response.content);
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Erro ao carregar demandas:", error);
      setError(
        "Não foi possível carregar as demandas. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      setIsStatsLoading(true);
      const statsData = await demandaService.getDemandaStats();
      setStats(statsData);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      // Não exibimos erro para estatísticas, apenas log
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Carregar usuários para filtro
  const loadUsuarios = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsuarios(response);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      // Não exibimos erro para usuários, apenas log
    }
  };

  // Efeito para carregar os dados iniciais
  useEffect(() => {
    loadDemandas();
    loadStats();
    loadUsuarios();
  }, [currentPage, filters, canSeeAll]);

  // Lidar com mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Lidar com mudança de filtros
  const handleFilterChange = (newFilters: DemandaFilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetar para a primeira página ao filtrar
  };

  // Navegar para a página de criação de demanda
  const handleCreateDemanda = () => {
    router.push("/demandas/nova");
  };

  // Abrir diálogo de confirmação para mudança de status
  const handleStatusChange = (id: string, status: string) => {
    const demanda = demandas.find((d) => d.id === id);
    if (demanda) {
      setStatusActionDemanda({
        id,
        status,
        titulo: demanda.titulo,
      });
      setIsConfirmOpen(true);
    }
  };

  // Confirmar mudança de status
  const confirmStatusChange = async () => {
    if (!statusActionDemanda) return;

    try {
      setIsStatusUpdateLoading(true);
      await demandaService.updateDemandaStatus(
        statusActionDemanda.id,
        statusActionDemanda.status
      );

      // Atualizar a lista
      await loadDemandas();
      await loadStats();

      toastUtil.success(
        `Demanda "${statusActionDemanda.titulo}" ${
          statusActionDemanda.status === "em_andamento"
            ? "iniciada"
            : "concluída"
        } com sucesso!`
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toastUtil.error("Não foi possível atualizar o status da demanda.");
    } finally {
      setIsStatusUpdateLoading(false);
      setIsConfirmOpen(false);
      setStatusActionDemanda(null);
    }
  };

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[{ label: "Demandas", href: "/demandas" }]}
        showHome={true}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {canSeeAll ? "Todas as Demandas" : "Minhas Demandas"}
        </h1>
        <div className="flex space-x-4">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700"
              }`}
              title="Visualização em lista">
              <ListFilter size={20} />
            </button>
            <button
              onClick={() => router.push("/demandas/calendario")}
              className={`px-3 py-2 ${
                viewMode === "calendar"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700"
              }`}
              title="Visualização em calendário">
              <Calendar size={20} />
            </button>
          </div>
          {canCreate && (
            <CustomButton
              onClick={handleCreateDemanda}
              icon={Plus}
              variant="primary">
              Nova Demanda
            </CustomButton>
          )}
        </div>
      </div>

      <DemandaStatsCards
        stats={stats}
        loading={isStatsLoading}
        className="mb-6"
      />

      <DemandaFilter
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        usuarios={canSeeAll ? usuarios : []}
        showUserFilter={canSeeAll}
      />

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardLoading key={index} />
          ))}
        </div>
      ) : demandas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">
            Nenhuma demanda encontrada com os filtros atuais.
          </p>
          <CustomButton onClick={handleCreateDemanda} variant="primary">
            Criar Nova Demanda
          </CustomButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demandas.map((demanda) => (
            <DemandaCard
              key={demanda.id}
              demanda={demanda}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          pageSize={filters.size || 10}
        />
      )}

      {/* Diálogo de confirmação para mudança de status */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={
          statusActionDemanda?.status === "em_andamento"
            ? "Iniciar Demanda"
            : "Concluir Demanda"
        }
        message={
          statusActionDemanda?.status === "em_andamento"
            ? `Tem certeza que deseja iniciar a demanda "${statusActionDemanda?.titulo}"?`
            : `Tem certeza que deseja marcar a demanda "${statusActionDemanda?.titulo}" como concluída?`
        }
        confirmText={
          statusActionDemanda?.status === "em_andamento"
            ? "Iniciar"
            : "Concluir"
        }
        onConfirm={confirmStatusChange}
        onCancel={() => {
          setIsConfirmOpen(false);
          setStatusActionDemanda(null);
        }}
        variant={
          statusActionDemanda?.status === "em_andamento" ? "info" : "success"
        }
        isLoading={isStatusUpdateLoading}
      />
    </div>
  );
}
