// apps/frontend/src/app/demandas/calendario/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ListFilter } from "lucide-react";
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

export default function DemandaCalendarPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Estados
  const [events, setEvents] = useState<DemandaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRange, setCurrentRange] = useState({
    start: new Date(),
    end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });

  // Use refs para evitar loops infinitos
  const isLoadingRef = useRef(false);
  const loadAttemptRef = useRef(0);

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;
  const canCreate = true; // Todos podem criar demandas
  const canSeeAll = isAdmin || isSupervisor; // Supervisores e admin podem ver todas

  // Carregar eventos para o calendário com proteção contra loop infinito
  const loadEvents = async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingRef.current) return;

    // Limitar a 3 tentativas para evitar loops infinitos
    if (loadAttemptRef.current >= 3) {
      console.log("Máximo de tentativas atingido");
      setError(
        "Número máximo de tentativas excedido. Aguarde ou recarregue a página."
      );
      setIsLoading(false);
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      loadAttemptRef.current += 1;
      console.log(`Tentativa ${loadAttemptRef.current} de carregar eventos`);

      // Formatar datas para API - formato ISO (YYYY-MM-DD)
      const start = format(currentRange.start, "yyyy-MM-dd");
      const end = format(currentRange.end, "yyyy-MM-dd");

      // Chamar API para obter eventos do calendário
      const data = await demandaService.getDemandasCalendario(start, end);
      console.log("Dados recebidos da API:", data);

      // Garantir que data é sempre um array
      setEvents(Array.isArray(data) ? data : []);

      // Reset contador após sucesso
      loadAttemptRef.current = 0;
    } catch (error: any) {
      console.error("Erro ao carregar eventos:", error);
      setError(
        error?.message ||
          "Não foi possível carregar as demandas para o calendário."
      );
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Carregar eventos apenas na montagem do componente e quando canSeeAll mudar
  // Isolando do ciclo de atualização de currentRange
  useEffect(() => {
    // Resetar contador quando a dependência crítica mudar
    loadAttemptRef.current = 0;
    loadEvents();
  }, [canSeeAll, user]); // Removendo currentRange das dependências

  // Função para lidar com mudança de intervalo
  const handleRangeChange = (start: Date, end: Date) => {
    // Atualizar o estado
    setCurrentRange({ start, end });

    // Carregar dados apenas se tivermos feito menos de 3 tentativas recentemente
    if (loadAttemptRef.current < 3) {
      // Resetar tentativas para este novo intervalo
      loadAttemptRef.current = 0;
      loadEvents();
    }
  };

  // Tentar novamente se ocorrer um erro
  const handleRetry = () => {
    loadAttemptRef.current = 0; // Resetar tentativas
    loadEvents();
  };

  // Navegar para a página de criação de demanda
  const handleCreateDemanda = () => {
    router.push("/demandas/nova");
  };

  return (
    <div className="container py-8">
      <Navbar />
      <Breadcrumb
        items={[
          { label: "Demandas", href: "/demandas" },
          { label: "Calendário" },
        ]}
        showHome={true}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Calendário de Demandas
        </h1>
        <div className="flex space-x-4">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => router.push("/demandas")}
              className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-100"
              title="Visualização em lista">
              <ListFilter size={20} />
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
  );
}
