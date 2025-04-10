// apps/frontend/src/app/demandas/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, ListFilter, RefreshCw } from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import DemandaCalendar from "@/components/ui/demanda-calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { useAuth } from "@/context/AuthContext";
import demandaService from "@/services/demanda";
import { DemandaEvent } from "@/types/demanda";
import { format } from "date-fns";
import Navbar from "@/components/layout/Navbar";

// Flag global para desativar completamente o carregamento automático
const DISABLE_AUTO_LOADING = true;

export default function DemandasPage() {
  const { user } = useAuth();

  // Estados
  const [events, setEvents] = useState<DemandaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRange, setCurrentRange] = useState({
    start: new Date(),
    end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Usar refs para controle
  const isComponentMounted = useRef(true);
  const isLoadingRef = useRef(false);

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;
  const canCreate = true;
  const canSeeAll = isAdmin || isSupervisor;

  // Ao desmontar componente
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Carregar eventos de forma controlada
  const loadEvents = async (showLoadingIndicator = true) => {
    // Evitar carregamento duplo
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      if (showLoadingIndicator) {
        setIsLoading(true);
      }
      setError(null);

      // Formatar datas para API
      const start = format(currentRange.start, "yyyy-MM-dd");
      const end = format(currentRange.end, "yyyy-MM-dd");

      console.log(`Carregando demandas de ${start} até ${end}`);

      // Chamar API
      const data = await demandaService.getDemandasCalendario(start, end);

      // Verificar se componente ainda está montado antes de atualizar estado
      if (isComponentMounted.current) {
        setEvents(Array.isArray(data) ? data : []);
        setHasLoadedOnce(true);
      }
    } catch (error: any) {
      console.error("Erro ao carregar eventos:", error);
      if (isComponentMounted.current) {
        setError(
          error?.message ||
            "Não foi possível carregar as demandas para o calendário."
        );
      }
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
      isLoadingRef.current = false;
    }
  };

  // Lidar com mudança de intervalo de forma manual
  const handleRangeChange = (start: Date, end: Date) => {
    setCurrentRange({ start, end });
    // Não carrega automaticamente com mudança de intervalo
  };

  // Tentar novamente manualmente
  const handleRetry = () => {
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar fixa no topo */}
      <Navbar />

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        <Breadcrumb items={[{ label: "Demandas" }]} showHome={true} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Calendário de Demandas
          </h1>
          <div className="flex space-x-4">
            {/* Botão de atualização manual */}
            <CustomButton
              onClick={handleRetry}
              variant="primary"
              icon={RefreshCw}
              className={isLoading ? "animate-spin" : ""}>
              {isLoading ? "Carregando..." : "Atualizar"}
            </CustomButton>

            {/* Link para nova demanda - rota corrigida */}
            {canCreate && (
              <a
                href="/demandas/nova"
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-light text-white font-medium rounded-md transition-colors">
                <Plus size={20} className="mr-2" />
                Nova Demanda
              </a>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            <AlertDescription>
              {error}
              <button
                onClick={handleRetry}
                className="ml-2 underline text-primary hover:text-primary-dark">
                Tentar novamente
              </button>
            </AlertDescription>
          </Alert>
        )}

        {!hasLoadedOnce && !isLoading && (
          <div className="text-center py-8 bg-white rounded-lg shadow mb-6">
            <p className="mb-4">
              Clique no botão "Atualizar" para carregar as demandas do
              calendário.
            </p>
            <CustomButton onClick={handleRetry} variant="primary">
              Carregar Demandas
            </CustomButton>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
          <DemandaCalendar
            events={events}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Legenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Prioridade Baixa</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span>Prioridade Média</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Prioridade Alta</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>Pendente</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-600 mr-2"></div>
              <span>Concluída</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
