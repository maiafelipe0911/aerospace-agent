import { Check } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

const STEPS = ["Mission", "Transfer", "Spacecraft", "Propellant", "Summary"];

interface StepIndicatorProps {
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  maxReachedStep,
  onStepClick,
}: StepIndicatorProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-2">
      {STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isClickable = i <= maxReachedStep;

        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div
                className={`h-px w-4 sm:w-8 ${
                  i <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={`
                flex items-center gap-1.5 rounded-full transition-colors
                ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}
                ${
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : ""
                }
              `}
            >
              <div
                className={`
                  flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium
                  ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {!isMobile && (
                <span
                  className={`text-xs font-medium pr-1 ${
                    isActive
                      ? "text-foreground"
                      : isCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
