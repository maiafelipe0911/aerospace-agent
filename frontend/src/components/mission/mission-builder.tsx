import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMissionStore } from "@/stores/mission-store";
import { StepIndicator } from "./step-indicator";
import { StepMissionDefinition } from "./steps/step-mission-definition";
import { StepTransferAnalysis } from "./steps/step-transfer-analysis";
import { StepSpacecraftConfig } from "./steps/step-spacecraft-config";
import { StepPropellantAnalysis } from "./steps/step-propellant-analysis";
import { StepMissionSummary } from "./steps/step-mission-summary";
import { ispToExhaustVelocity } from "@/lib/mission-math";

const TOTAL_STEPS = 5;

export function MissionBuilder() {
  const currentStep = useMissionStore((s) => s.currentStep);
  const maxReachedStep = useMissionStore((s) => s.maxReachedStep);
  const setStep = useMissionStore((s) => s.setStep);
  const resetMission = useMissionStore((s) => s.resetMission);

  // Validation for each step
  const originAltitudeKm = useMissionStore((s) => s.originAltitudeKm);
  const destinationAltitudeKm = useMissionStore((s) => s.destinationAltitudeKm);
  const activePreset = useMissionStore((s) => s.activePreset);
  const hohmannResult = useMissionStore((s) => s.hohmannResult);
  const hohmannLoading = useMissionStore((s) => s.hohmannLoading);
  const dryMassKg = useMissionStore((s) => s.dryMassKg);
  const propellantCapacityKg = useMissionStore((s) => s.propellantCapacityKg);
  const ispSeconds = useMissionStore((s) => s.ispSeconds);
  const exhaustVelocityKmS = useMissionStore((s) => s.exhaustVelocityKmS);
  const inputMode = useMissionStore((s) => s.inputMode);
  const tsiolkovskyResult = useMissionStore((s) => s.tsiolkovskyResult);
  const tsiolkovskyLoading = useMissionStore((s) => s.tsiolkovskyLoading);

  function canAdvance(): boolean {
    switch (currentStep) {
      case 0: // Mission Definition
        return (
          activePreset !== null &&
          originAltitudeKm != null &&
          originAltitudeKm > 0 &&
          destinationAltitudeKm != null &&
          destinationAltitudeKm > 0 &&
          originAltitudeKm !== destinationAltitudeKm
        );
      case 1: // Transfer Analysis
        return hohmannResult !== null && !hohmannLoading;
      case 2: { // Spacecraft Config
        const hasVe =
          inputMode === "isp"
            ? ispSeconds != null && ispSeconds > 0
            : exhaustVelocityKmS != null && exhaustVelocityKmS > 0;
        return (
          dryMassKg != null &&
          dryMassKg > 0 &&
          propellantCapacityKg != null &&
          propellantCapacityKg > 0 &&
          hasVe
        );
      }
      case 3: // Propellant Analysis
        return tsiolkovskyResult !== null && !tsiolkovskyLoading;
      default:
        return false;
    }
  }

  function handleNext() {
    if (currentStep < TOTAL_STEPS - 1 && canAdvance()) {
      // Ensure exhaust velocity is synced before advancing from step 2
      if (currentStep === 2 && inputMode === "isp" && ispSeconds != null) {
        useMissionStore
          .getState()
          .setExhaustVelocity(ispToExhaustVelocity(ispSeconds));
      }
      setStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  }

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="shrink-0 border-b border-border px-4">
        <StepIndicator
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepClick={setStep}
        />
      </div>

      {/* Step content */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6">
          {currentStep === 0 && <StepMissionDefinition />}
          {currentStep === 1 && <StepTransferAnalysis />}
          {currentStep === 2 && <StepSpacecraftConfig />}
          {currentStep === 3 && <StepPropellantAnalysis />}
          {currentStep === 4 && <StepMissionSummary />}
        </div>
      </ScrollArea>

      {/* Navigation buttons */}
      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLastStep ? (
            <Button size="sm" onClick={resetMission}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              New Mission
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canAdvance()}
            >
              Next
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
