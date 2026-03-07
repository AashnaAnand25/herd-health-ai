import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ANIMALS_LIST, getSensorData, getHealthTimeline, RiskLevel } from "@/data/syntheticData";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useState, useCallback } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    HIGH:    "bg-danger/15 text-danger border-danger/40 animate-pulse-danger",
    MEDIUM:  "bg-warning/15 text-warning border-warning/40 animate-pulse-warning",
    LOW:     "bg-healthy/15 text-healthy border-healthy/30",
    "NO-CALL": "bg-field-600 text-muted-foreground border-border",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${styles[level]}`}>
      {level}
    </span>
  );
}

function SensorChart({ data, dataKey, color, label, normalMin, normalMax, unit }: any) {
  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(130 15% 55%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(130 15% 55%)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "hsl(135 40% 9%)", border: "1px solid hsl(88 40% 18%)", borderRadius: "8px", fontSize: "11px", fontFamily: "IBM Plex Mono" }}
            labelStyle={{ color: "hsl(130 15% 55%)" }}
            formatter={(v: any) => [`${v}${unit}`, label]}
          />
          {normalMin && <ReferenceLine y={normalMin} stroke={`${color}44`} strokeDasharray="3 3" />}
          {normalMax && <ReferenceLine y={normalMax} stroke={`${color}44`} strokeDasharray="3 3" />}
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const animal = ANIMALS_LIST.find(a => a.id === id);
  const [activeTab, setActiveTab] = useState<"activity" | "temperature" | "feeding">("activity");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensorData = animal ? getSensorData(animal.id) : [];
  const timeline = animal ? getHealthTimeline(animal.id) : [];

  if (!animal) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground font-mono">Animal not found</p>
            <button onClick={() => navigate("/dashboard")} className="mt-4 text-primary text-sm font-mono hover:underline">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  const TABS = [
    { key: "activity" as const, label: "Activity" },
    { key: "temperature" as const, label: "Temperature" },
    { key: "feeding" as const, label: "Feed Score" },
  ];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Back + Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="font-display text-2xl font-bold text-foreground">Animal #{animal.id}</h2>
              <RiskBadge level={animal.riskLevel} />
              {animal.confidence >= 40 && (
                <span className="text-xs font-mono text-muted-foreground">{animal.confidence}% confidence</span>
              )}
              {animal.confidence < 40 && (
                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <AlertCircle size={12} className="text-warning" />
                  Insufficient evidence
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
              <span>Breed: <span className="text-foreground">{animal.breed}</span></span>
              <span>Age: <span className="text-foreground">{animal.age} yr</span></span>
              <span>Weight: <span className="text-foreground">{animal.weight} kg</span></span>
              <span>Pen: <span className="text-foreground">{animal.pen}</span></span>
              <span>Monitored: <span className="text-foreground">{animal.daysSinceMonitored} days</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Timeline */}
            <div className="card-glass rounded-xl p-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-4">Health Timeline — 90 Days</h3>
              <div className="relative">
                <div className="absolute top-3 left-0 right-0 h-px bg-border" />
                <div className="flex justify-between relative z-10 overflow-x-auto gap-2 pb-2">
                  {timeline.map((evt, i) => {
                    const colors: Record<string, string> = {
                      LOW: "bg-healthy border-healthy/50 text-healthy",
                      MEDIUM: "bg-warning/20 border-warning/50 text-warning",
                      HIGH: "bg-danger/20 border-danger/50 text-danger",
                    };
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full border ${colors[evt.severity]} flex-shrink-0`} />
                        <p className="text-[9px] font-mono text-muted-foreground text-center max-w-[60px] leading-tight">{evt.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sensor Charts */}
            <div className="card-glass rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-display text-sm font-bold text-foreground">Sensor Data — Last 7 Days</h3>
                <div className="flex gap-1">
                  {TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                        activeTab === tab.key
                          ? "bg-lime-dark text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                {activeTab === "activity" && (
                  <SensorChart data={sensorData} dataKey="activity" color="hsl(88 100% 62%)" label="Activity Index" normalMin={50} normalMax={90} unit="" />
                )}
                {activeTab === "temperature" && (
                  <SensorChart data={sensorData} dataKey="temperature" color="hsl(37 91% 55%)" label="Temperature" normalMin={38.2} normalMax={39.2} unit="°C" />
                )}
                {activeTab === "feeding" && (
                  <SensorChart data={sensorData} dataKey="feedScore" color="hsl(130 40% 52%)" label="Feed Score" normalMin={50} normalMax={85} unit="" />
                )}
                <p className="text-[10px] font-mono text-muted-foreground mt-2">
                  Dashed lines indicate normal range. Values outside this range trigger alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* AI Triage */}
            <div className="card-glass rounded-xl overflow-hidden border border-primary/20">
              <div className="px-4 py-3 border-b border-primary/20 bg-lime-dark/30">
                <h3 className="font-display text-sm font-bold text-primary">AI Triage Assessment</h3>
              </div>
              <div className="p-4 space-y-3">
                {animal.confidence < 40 ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-field-600 border border-border">
                    <AlertCircle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-mono text-warning font-semibold mb-1">Insufficient Evidence</p>
                      <p className="text-xs font-body text-muted-foreground">
                        Confidence below threshold ({animal.confidence}% &lt; 40%). More sensor data needed before issuing assessment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">Risk Level</span>
                      <RiskBadge level={animal.riskLevel} />
                    </div>
                    {animal.alertReason && (
                      <div>
                        <p className="text-xs font-mono text-muted-foreground mb-1">Key Signals</p>
                        <p className="text-xs font-body text-foreground bg-field-700 rounded-lg p-2.5 border border-border">
                          {animal.alertReason}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">Confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-field-600 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${animal.confidence}%`, filter: "drop-shadow(0 0 2px hsl(88 100% 62% / 0.8))" }}
                          />
                        </div>
                        <span className="text-xs font-mono text-primary">{animal.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">Recommended Action</p>
                      <p className="text-xs font-body text-foreground">
                        {animal.riskLevel === "HIGH"
                          ? "Schedule veterinary inspection within 24 hours. Increase monitoring interval to 2hr."
                          : animal.riskLevel === "MEDIUM"
                          ? "Continue monitoring. Flag for manual inspection if no improvement in 48hr."
                          : "No immediate action required. Routine monitoring continues."}
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5 pt-1 border-t border-border">
                      <Info size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-mono text-muted-foreground">
                        AI-assisted estimate. Always verify with a veterinarian.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="card-glass rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-display text-sm font-bold text-foreground">Visual Body Condition</h3>
              </div>
              <div className="p-4">
                {!uploadedImage ? (
                  <label
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging ? "border-primary bg-lime-dark/20" : "border-border hover:border-primary/50"
                    }`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                    <Upload size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-body text-muted-foreground mb-1">Upload animal photo for visual BCS analysis</p>
                    <p className="text-[10px] font-mono text-primary">Drop image or click to browse</p>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <img src={uploadedImage} alt="Animal" className="w-full rounded-lg object-cover max-h-40" />
                    <div className="bg-field-700 rounded-lg p-3 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">BCS Estimate</span>
                        <span className="text-sm font-display font-bold text-primary">3.1 / 5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Visual Anomalies</span>
                        <span className="text-xs font-mono text-warning">Mild rib visibility</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Confidence</span>
                        <span className="text-xs font-mono text-primary">67%</span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground border-t border-border pt-2">
                        AI-assisted estimate. Always verify with a veterinarian.
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      ↺ Upload another
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="card-glass rounded-xl p-4 space-y-3">
              <h3 className="font-display text-sm font-bold text-foreground">Stats</h3>
              {[
                { label: "Temperature", value: `${animal.temperature}°C`, alert: animal.temperature > 39.5 },
                { label: "Vet Visits (Year)", value: animal.vetVisits.toString() },
                { label: "Last Activity", value: animal.lastActivity },
                { label: "Days Monitored", value: `${animal.daysSinceMonitored} days` },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{stat.label}</span>
                  <span className={`font-mono font-semibold ${stat.alert ? "text-warning" : "text-foreground"}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
