import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sliders, Shield, Eye, Info, Key } from "lucide-react";
import { useFarmSettings } from "@/contexts/FarmSettingsContext";

export default function Settings() {
  const { farmName, setFarmName, herdSize, setHerdSize } = useFarmSettings();
  const [localFarmName, setLocalFarmName] = useState(farmName);
  const [localHerdSize, setLocalHerdSize] = useState(herdSize);
  const [location, setLocation] = useState("Wicklow, Ireland");
  const [confidenceThreshold, setConfidenceThreshold] = useState(60);
  const [alertThreshold, setAlertThreshold] = useState(70);
  const [judgeMode, setJudgeMode] = useState(true);
  const [saved, setSaved] = useState(false);
  const hasEnvKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY?.trim());

  // Keep local form in sync when context changes (e.g. another tab or initial load)
  useEffect(() => {
    setLocalFarmName(farmName);
    setLocalHerdSize(herdSize);
  }, [farmName, herdSize]);

  const handleSave = () => {
    setFarmName(localFarmName);
    setHerdSize(localHerdSize);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 max-w-screen-lg mx-auto space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Farm profile, model configuration & system preferences</p>
        </div>

        {/* Farm Profile */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Eye size={14} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-foreground">Farm Profile</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Farm Name", value: localFarmName, setter: setLocalFarmName },
              { label: "Location", value: location, setter: setLocation },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  className="w-full bg-field-700 border border-border rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Herd Size</label>
              <input
                type="number"
                value={localHerdSize}
                onChange={e => setLocalHerdSize(Number(e.target.value))}
                className="w-full bg-field-700 border border-border rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sliders size={14} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-foreground">Model Configuration</h3>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Confidence Threshold for Alerts
                </label>
                <span className="font-mono text-primary font-bold text-sm">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={confidenceThreshold}
                onChange={e => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "hsl(88 100% 62%)" }}
              />
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                Alerts below this confidence show as "NO-CALL" — currently {confidenceThreshold}%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Alert Trigger Threshold (Risk Score)
                </label>
                <span className="font-mono text-warning font-bold text-sm">{alertThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                step={5}
                value={alertThreshold}
                onChange={e => setAlertThreshold(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "hsl(37 91% 55%)" }}
              />
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                Animals above this risk score trigger active alerts — currently {alertThreshold}%
              </p>
            </div>
          </div>
        </div>

        {/* Field Oracle */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Key size={14} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-foreground">Field Oracle</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg bg-field-700 border border-border p-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Anthropic API Key</p>
                <p className="text-sm text-foreground">
                  {hasEnvKey ? "Loaded from `.env.local`." : "No `.env.local` key found. Field Oracle will run in demo mode unless you enter one for the current session."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Add `VITE_ANTHROPIC_API_KEY` to `.env.local` in the project root to make Field Oracle auto-use Claude on startup.
                </p>
              </div>
              <div className="px-3 py-2 rounded-lg border border-border text-xs font-mono text-muted-foreground">
                {hasEnvKey ? "Env Key Present" : "Demo / Session Mode"}
              </div>
            </div>
          </div>
        </div>

        {/* Judge Mode */}
        <div className="card-glass rounded-xl overflow-hidden border border-primary/20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Judge Mode</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary">Hackathon</span>
            </div>
            <button
              onClick={() => setJudgeMode(!judgeMode)}
              className={`relative w-12 h-6 rounded-full transition-all ${judgeMode ? "bg-primary" : "bg-field-600"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow transition-all ${judgeMode ? "left-7" : "left-1"}`} />
            </button>
          </div>
          <div className="p-4">
            <div className={`flex items-start gap-2 p-3 rounded-lg ${judgeMode ? "bg-primary/5 border border-primary/20" : "bg-field-700 border border-border"}`}>
              <Info size={14} className={judgeMode ? "text-primary mt-0.5 flex-shrink-0" : "text-muted-foreground mt-0.5 flex-shrink-0"} />
              <div>
                <p className="text-xs font-mono font-semibold text-foreground mb-1">
                  {judgeMode ? "✓ Judge Mode ACTIVE" : "Judge Mode DISABLED"}
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  When enabled, all sensor data, animal profiles, and AI responses use synthetic pre-cached data. No private API keys required. Field Oracle uses demo responses based on the sample farm documents.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About / Methodology */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Info size={14} className="text-muted-foreground" />
            <h3 className="font-display text-sm font-bold text-foreground">About & Methodology</h3>
          </div>
          <div className="p-4 space-y-4 text-sm font-body text-muted-foreground leading-relaxed">
            <div>
              <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-2">Risk Detection Model</h4>
              <p>HerdSense uses a two-tier approach: a <strong className="text-foreground">rule-based threshold baseline</strong> (immediate response to temperature, activity, and feed anomalies) combined with an <strong className="text-foreground">LSTM-based sequential model</strong> trained on cattle activity datasets (Zenodo/Kaggle). The baseline handles clear deviations; LSTM handles subtle behavioral patterns over time.</p>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-2">Known Failure Modes</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Low confidence when sensor data is &lt;48hr old (NO-CALL behavior)</li>
                <li>False positives during seasonal estrus cycles</li>
                <li>Tag displacement can simulate abnormal gait patterns</li>
                <li>Visual BCS model accuracy degrades with non-standard lighting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-2">Data Privacy</h4>
              <p className="text-xs">All sensor data is processed on-device where possible. Farm documents uploaded to Field Oracle are parsed in the browser and kept in session state. If configured, the Anthropic API key is read from the local `.env.local` file at build/runtime for this frontend app.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <motion.button
            onClick={handleSave}
            className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm shadow-glow-lime hover:bg-lime-glow transition-all"
            whileTap={{ scale: 0.97 }}
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </motion.button>
        </div>
      </div>
    </AppLayout>
  );
}
