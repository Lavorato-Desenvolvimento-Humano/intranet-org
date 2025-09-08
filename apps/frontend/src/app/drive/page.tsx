// app/drive/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FolderPlus,
  Clock,
  HardDrive,
  Users,
  FileText,
  Image,
  Video,
  Archive,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useDriveAuth } from "@/context/DriveAuthContext";
// import { useDrivePermissions } from "@/components/auth/DriveProtectedRoute";
import { CustomButton } from "@/components/ui/custom-button";
import { Loading } from "@/components/ui/loading";
import driveApiClient from "@/services/api/driveApiClient";

interface QuotaInfo {
  used: number;
  total: number;
  percentage: number;
}

interface RecentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  modifiedAt: string;
  modifiedBy: string;
}

interface DashboardStats {
  totalFiles: number;
  totalFolders: number;
  totalShared: number;
  recentActivity: number;
}

/**
 * Dashboard principal do Drive
 * Implementa RF04.1 - Dashboard Principal
 */
export default function DriveDashboard() {
  const router = useRouter();
  const { user } = useDriveAuth();
  //   const { canWrite, canUpload, canCreateFolder, isAdmin } =
  //     useDrivePermissions();

  // Estados
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [quotaResponse, filesResponse, statsResponse] =
        await Promise.allSettled([
          driveApiClient.getUserQuota(),
          loadRecentFiles(),
          loadStats(),
        ]);

      // Processar quota
      if (quotaResponse.status === "fulfilled") {
        setQuotaInfo(quotaResponse.value);
      }

      // Processar arquivos recentes
      if (filesResponse.status === "fulfilled") {
        setRecentFiles(filesResponse.value);
      }

      // Processar estatísticas
      if (statsResponse.status === "fulfilled") {
        setStats(statsResponse.value);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentFiles = async (): Promise<RecentFile[]> => {
    // Simulação - substituir pela chamada real à API
    return [
      {
        id: "1",
        name: "Relatório Q4 2024.pdf",
        type: "application/pdf",
        size: 2048000,
        modifiedAt: "2024-12-15T10:30:00Z",
        modifiedBy: "João Silva",
      },
      {
        id: "2",
        name: "Apresentação Cliente.pptx",
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        size: 5120000,
        modifiedAt: "2024-12-14T16:45:00Z",
        modifiedBy: "Maria Santos",
      },
    ];
  };

  const loadStats = async (): Promise<DashboardStats> => {
    // Simulação - substituir pela chamada real à API
    return {
      totalFiles: 156,
      totalFolders: 23,
      totalShared: 42,
      recentActivity: 12,
    };
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return FileText;
    if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
    return FileText;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loading size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {user?.fullName?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600">
            Gerencie seus arquivos e colabore com sua equipe
          </p>
        </div>

        {/* Ações rápidas */}
        <div className="flex space-x-3">
          {/* {canUpload && (
            <CustomButton
              onClick={() => router.push("/drive/upload")}
              className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </CustomButton>
          )} */}
          {/* {canCreateFolder && (
            <CustomButton
              onClick={() => router.push("/drive/files?action=new-folder")}
              variant="primary">
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </CustomButton>
          )} */}
        </div>
      </div>

      {/* Cards de estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total de Arquivos
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalFiles}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderPlus className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total de Pastas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalFolders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Compartilhados
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalShared}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Atividade Recente
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.recentActivity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uso de cota */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Uso de Espaço
                </h3>
                <HardDrive className="h-5 w-5 text-gray-400" />
              </div>

              {quotaInfo ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Usado: {formatFileSize(quotaInfo.used)}</span>
                      <span>Total: {formatFileSize(quotaInfo.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          quotaInfo.percentage > 90
                            ? "bg-red-600"
                            : quotaInfo.percentage > 80
                              ? "bg-yellow-600"
                              : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(quotaInfo.percentage, 100)}%`,
                        }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {quotaInfo.percentage.toFixed(1)}% utilizado
                    </p>
                  </div>

                  {quotaInfo.percentage > 80 && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-700">
                        {quotaInfo.percentage > 90
                          ? "Cota quase esgotada! Libere espaço ou entre em contato com o administrador."
                          : "Atenção: Você está usando mais de 80% da sua cota."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <Loading />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arquivos recentes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Arquivos Recentes
                </h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>

              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                        onClick={() => router.push(`/drive/files/${file.id}`)}>
                        <div className="flex-shrink-0">
                          <FileIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • Modificado por{" "}
                            {file.modifiedBy}
                          </p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <p className="text-xs text-gray-500">
                            {formatDate(file.modifiedAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum arquivo recente</p>
                  <p className="text-sm text-gray-400">
                    Seus arquivos recentes aparecerão aqui
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <CustomButton
                  onClick={() => router.push("/drive/files")}
                  variant="primary"
                  className="w-full">
                  Ver Todos os Arquivos
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas adicionais */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/drive/search")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Activity className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Buscar</span>
            <span className="text-xs text-gray-500">Encontrar arquivos</span>
          </button>

          <button
            onClick={() => router.push("/drive/shared")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">
              Compartilhados
            </span>
            <span className="text-xs text-gray-500">Arquivos em equipe</span>
          </button>

          <button
            onClick={() => router.push("/drive/starred")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
            <TrendingUp className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Favoritos</span>
            <span className="text-xs text-gray-500">Itens marcados</span>
          </button>

          {/* {isAdmin && (
            <button
              onClick={() => router.push("/drive/admin")}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <AlertCircle className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Admin</span>
              <span className="text-xs text-gray-500">Gerenciar sistema</span>
            </button>
          )} */}
        </div>
      </div>

      {/* Informações do sistema (apenas para admins) */}
      {/* {isAdmin && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-green-900">File Service</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-green-900">
                Permission Service
              </p>
              <p className="text-xs text-green-600">Online</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-green-900">
                Search Service
              </p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
        </div>
      )} */}

      {/* Dicas e avisos */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              Dicas do Drive
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Use pastas para organizar seus arquivos por projeto ou
                  departamento
                </li>
                <li>
                  Compartilhe arquivos com sua equipe para facilitar a
                  colaboração
                </li>
                <li>
                  Marque arquivos importantes como favoritos para acesso rápido
                </li>
                {quotaInfo && quotaInfo.percentage > 50 && (
                  <li>
                    Considere mover arquivos antigos para o arquivo morto para
                    liberar espaço
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
