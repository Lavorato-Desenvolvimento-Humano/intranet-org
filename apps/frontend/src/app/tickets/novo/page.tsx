// src/app/tickets/novo/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ticketService } from "@/services/ticket";
import equipeService from "@/services/equipe";
import { TicketPriority } from "@/types/ticket";
import toast from "@/utils/toast";
import { ArrowLeft, Save, Loader2, UploadCloud } from "lucide-react";
import { EquipeDto } from "@/services/equipe";

// Schema de Validação
const createTicketSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "Descreva seu problema com mais detalhes"),
  priority: z.nativeEnum(TicketPriority, {
    errorMap: () => ({ message: "Selecione uma prioridade" }),
  }),
  targetTeamId: z.string().uuid("Selecione uma equipe válida"),
  // O arquivo é tratado separadamente do hook-form register puro devido ao input file
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

export default function NewTicketPage() {
  const router = useRouter();
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: TicketPriority.MEDIUM,
    },
  });

  // Carregar equipes para o select
  useEffect(() => {
    const loadEquipes = async () => {
      try {
        // Ajuste para o método real do seu service de equipes
        const data = await equipeService.getAllEquipes();
        setEquipes(data);
      } catch (error) {
        toast.error("Erro ao carregar lista de equipes");
      }
    };
    loadEquipes();
  }, []);

  const onSubmit = async (data: CreateTicketForm) => {
    try {
      setIsSubmitting(true);

      await ticketService.create({
        ...data,
        file: selectedFile || undefined,
      });

      toast.success("Chamado aberto com sucesso!");
      router.push("/tickets");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao abrir chamado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Abrir Novo Chamado</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Problema
            </label>
            <input
              {...register("title")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Impressora do RH não está funcionando"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Equipe e Prioridade (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipe de Destino
              </label>
              <select
                {...register("targetTeamId")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                <option value="">Selecione uma equipe...</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </select>
              {errors.targetTeamId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.targetTeamId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                {...register("priority")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                <option value="LOW">Baixa (48h)</option>
                <option value="MEDIUM">Média (24h)</option>
                <option value="HIGH">Alta (8h)</option>
                <option value="CRITICAL">Crítica (4h)</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Detalhada
            </label>
            <textarea
              {...register("description")}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
              placeholder="Descreva o passo a passo do problema ou solicitação..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Upload de Arquivo Simples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anexar Arquivo (Opcional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para enviar</span> ou
                    arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedFile
                      ? `Selecionado: ${selectedFile.name}`
                      : "PDF, Imagens, Planilhas"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Abrir Chamado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
