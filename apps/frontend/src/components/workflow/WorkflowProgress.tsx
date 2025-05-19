// src/components/workflow/WorkflowProgress.tsx
import React from "react";
import { CheckCircle, Circle } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    name: string;
    stepNumber: number;
    description?: string;
    status?: "pending" | "in_progress" | "completed";
  }[];
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  // Ordene as etapas fornecidas pelo stepNumber
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  // Verificar se todas as etapas estão presentes, do 1 até totalSteps
  const safeSteps = [];

  for (let i = 1; i <= totalSteps; i++) {
    // Buscar etapa no array ordenado
    const existingStep = sortedSteps.find((step) => step.stepNumber === i);

    if (existingStep) {
      // Se a etapa existe, usá-la mantendo seu status original
      safeSteps.push(existingStep);
    } else {
      // Se não existir, cria uma nova com status baseado na posição relativa
      safeSteps.push({
        name: `Etapa ${i}`,
        stepNumber: i,
        description: "",
        status:
          i < currentStep
            ? "completed"
            : i === currentStep
              ? "in_progress"
              : "pending",
      });
    }
  }

  // Calcular a largura da barra de progresso com base nas etapas COMPLETADAS
  const completedSteps = safeSteps.filter(
    (step) => step.status === "completed"
  ).length;
  const progressPercentage =
    totalSteps > 1
      ? (completedSteps / (totalSteps - 1)) * 100
      : completedSteps === totalSteps
        ? 100
        : 0;

  return (
    <div className="w-full py-6">
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200"></div>
        <div
          className="absolute top-4 left-0 h-1 bg-primary"
          style={{
            width: `${progressPercentage}%`,
          }}></div>

        {/* Etapas */}
        <div className="relative flex justify-between">
          {safeSteps.map((step, index) => {
            const isCompleted = step.status === "completed";
            const isCurrent =
              step.status === "in_progress" || index + 1 === currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Ícone da etapa com espaçamento adequado */}
                <div className="mb-8">
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-primary bg-white rounded-full fill-primary" />
                  ) : isCurrent ? (
                    <Circle className="w-8 h-8 text-primary bg-white rounded-full stroke-primary stroke-2" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300 bg-white rounded-full" />
                  )}
                </div>

                {/* Nome da etapa com tooltip para descrição quando disponível */}
                <span
                  className={`text-xs max-w-24 text-center ${
                    isCurrent
                      ? "text-primary font-medium"
                      : isCompleted
                        ? "text-primary"
                        : "text-gray-500"
                  }`}
                  title={step.description || step.name} // Mostrar a descrição como tooltip
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;
