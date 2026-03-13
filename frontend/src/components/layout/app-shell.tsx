import { useUIStore } from "@/stores/ui-store";
import { Header } from "./header";
import { SidebarContent } from "./sidebar";
import { RightPanel } from "./right-panel";
import { ChatArea } from "../chat/chat-area";
import { MissionBuilder } from "../mission/mission-builder";
import { OrbitViewerDialog } from "../visualization/orbit-viewer-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const activeView = useUIStore((s) => s.activeView);

  const isMobile = useMediaQuery("(max-width: 767px)");
  const isWide = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: sheet on mobile, fixed on desktop */}
        {isMobile ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        ) : (
          <aside
            className="w-[280px] border-r border-border shrink-0 overflow-y-auto transition-[width] duration-200"
            style={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
          >
            <SidebarContent />
          </aside>
        )}

        {/* Center: chat or mission builder */}
        <main className="flex-1 min-w-0">
          {activeView === "chat" ? <ChatArea /> : <MissionBuilder />}
        </main>

        {/* Right panel: only on wide screens */}
        {isWide && rightPanelOpen && (
          <aside className="w-[360px] shrink-0 overflow-y-auto">
            <RightPanel />
          </aside>
        )}
      </div>

      {/* Fullscreen orbit visualization dialog */}
      <OrbitViewerDialog />
    </div>
  );
}
