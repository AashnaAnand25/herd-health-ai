import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Camera, Bell, Info, Upload, X, FileVideo, Loader2, Pause, Play } from "lucide-react";

const VISION_API_BASE = "http://localhost:5001";
const POLL_MS = 500;
const LOG_MAX = 20;

interface VisionResults {
  behavior: string;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  alert: string | null;
  detections: number;
  subject?: "animal" | "human";
  timestamp: number;
  camera_available?: boolean;
}

interface LogEntry {
  time: string;
  behavior: string;
  confidence: number;
  risk: string;
}

interface VideoAnalysisEntry {
  time: number;
  behavior: string;
  confidence: number;
  risk: string;
  detections: number;
}

interface VideoAnalysis {
  timeline: VideoAnalysisEntry[];
  summary: {
    dominant_behavior: string;
    avg_confidence: number;
    max_risk: "LOW" | "MEDIUM" | "HIGH";
    duration_sec: number;
    frames_analyzed: number;
  };
  thumbnail: string | null;
}

const RISK_STYLES = {
  LOW: "bg-healthy/15 text-healthy border-healthy/40",
  MEDIUM: "bg-warning/15 text-warning border-warning/40",
  HIGH: "bg-danger/15 text-danger border-danger/40",
};

const CONFIDENCE_BAR_COLORS = {
  LOW: "bg-healthy",
  MEDIUM: "bg-warning",
  HIGH: "bg-danger",
};

