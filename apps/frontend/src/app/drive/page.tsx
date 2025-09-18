"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FolderPlus,
  Search,
  Grid,
  List,
  Filter,
  Download,
  Share2,
  MoreVertical,
  File,
  Folder,
  HardDrive,
} from "lucide-react";
import DriveProtectedRoute, {
  useDrivePermissions,
} from "@/components/auth/DriveProtectedRoute";
import DriveNavbar from "@/components/layout/DriveNavbar";
import { CustomButton } from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { DrivePermission } from "@/types/auth";
import toastUtil from "@/utils/toast";

interface DriveItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  modifiedAt: string;
  createdBy: string;
  mimeType?: string;
}

// Dados mock para demonstração
const mockDriveItems: DriveItem[] = [
  {
    id: "1",
    name: "Documentos",
    type: "folder",
    modifiedAt: "2024-01-15T10:30:00Z",
    createdBy: "João Silva",
  },
  {
    id: "2",
    name: "Projetos",
    type: "folder",
    modifiedAt: "2024-01-14T15:45:00Z",
    createdBy: "Maria Santos",
  },
  {
    id: "3",
    name: "Relatório_Q4_2024.pdf",
    type: "file",
    size: 2457600,
    modifiedAt: "2024-01-13T09:20:00Z",
    createdBy: "Carlos Lima",
    mimeType: "application/pdf",
  },
  {
    id: "4",
    name: "Apresentação_Vendas.pptx",
    type: "file",
    size: 5242880,
    modifiedAt: "2024-01-12T14:15:00Z",
    createdBy: "Ana Costa",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
];

/**
 * Página principal do Drive
 * Implementa RF04.1 - Dashboard Principal
 */
function DriveMainContent() {
  const router = useRouter();
  const { user, canUpload, canCreateFolder, canWrite, canDelete, canShare } =
    useDrivePermissions();

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Simular carregamento de dados
  useEffect(() => {
    const loadDriveItems = async () => {
      try {
        setLoading(true);
        // Simular delay da API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setItems(mockDriveItems);
      } catch (error) {
        console.error("Erro ao carregar itens:", error);
        toastUtil.error("Erro ao carregar arquivos e pastas");
      } finally {
        setLoading(false);
      }
    };

    loadDriveItems();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (item: DriveItem) => {
    if (item.type === "folder") {
      router.push(`/drive/folder/${item.id}`);
    } else {
      // Abrir preview ou download do arquivo
      console.log("Abrir arquivo:", item.name);
    }
  };

  const handleNewFolder = () => {
    if (!canCreateFolder) {
      toastUtil.error("Você não tem permissão para criar pastas");
      return;
    }
    // Implementar criação de pasta
    console.log("Criar nova pasta");
  };

  const handleUpload = () => {
    if (!canUpload) {
      toastUtil.error("Você não tem permissão para fazer upload");
      return;
    }
    // Implementar upload
    console.log("Fazer upload");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/drive/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DriveNavbar />

      <main className="container mx-auto px-4 py-6">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <HardDrive className="h-8 w-8 mr-3 text-blue-600" />
                Meu Drive
              </h1>
              <p className="text-gray-600 mt-1">Bem-vindo(a), {user?.name}</p>
            </div>

            {/* Ações principais */}
            <div className="flex items-center space-x-3">
              {canCreateFolder && (
                <CustomButton
                  onClick={handleNewFolder}
                  variant="primary"
                  className="flex items-center">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nova Pasta
                </CustomButton>
              )}

              {canUpload && (
                <CustomButton
                  onClick={handleUpload}
                  variant="primary"
                  className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </CustomButton>
              )}
            </div>
          </div>

          {/* Barra de ferramentas */}
          <div className="flex items-center justify-between">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar arquivos e pastas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Controles de visualização */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}>
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}>
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading message="Carregando arquivos..." />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "Nenhum resultado encontrado" : "Pasta vazia"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Tente ajustar sua busca"
                    : "Comece fazendo upload de arquivos ou criando pastas"}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Cabeçalho da tabela */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex-1">Nome</div>
                    <div className="w-24 hidden md:block">Tamanho</div>
                    <div className="w-32 hidden lg:block">Modificado</div>
                    <div className="w-32 hidden lg:block">Criado por</div>
                    <div className="w-12"></div>
                  </div>
                </div>

                {/* Lista de itens */}
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick(item)}>
                      <div className="flex items-center">
                        <div className="flex-1 flex items-center min-w-0">
                          {item.type === "folder" ? (
                            <Folder className="h-8 w-8 text-blue-500 mr-3" />
                          ) : (
                            <File className="h-8 w-8 text-gray-400 mr-3" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                          </div>
                        </div>

                        <div className="w-24 hidden md:block">
                          <p className="text-sm text-gray-500">
                            {item.size ? formatFileSize(item.size) : "-"}
                          </p>
                        </div>

                        <div className="w-32 hidden lg:block">
                          <p className="text-sm text-gray-500">
                            {formatDate(item.modifiedAt)}
                          </p>
                        </div>

                        <div className="w-32 hidden lg:block">
                          <p className="text-sm text-gray-500 truncate">
                            {item.createdBy}
                          </p>
                        </div>

                        <div className="w-12">
                          <button
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Menu de opções para:", item.name);
                            }}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Página principal do Drive com proteção de rota
 */
export default function DrivePage() {
  return (
    <DriveProtectedRoute requiredPermissions={[DrivePermission.READ]}>
      <DriveMainContent />
    </DriveProtectedRoute>
  );
}
