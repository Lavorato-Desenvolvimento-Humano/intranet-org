"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import dashboardService, { DashboardData } from "@/services/dashboardService";
// import ConvenioCard from "@/components/dashboard/ConvenioCard";
// import PostagemList from "@/components/dashboard/PostagemList";
// import Sidebar from "@/components/dashboard/Sidebar";
// import Loading from "@/components/ui/loading";
import toastUtil from "@/utils/toast";
import { RefreshCw } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getDashboardData(5, 4);
      setDashboardData(data);
    } catch (error: any) {
      console.error("Erro ao carregar dados da dashboard:", error);

      if (error.response?.status === 401) {
        setError("Sua sessão expirou. Por favor, faça login novamente.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError(
          "Erro ao carregar os dados da dashboard. Tente novamente mais tarde."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  //   if (loading) {
  //     return <Loading message="Carregando dashboard..." />;
  //   }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Erro ao carregar dashboard
          </h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <CustomButton
            onClick={handleRefresh}
            icon={RefreshCw}
            className="w-full">
            Tentar novamente
          </CustomButton>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Sem dados disponíveis</h2>
          <p className="mb-6 text-gray-700">
            Não foi possível carregar os dados da dashboard.
          </p>
          <CustomButton
            onClick={handleRefresh}
            icon={RefreshCw}
            className="w-full">
            Tentar novamente
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar com lista de convênios */}
      {/* <Sidebar convenios={dashboardData.allConvenios} /> */}

      {/* Conteúdo principal */}
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <CustomButton
              onClick={handleRefresh}
              variant="secondary"
              icon={RefreshCw}
              size="small">
              Atualizar
            </CustomButton>
          </div>

          {/* Seção de postagens recentes */}
          {/* <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Postagens Recentes
            </h2>
            {dashboardData.recentPostagens.length > 0 ? (
              <PostagemList postagens={dashboardData.recentPostagens} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">
                  Nenhuma postagem recente encontrada.
                </p>
              </div>
            )}
          </section> */}

          {/* Cards de convênios com suas últimas postagens */}
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Convênios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* {dashboardData.conveniosWithPostagens.map((convenio) => (
                <ConvenioCard key={convenio.id} convenio={convenio} />
              ))}

              {dashboardData.conveniosWithPostagens.length === 0 && (
                <div className="col-span-4 bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">Nenhum convênio encontrado.</p>
                </div>
              )} */}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
  //oi
}
