import AppLayout from "@/components/AppLayout";
import KPIBar from "@/components/dashboard/KPIBar";
import RiskTable from "@/components/dashboard/RiskTable";
import AlertFeed from "@/components/dashboard/AlertFeed";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import HealthTrendChart from "@/components/dashboard/HealthTrendChart";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Herd Overview</h2>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              Meadowbrook Farm · 247 animals · Last sync <span className="text-primary">2 min ago</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-field-600 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-lime" />
            <span className="text-xs font-mono text-primary">Live Monitoring</span>
          </div>
        </div>

        <KPIBar />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <RiskTable />
            <AlertFeed />
          </div>
          <div className="space-y-6">
            <ActivityHeatmap />
            <HealthTrendChart />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
