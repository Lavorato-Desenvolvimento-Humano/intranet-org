// src/components/workflow/WorkflowProgress.tsx
import React from "react";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { name: string; status?: "pending" | "in_progress" | "completed" }[];
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gray-200 w-full"></div>
        <div
          className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-primary"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}></div>

        {/* Etapas */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="relative">
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-primary bg-white rounded-full" />
                  ) : isCurrent ? (
                    <Circle className="w-8 h-8 text-primary fill-white stroke-primary bg-white rounded-full" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 max-w-24 text-center ${isCurrent ? "text-primary font-medium" : "text-gray-500"}`}>
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