export default function Vision() {
  const [results, setResults] = useState<VisionResults | null>(null);
  const [streamOnline, setStreamOnline] = useState(false);
  const [behaviorLog, setBehaviorLog] = useState<LogEntry[]>([]);
  const prevBehaviorRef = useRef<string | null>(null);

  // Video upload state
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setUploadError("Please upload a video file (mp4, mov, avi, etc.)");
      return;
    }
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setUploadedVideo(file);
    setVideoObjectUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setUploadError(null);
  };

  const handleAnalyze = async () => {
    if (!uploadedVideo) return;
    setAnalyzing(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("video", uploadedVideo);
      const res = await fetch(`${VISION_API_BASE}/analyze_video`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data: VideoAnalysis = await res.json();
      setAnalysis(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setUploadError(msg.includes("fetch") ? "Vision server offline — start backend first." : msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setUploadedVideo(null);
    setVideoObjectUrl(null);
    setAnalysis(null);
    setUploadError(null);
  };

  // Camera pause/resume
  const [cameraPaused, setCameraPaused] = useState(false);
  const toggleCamera = async () => {
    const endpoint = cameraPaused ? "resume_camera" : "pause_camera";
    try {
      await fetch(`${VISION_API_BASE}/${endpoint}`, { method: "POST" });
      setCameraPaused((p) => !p);
    } catch {
      // server offline, just toggle UI
      setCameraPaused((p) => !p);
    }
  };

  // Poll /results
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${VISION_API_BASE}/results`);
        if (r.ok) {
          const data: VisionResults = await r.json();
          setResults(data);
          setStreamOnline(true); // server is up
          if (prevBehaviorRef.current !== data.behavior) {
            prevBehaviorRef.current = data.behavior;
            setBehaviorLog((log) => {
              const entry: LogEntry = {
                time: new Date().toLocaleTimeString("en-US", { hour12: false }),
                behavior: data.behavior,
                confidence: data.confidence,
                risk: data.risk,
              };
              return [entry, ...log].slice(0, LOG_MAX);
            });
          }
        }
      } catch {
        setResults(null);
        setStreamOnline(false);
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Check if video stream is reachable
  useEffect(() => {
    const img = new Image();
    img.onload = () => setStreamOnline(true);
    img.onerror = () => setStreamOnline(false);
    img.src = `${VISION_API_BASE}/video_feed?t=${Date.now()}`;
    const t = setInterval(() => {
      img.src = `${VISION_API_BASE}/video_feed?t=${Date.now()}`;
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
          <Info size={16} className="text-primary shrink-0" />
          <p className="text-sm font-body text-foreground/90">
            Computer Vision Mode — YOLOv8 running locally via Python backend. Detects cattle behavior (Standing, Grazing, Lying Down) or falls back to human movement detection (Standing, Walking, Crouching) when no animal is in frame.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Live camera feed */}
          <div className="card-glass rounded-xl overflow-hidden border-2 border-primary/20 shadow-glow-lime">
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">Live vision feed</span>
              {streamOnline && (
                <button
                  onClick={toggleCamera}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-colors ${cameraPaused ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-field-700 text-muted-foreground hover:bg-field-600 hover:text-foreground"}`}
                >
                  {cameraPaused ? <><Play size={11} />Resume</> : <><Pause size={11} />Pause</>}
                </button>
              )}
            </div>
            <div className="relative aspect-video bg-field-900">
              {streamOnline ? (
                <img
                  src={`${VISION_API_BASE}/video_feed`}
                  alt="Live vision feed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6 text-center">
                  <Camera size={48} className="opacity-50" />
                  <p className="font-display font-semibold text-foreground">Camera offline</p>
                  <p className="text-sm font-body max-w-sm">
                    To see live camera + classification here, start the vision server from the <strong>backend</strong> directory:
                  </p>
                  <pre className="bg-field-800 border border-border rounded-lg px-4 py-3 text-left text-xs font-mono text-primary w-full max-w-md overflow-x-auto">
                    cd backend{"\n"}
                    pip install ultralytics flask flask-cors opencv-python{"\n"}
                    python vision_server.py
                  </pre>
                  <p className="text-xs">
                    Then allow camera access when prompted. The feed and behavior labels will appear above.
                  </p>
                </div>
              )}
              {streamOnline && !cameraPaused && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-primary/90 text-primary-foreground font-mono text-xs font-bold flex items-center gap-1.5 animate-pulse-lime">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  LIVE
                </div>
              )}
              {cameraPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex flex-col items-center gap-2">
                    <Pause size={36} className="text-white/70" />
                    <span className="font-mono text-xs text-white/70">Camera paused</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-black/70 font-mono text-xs text-primary">
                YOLOv8 · Real-time Detection · MPS Accelerated
              </div>
            </div>
          </div>

          {/* Right — Results panel */}
          <div className="space-y-4">
            <div className="card-glass rounded-xl overflow-hidden p-4 md:p-6">
              {results ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      results.subject === "human"
                        ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                        : "border-primary/40 text-primary bg-primary/10"
                    }`}>
                      {results.subject === "human" ? "PERSON DETECTED" : "ANIMAL DETECTED"}
                    </span>
                  </div>
                  <p className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                    {results.behavior}
                  </p>
                  <div className="mb-4">
                    <div className="h-3 rounded-full bg-field-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${CONFIDENCE_BAR_COLORS[results.risk]}`}
                        style={{ width: `${results.confidence * 100}%` }}
                      />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      Confidence {Math.round(results.confidence * 100)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg border font-mono text-sm font-bold ${RISK_STYLES[results.risk]}`}
                    >
                      {results.risk} RISK
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {results.detections} detection{results.detections !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {results.alert && (
                    <div className="flex items-start gap-2 rounded-lg border-2 border-danger/40 bg-danger/15 p-3 mb-4">
                      <Bell size={18} className="text-danger shrink-0 mt-0.5" />
                      <p className="text-sm font-body text-foreground">{results.alert}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground font-mono text-sm">Waiting for vision server…</p>
              )}
            </div>

            {/* Behavior log */}
            <div className="card-glass rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-display text-sm font-bold text-foreground">Behavior log</h3>
              </div>
              <div className="p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                {behaviorLog.length === 0 ? (
                  <p className="text-muted-foreground">No entries yet.</p>
                ) : (
                  behaviorLog.map((entry, i) => (
                    <div
                      key={`${entry.time}-${i}`}
                      className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="text-muted-foreground shrink-0">{entry.time}</span>
                      <span className="text-foreground">{entry.behavior}</span>
                      <span className="text-muted-foreground">{Math.round(entry.confidence * 100)}%</span>
                      <span className={`shrink-0 ${entry.risk === "HIGH" ? "text-danger" : entry.risk === "MEDIUM" ? "text-warning" : "text-healthy"}`}>
                        {entry.risk}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Upload & Analysis */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <FileVideo size={15} className="text-primary" />
              Upload Video for Analysis
            </h3>
            {uploadedVideo && (
              <button onClick={clearVideo} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {!uploadedVideo ? (
            <div
              className={`m-4 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleVideoSelect(f); }}
            >
              <Upload size={32} className="text-muted-foreground" />
              <p className="font-display font-semibold text-foreground text-sm">Drop a video or click to upload</p>
              <p className="text-xs font-body text-muted-foreground text-center">Upload an archive video from your training set — mp4, mov, avi supported</p>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); }} />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Video preview */}
                <div className="rounded-xl overflow-hidden bg-field-900 border border-border aspect-video">
                  <video src={videoObjectUrl!} controls className="w-full h-full object-contain" />
                </div>

                {/* Analysis results */}
                <div className="space-y-3">
                  {!analysis && !analyzing && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-6">
                      <p className="text-sm font-body text-muted-foreground text-center">
                        Ready to analyze <span className="text-foreground font-semibold">{uploadedVideo.name}</span>
                      </p>
                      <button
                        onClick={handleAnalyze}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Upload size={14} />
                        Run YOLO Analysis
                      </button>
                    </div>
                  )}

                  {analyzing && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-6">
                      <Loader2 size={28} className="text-primary animate-spin" />
                      <p className="text-sm font-mono text-muted-foreground">Analyzing frames with YOLOv8…</p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 flex items-start gap-2">
                      <Bell size={14} className="text-danger shrink-0 mt-0.5" />
                      <p className="text-sm font-body text-foreground">{uploadError}</p>
                    </div>
                  )}

                  {analysis && (
                    <>
                      {/* Summary card */}
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                        <p className="font-display text-2xl font-bold text-foreground">{analysis.summary.dominant_behavior}</p>
                        <div className="h-2.5 rounded-full bg-field-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${CONFIDENCE_BAR_COLORS[analysis.summary.max_risk]}`}
                            style={{ width: `${analysis.summary.avg_confidence * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-lg border font-mono text-xs font-bold ${RISK_STYLES[analysis.summary.max_risk]}`}>
                            {analysis.summary.max_risk} RISK
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            Avg confidence {Math.round(analysis.summary.avg_confidence * 100)}%
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {analysis.summary.duration_sec}s · {analysis.summary.frames_analyzed} frames
                          </span>
                        </div>
                        {analysis.thumbnail && (
                          <img src={`data:image/jpeg;base64,${analysis.thumbnail}`} alt="Best detection frame" className="rounded-lg w-full object-contain max-h-28 bg-field-900 mt-2" />
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="px-3 py-2 border-b border-border bg-field-800/50">
                          <p className="font-display text-xs font-bold text-foreground">Detection timeline</p>
                        </div>
                        <div className="max-h-44 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
                          {analysis.timeline.map((entry, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5 border-b border-border/30 last:border-0">
                              <span className="text-muted-foreground shrink-0 w-12">{entry.time}s</span>
                              <span className="text-foreground flex-1 truncate">{entry.behavior}</span>
                              <span className="text-muted-foreground">{Math.round(entry.confidence * 100)}%</span>
                              <span className={`shrink-0 ${entry.risk === "HIGH" ? "text-danger" : entry.risk === "MEDIUM" ? "text-warning" : "text-healthy"}`}>{entry.risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Classification key */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display text-sm font-bold text-foreground">Behavior classification key</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-body text-sm text-foreground/90">
            <div className="rounded-lg border border-healthy/30 bg-healthy/10 p-3">
              <p className="font-display font-semibold text-healthy">Standing/Walking</p>
              <p className="text-xs mt-0.5">Normal activity, LOW risk.</p>
            </div>
            <div className="rounded-lg border border-healthy/30 bg-healthy/10 p-3">
              <p className="font-display font-semibold text-healthy">Grazing</p>
              <p className="text-xs mt-0.5">Normal feeding behavior, LOW risk.</p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="font-display font-semibold text-warning">Lying Down</p>
              <p className="text-xs mt-0.5">Normal rest or extended lying concern if &gt;4hrs, MEDIUM risk.</p>
            </div>
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-3">
              <p className="font-display font-semibold text-danger">Abnormal Gait</p>
              <p className="text-xs mt-0.5">Possible lameness or injury, HIGH risk — flag for vet.</p>
            </div>
            <div className="rounded-lg border border-border bg-field-700/50 p-3">
              <p className="font-display font-semibold text-muted-foreground">No animal detected</p>
              <p className="text-xs mt-0.5">Camera obstruction or animal out of frame.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
