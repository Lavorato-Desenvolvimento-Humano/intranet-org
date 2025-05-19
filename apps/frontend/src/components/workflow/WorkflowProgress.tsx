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
      // Se a etapa existe, usá-la diretamente
      safeSteps.push({
        ...existingStep,
        status:
          i < currentStep
            ? "completed"
            : i === currentStep
              ? "in_progress"
              : "pending",
      });
    } else {
      // Tentar encontrar uma etapa com o mesmo índice no array original (para manter compatibilidade)
      const fallbackStep = i <= steps.length ? steps[i - 1] : null;

      safeSteps.push({
        name: fallbackStep?.name || `Etapa ${i}`,
        stepNumber: i,
        description: fallbackStep?.description,
        status:
          i < currentStep
            ? "completed"
            : i === currentStep
              ? "in_progress"
              : "pending",
      });
    }
  }

  return (
    <div className="w-full py-8">
      {/* Container externo com margens para não vazar */}
      <div className="mx-8 relative">
        {/* Container para linha de progresso e etapas */}
        <div className="relative">
          {/* Linha de progresso de fundo */}
          <div className="absolute top-4 inset-x-0 h-1 bg-gray-200"></div>

          {/* Linha de progresso colorida - só aparece se estivermos além da etapa 1 */}
          {currentStep > 1 && (
            <div
              className="absolute top-4 left-0 h-1 bg-primary"
              style={{
                // Calcula largura para parar antes da etapa atual (nunca vai até a borda)
                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              }}></div>
          )}

          {/* Etapas */}
          <div className="flex justify-between">
            {safeSteps.map((step, index) => {
              const isCompleted =
                step.status === "completed" || index + 1 < currentStep;
              const isCurrent = index + 1 === currentStep;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center relative z-10">
                  {/* Círculo da etapa */}
                  <div className="mb-8">
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8 text-primary bg-white rounded-full fill-primary" />
                    ) : isCurrent ? (
                      <Circle className="w-8 h-8 text-primary bg-white rounded-full stroke-primary stroke-2" />
                    ) : (
                      <Circle className="w-8 h-8 text-gray-300 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Nome da etapa */}
                  <span
                    className={`text-xs text-center w-20 ${
                      isCurrent
                        ? "text-primary font-medium"
                        : isCompleted
                          ? "text-primary"
                          : "text-gray-500"
                    }`}
                    title={step.description || step.name}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;
