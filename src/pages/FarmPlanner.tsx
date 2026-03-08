import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFarmSettings } from "@/contexts/FarmSettingsContext";
import { RECENT_ALERTS } from "@/data/syntheticData";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

const ENV_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() ?? "";

// Open-Meteo: Champaign IL (no API key needed)
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=40.1164&longitude=-88.2434" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode" +
  "&timezone=America%2FChicago&forecast_days=7";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// WMO weather code → label + icon
function weatherInfo(code: number): { label: string; icon: React.ReactNode } {
  if (code === 0) return { label: "Clear", icon: <Sun size={22} className="text-yellow-400" /> };
  if (code <= 3) return { label: "Partly Cloudy", icon: <Cloud size={22} className="text-muted-foreground" /> };
  if (code <= 48) return { label: "Foggy", icon: <Cloud size={22} className="text-muted-foreground" /> };
  if (code <= 67) return { label: "Rainy", icon: <CloudRain size={22} className="text-blue-400" /> };
  if (code <= 77) return { label: "Snow", icon: <Cloud size={22} className="text-blue-200" /> };
  if (code <= 82) return { label: "Showers", icon: <CloudRain size={22} className="text-blue-400" /> };
  return { label: "Stormy", icon: <CloudRain size={22} className="text-red-400" /> };
}

function heatRisk(maxC: number): { level: string; color: string } {
  if (maxC >= 32) return { level: "High heat stress", color: "text-danger" };
  if (maxC >= 27) return { level: "Moderate heat", color: "text-warning" };
  return { level: "Comfortable", color: "text-healthy" };
}

interface DayForecast {
  date: string;
  dayLabel: string;
  maxC: number;
  minC: number;
  precipitation: number;
  windspeed: number;
  weathercode: number;
}

interface DayRec {
  day: string;
  tasks: string[];
  priority: "high" | "medium" | "low";
}

