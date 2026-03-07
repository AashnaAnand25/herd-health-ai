import AppLayout from "@/components/AppLayout";
import { PENS, getAnimalsByPenId, BARN_NAMES, type Animal, type Pen, type RiskLevel } from "@/data/syntheticData";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Activity, Thermometer, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

const PIPELINE_NODES = [
  { label: "Sensor", icon: "📡", desc: "Accelerometer + Gyroscope" },
  { label: "Edge", icon: "⚡", desc: "On-device preprocessing" },
  { label: "Risk Model", icon: "🧠", desc: "LSTM + threshold baseline" },
  { label: "Dashboard", icon: "📊", desc: "Real-time aggregation" },
  { label: "Alert", icon: "🔔", desc: "SMS + push notifications" },
];

function Sparkline({ data, alertState }: { data: number[]; alertState: boolean }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[0, 100]} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke={alertState ? "hsl(3 79% 57%)" : "hsl(88 100% 62%)"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function getDisplayName(animal: Animal): string {
  return animal.barnName ?? BARN_NAMES[animal.id] ?? `Tag #${animal.id}`;
}

const RISK_ORDER: RiskLevel[] = ["HIGH", "MEDIUM", "LOW", "NO-CALL"];
function sortByRisk(animals: Animal[]): Animal[] {
  return [...animals].sort((a, b) => RISK_ORDER.indexOf(a.riskLevel) - RISK_ORDER.indexOf(b.riskLevel));
}

function cowCardStyles(level: RiskLevel): string {
  const base = "rounded-2xl border-2 p-5 text-left transition-all hover:brightness-110 ";
  if (level === "HIGH")
    return base + "border-danger bg-danger/10 shadow-[0_0_20px_hsl(3_79%_57%_/0.15)] card-danger";
  if (level === "MEDIUM")
    return base + "border-warning bg-warning/10 shadow-[0_0_16px_hsl(37_91%_55%_/0.12)]";
  if (level === "LOW")
    return base + "border-healthy/50 bg-healthy/5";
  return base + "border-border bg-field-700/80";
}

type View = "pens" | "cows";

export default function LiveFeed() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("pens");
  const [selectedPenId, setSelectedPenId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [scrubber, setScrubber] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsed(e => {
        if (e >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return e + 1;
      });
      setScrubber(s => Math.min(100, s + 1));
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const selectedPen = selectedPenId ? PENS.find(p => p.id === selectedPenId) ?? null : null;
  const animalsInPen = selectedPenId ? sortByRisk(getAnimalsByPenId(selectedPenId)) : [];

  const handlePenClick = (pen: Pen) => {
    setSelectedPenId(pen.id);
    setView("cows");
  };

  const handleBackToPens = () => {
    setSelectedPenId(null);
    setView("pens");
  };

  const handleCowClick = (animal: Animal) => {
    navigate(`/animal/${animal.id}`);
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Simulated banner */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle size={14} className="text-warning flex-shrink-0" />
          <p className="text-sm font-mono text-warning">
            <strong>Simulated Live Mode</strong> — Hardware sensors not connected. Data replay uses synthetic 24-hour dataset.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">Live Sensor Feed</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{new Date().toLocaleTimeString()}</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-lime" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "pens" && (
            <motion.div
              key="pens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Pen Grid — clickable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {PENS.map((pen, i) => (
                  <motion.button
                    key={pen.id}
                    type="button"
                    onClick={() => handlePenClick(pen)}
                    className={`w-full text-left card-glass rounded-xl overflow-hidden transition-all cursor-pointer hover:border-primary/40 ${
                      pen.status === "alert"
                        ? "card-danger"
                        : pen.status === "warning"
                          ? "border border-warning/30"
                          : ""
                    }`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div
                      className={`px-4 py-2.5 border-b flex items-center justify-between ${
                        pen.status === "alert" ? "border-danger/30 bg-danger/5" : "border-border"
                      }`}
                    >
                      <div>
                        <h3 className="font-display text-sm font-semibold text-foreground">{pen.name}</h3>
                        <p className="text-[10px] font-mono text-muted-foreground">{pen.animalCount} animals</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {pen.status === "alert" && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/20 border border-danger/40 text-xs font-mono text-danger animate-pulse-danger">
                            <AlertTriangle size={10} />
                            {pen.alertCount} FLAGGED
                          </span>
                        )}
                        {pen.status === "warning" && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 border border-warning/30 text-xs font-mono text-warning">
                            <AlertTriangle size={10} />
                            WATCH
                          </span>
                        )}
                        {pen.status === "normal" && (
                          <span className="w-2.5 h-2.5 rounded-full bg-healthy shadow-[0_0_6px_hsl(var(--healthy)_/_0.6)]" />
                        )}
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Activity size={10} /> Activity
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              pen.avgActivity < 40 ? "text-danger" : pen.avgActivity < 60 ? "text-warning" : "text-primary"
                            }`}
                          >
                            {pen.avgActivity}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-field-600 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${pen.avgActivity}%`,
                              background:
                                pen.avgActivity < 40
                                  ? "hsl(3 79% 57%)"
                                  : pen.avgActivity < 60
                                    ? "hsl(37 91% 55%)"
                                    : "hsl(88 100% 62%)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pen.avgActivity}%` }}
                            transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-mono">
                          <Thermometer
                            size={11}
                            className={pen.temperature > 39.5 ? "text-warning" : "text-muted-foreground"}
                          />
                          <span
                            className={pen.temperature > 39.5 ? "text-warning" : "text-muted-foreground"}
                          >
                            {pen.temperature}°C avg
                          </span>
                        </div>
                        <div className="w-24">
                          <Sparkline data={pen.sparkline} alertState={pen.status === "alert"} />
                        </div>
                      </div>

                      {pen.status === "alert" && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-danger border-t border-danger/20 pt-2">
                          <AlertTriangle size={11} />
                          Unusual inactivity cluster detected
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {view === "cows" && selectedPen && (
            <motion.div
              key="cows"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={handleBackToPens}
                className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
                Back to pens
              </button>

              <div className="space-y-4">
                <div className="px-1">
                  <h3 className="font-display text-xl font-bold text-foreground">{selectedPen.name}</h3>
                  <p className="text-sm font-mono text-muted-foreground mt-1">
                    {animalsInPen.length} animals · Tap a cow for full sensor data
                  </p>
                </div>

                {animalsInPen.length === 0 ? (
                  <div className="card-glass rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground font-mono">
                    No animal records in demo data for this pen. Connect hardware or add more synthetic animals.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {animalsInPen.map((animal, i) => (
                      <motion.button
                        key={animal.id}
                        type="button"
                        onClick={() => handleCowClick(animal)}
                        className={`w-full min-h-[120px] flex flex-col items-stretch gap-3 ${cowCardStyles(animal.riskLevel)}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xl font-display font-bold text-foreground truncate">
                              {getDisplayName(animal)}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              Tag #{animal.id} · {animal.breed}
                            </p>
                          </div>
                          <ChevronRight size={22} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-mono text-muted-foreground">
                          <span>{animal.temperature}°C</span>
                          <span>{animal.lastActivity}</span>
                        </div>
                        {animal.alertReason && (
                          <div
                            className={`mt-auto rounded-xl border-2 px-4 py-3 text-left ${
                              animal.riskLevel === "HIGH"
                                ? "border-danger bg-danger/15 text-danger"
                                : "border-warning bg-warning/15 text-warning"
                            }`}
                          >
                            <p className="flex items-center gap-2 text-sm font-semibold">
                              <AlertTriangle size={16} className="flex-shrink-0" />
                              {animal.alertReason}
                            </p>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Replay */}
        <div className="card-glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">Data Replay — 24hr Simulation</h3>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Scrub through a simulated day to see how alerts appear over time
              </p>
            </div>
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (!isPlaying) {
                  setElapsed(0);
                  setScrubber(0);
                }
              }}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                isPlaying
                  ? "bg-warning/20 text-warning border border-warning/30"
                  : "bg-primary text-primary-foreground shadow-glow-lime"
              }`}
            >
              {isPlaying ? "⏹ Stop" : "▶ Play Replay"}
            </button>
          </div>

          <div className="relative mb-2">
            <input
              type="range"
              min={0}
              max={100}
              value={scrubber}
              onChange={e => setScrubber(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "hsl(88 100% 62%)" }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>00:00</span>
            <span className="text-primary">
              {String(Math.floor(scrubber * 0.24)).padStart(2, "0")}:
              {String(Math.round((scrubber * 0.24) % 1 * 60)).padStart(2, "0")}
            </span>
            <span>24:00</span>
          </div>

          {scrubber > 55 && (
            <motion.div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={14} className="text-danger" />
              <span className="text-xs font-mono text-danger">
                {Math.round(scrubber * 0.24)}:00 — Pen 3 inactivity cluster detected. 2 animals flagged for review.
              </span>
            </motion.div>
          )}
        </div>

        {/* Pipeline Diagram */}
        <div className="card-glass rounded-xl p-6">
          <h3 className="font-display text-sm font-bold text-foreground mb-5">Data Pipeline</h3>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {PIPELINE_NODES.map((node, i) => (
              <div key={node.label} className="flex items-center">
                <motion.div
                  className="flex flex-col items-center text-center w-24 md:w-28"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-field-600 border border-primary/20 flex items-center justify-center text-xl mb-2 shadow-glow-lime">
                    {node.icon}
                  </div>
                  <p className="text-xs font-display font-bold text-foreground">{node.label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-tight">{node.desc}</p>
                </motion.div>

                {i < PIPELINE_NODES.length - 1 && (
                  <div className="mx-1 md:mx-2 flex-shrink-0 relative">
                    <div className="w-8 md:w-12 h-px bg-primary/30" />
                    <motion.div
                      className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                      animate={{ x: [0, 40, 0] }}
                      transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
