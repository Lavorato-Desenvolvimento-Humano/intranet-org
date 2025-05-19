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
  // Criar um array com todas as etapas do fluxo de trabalho
  const safeSteps = [];

  // Preencher o array com as etapas fornecidas
  for (let i = 1; i <= totalSteps; i++) {
    // Procurar a etapa correspondente pelo stepNumber
    const existingStep = steps.find((step) => step.stepNumber === i);

    if (existingStep) {
      // Se encontrou a etapa, adiciona ao array
      safeSteps.push(existingStep);
    } else {
      // Se não encontrou, cria uma etapa padrão
      safeSteps.push({
        name: `Etapa ${i}`,
        stepNumber: i,
        status:
          i < currentStep
            ? "completed"
            : i === currentStep
              ? "in_progress"
              : "pending",
        description: undefined,
      });
    }
  }

  return (
    <div className="w-full py-6">
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200"></div>
        <div
          className="absolute top-4 left-0 h-1 bg-primary"
          style={{
            width: `${((currentStep - 1) / Math.max(totalSteps - 1, 1)) * 100}%`,
          }}></div>

        {/* Etapas */}
        <div className="relative flex justify-between">
          {safeSteps.map((step, index) => {
            const isCompleted =
              step.status === "completed" || index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;

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