export default function FarmPlanner() {
  const { farmName, herdSize } = useFarmSettings();
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [recommendations, setRecommendations] = useState<DayRec[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    fetch(WEATHER_URL)
      .then(r => r.json())
      .then(data => {
        const d = data.daily;
        const days: DayForecast[] = d.time.map((dateStr: string, i: number) => {
          const dt = new Date(dateStr + "T12:00:00");
          return {
            date: dateStr,
            dayLabel: DAY_LABELS[dt.getDay()],
            maxC: Math.round(d.temperature_2m_max[i]),
            minC: Math.round(d.temperature_2m_min[i]),
            precipitation: Math.round(d.precipitation_sum[i] * 10) / 10,
            windspeed: Math.round(d.windspeed_10m_max[i]),
            weathercode: d.weathercode[i],
          };
        });
        setForecast(days);
        setLoadingWeather(false);
      })
      .catch(() => {
        setWeatherError("Could not load weather data. Check your connection.");
        setLoadingWeather(false);
      });
  }, []);

  async function generateRecommendations() {
    if (!ENV_API_KEY) {
      setRecError("Add VITE_ANTHROPIC_API_KEY to .env.local to enable AI recommendations.");
      return;
    }
    setLoadingRecs(true);
    setRecError(null);
    setRecommendations([]);

    const criticalCount = RECENT_ALERTS.filter(a => a.severity === "HIGH").length;
    const weatherSummary = forecast
      .map(
        d =>
          `${d.dayLabel} ${d.date}: max ${d.maxC}°C, min ${d.minC}°C, precipitation ${d.precipitation}mm, wind ${d.windspeed}km/h, condition: ${weatherInfo(d.weathercode).label}`
      )
      .join("\n");

    const prompt = `You are an expert livestock management advisor for a beef cattle farm.

Farm: ${farmName}
Herd size: ${herdSize} animals
Active critical health alerts: ${criticalCount}

7-day weather forecast (Champaign, IL):
${weatherSummary}

Generate specific daily farm management recommendations for each of the 7 days based on the weather.
Focus on: heat stress management, water access, feeding adjustments, shelter, pasture management, and health monitoring timing.
Keep each day to 2-3 actionable bullet points. Be specific and practical.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
[
  {"day": "Mon Mar 10", "priority": "high", "tasks": ["task 1", "task 2", "task 3"]},
  ...
]
Priority should be "high" if temp >30°C or heavy rain, "medium" if moderate conditions, "low" if comfortable.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ENV_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "API error");
      const text: string = data.content[0].text.trim();
      // Strip markdown fences if present
      const clean = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      const parsed: DayRec[] = JSON.parse(clean);
      setRecommendations(parsed);
    } catch (e: unknown) {
      setRecError(e instanceof Error ? e.message : "Failed to generate recommendations.");
    } finally {
      setLoadingRecs(false);
    }
  }

  const toF = (c: number) => Math.round(c * 9 / 5 + 32);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Calendar size={22} className="text-primary" />
              Farm Planner
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              7-day weather forecast + AI management recommendations
            </p>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={loadingRecs || forecast.length === 0}
            className="bg-primary text-black hover:bg-primary/90 font-semibold flex items-center gap-2"
          >
            {loadingRecs ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={14} /> Generate AI Plan</>
            )}
          </Button>
        </div>

        {/* Weather strip */}
        {loadingWeather && (
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading weather data...
          </div>
        )}
        {weatherError && (
          <div className="flex items-center gap-2 text-danger text-sm font-mono">
            <AlertTriangle size={14} /> {weatherError}
          </div>
        )}

        {forecast.length > 0 && (
          <div className="grid grid-cols-7 gap-2">
            {forecast.map((day, i) => {
              const heat = heatRisk(day.maxC);
              const { icon } = weatherInfo(day.weathercode);
              const isSelected = selectedDay === i;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "border-primary bg-lime-dark shadow-glow-lime"
                      : "border-border bg-field-800 hover:border-primary/40 hover:bg-field-700"
                  }`}
                >
                  <span className="text-[11px] font-mono text-muted-foreground">{day.dayLabel}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {day.date.slice(5)}
                  </span>
                  {icon}
                  <span className="text-sm font-bold text-foreground">{day.maxC}°C</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{toF(day.maxC)}°F</span>
                  {day.precipitation > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-blue-400 font-mono">
                      <Droplets size={10} /> {day.precipitation}mm
                    </div>
                  )}
                  <span className={`text-[9px] font-mono font-semibold ${heat.color}`}>
                    {heat.level}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Day detail + recommendations */}
        {forecast.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected day weather detail */}
            <Card className="card-glass border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                  {weatherInfo(forecast[selectedDay].weathercode).icon}
                  {forecast[selectedDay].dayLabel} — {forecast[selectedDay].date}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-field-800 rounded-lg p-3 flex items-center gap-2">
                    <Thermometer size={16} className="text-warning" />
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">High / Low</p>
                      <p className="text-sm font-bold text-foreground">
                        {forecast[selectedDay].maxC}°C / {forecast[selectedDay].minC}°C
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {toF(forecast[selectedDay].maxC)}°F / {toF(forecast[selectedDay].minC)}°F
                      </p>
                    </div>
                  </div>
                  <div className="bg-field-800 rounded-lg p-3 flex items-center gap-2">
                    <Droplets size={16} className="text-blue-400" />
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">Precipitation</p>
                      <p className="text-sm font-bold text-foreground">
                        {forecast[selectedDay].precipitation} mm
                      </p>
                    </div>
                  </div>
                  <div className="bg-field-800 rounded-lg p-3 flex items-center gap-2">
                    <Wind size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">Wind</p>
                      <p className="text-sm font-bold text-foreground">
                        {forecast[selectedDay].windspeed} km/h
                      </p>
                    </div>
                  </div>
                  <div className="bg-field-800 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle size={16} className={heatRisk(forecast[selectedDay].maxC).color} />
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">Heat Risk</p>
                      <p className={`text-sm font-bold ${heatRisk(forecast[selectedDay].maxC).color}`}>
                        {heatRisk(forecast[selectedDay].maxC).level}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground bg-field-800 rounded-lg p-3">
                  <span className="text-foreground font-semibold">Herd context: </span>
                  {herdSize} animals · {RECENT_ALERTS.filter(a => a.severity === "HIGH").length} critical alerts active
                </div>
              </CardContent>
            </Card>

            {/* AI recommendations for selected day */}
            <Card className="card-glass border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  AI Recommendations
                  {recommendations.length > 0 && (
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[10px] font-mono ${
                        recommendations[selectedDay]?.priority === "high"
                          ? "border-danger text-danger"
                          : recommendations[selectedDay]?.priority === "medium"
                          ? "border-warning text-warning"
                          : "border-healthy text-healthy"
                      }`}
                    >
                      {recommendations[selectedDay]?.priority?.toUpperCase() ?? ""} PRIORITY
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!recommendations.length && !loadingRecs && !recError && (
                  <div className="text-center py-8 text-muted-foreground font-mono text-sm space-y-2">
                    <Sparkles size={28} className="mx-auto text-primary/40" />
                    <p>Click "Generate AI Plan" to get</p>
                    <p>daily management recommendations</p>
                    <p>based on this week's forecast.</p>
                  </div>
                )}
                {loadingRecs && (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground font-mono text-sm">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    Claude is analyzing the forecast...
                  </div>
                )}
                {recError && (
                  <div className="flex items-start gap-2 text-danger text-sm font-mono p-3 bg-danger/10 rounded-lg">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    {recError}
                  </div>
                )}
                {recommendations.length > 0 && recommendations[selectedDay] && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono text-muted-foreground mb-3">
                      {recommendations[selectedDay].day}
                    </p>
                    {recommendations[selectedDay].tasks.map((task, ti) => (
                      <div
                        key={ti}
                        className="flex items-start gap-2 text-sm text-foreground bg-field-800 rounded-lg px-3 py-2"
                      >
                        <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                        {task}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full week AI plan */}
        {recommendations.length > 0 && (
          <Card className="card-glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                Full Week Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`text-left rounded-lg p-3 border transition-all ${
                      selectedDay === i
                        ? "border-primary bg-lime-dark"
                        : "border-border bg-field-800 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold text-foreground">
                        {forecast[i]?.dayLabel}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          rec.priority === "high"
                            ? "bg-danger/20 text-danger"
                            : rec.priority === "medium"
                            ? "bg-warning/20 text-warning"
                            : "bg-healthy/20 text-healthy"
                        }`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {rec.tasks.slice(0, 2).map((task, ti) => (
                        <li key={ti} className="text-[10px] text-muted-foreground font-mono leading-tight line-clamp-2">
                          · {task}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
