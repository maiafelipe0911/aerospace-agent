import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
