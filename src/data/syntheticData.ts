// HerdSense — Synthetic Farm Data

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "NO-CALL";

export interface Animal {
  id: string;
  breed: string;
  age: number; // years
  weight: number; // kg
  pen: string;
  daysSinceMonitored: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  confidence: number; // 0-100 (%)
  alertReason: string | null;
  lastActivity: string;
  temperature: number; // °C
  vetVisits: number;
  notes?: string;
  barnName?: string; // friendly name for Live Feed
}

/** Friendly barn names for display (keyed by animal id; fallback to Tag #id) */
export const BARN_NAMES: Record<string, string> = {
  A142: "Bessie", B089: "Daisy", F017: "Clover", C201: "Ishani", "C201-7": "Sunny",
  E115: "Maggie", G044: "Rosie", H198: "Maple", D033: "Peaches", J221: "Honey",
  K088: "Buttercup", L332: "Willow", M067: "Pumpkin", N155: "Blossom", P009: "Cocoa",
  Q274: "Mocha", R401: "Ginger", S119: "Nutmeg", T288: "Dandelion", U055: "Penny",
};

export interface Alert {
  id: string;
  animalId: string;
  type: string;
  message: string;
  severity: RiskLevel;
  timestamp: string;
  minutesAgo: number;
}

export interface Pen {
  id: string;
  name: string;
  animalCount: number;
  avgActivity: number; // 0-100
  temperature: number;
  alertCount: number;
  status: "normal" | "warning" | "alert";
  sparkline: number[];
}

export const ANIMALS: Animal[] = [
  { id: "A142", breed: "Holstein",  age: 4, weight: 612, pen: "Pen 3", daysSinceMonitored: 47, riskLevel: "HIGH",    riskScore: 87, confidence: 87, alertReason: "Reduced feeding activity >36hr",    lastActivity: "4h ago",  temperature: 39.6, vetVisits: 6 },
  { id: "B089", breed: "Angus",     age: 2, weight: 488, pen: "Pen 3", daysSinceMonitored: 31, riskLevel: "HIGH",    riskScore: 79, confidence: 82, alertReason: "Gait irregularity detected",         lastActivity: "2h ago",  temperature: 39.8, vetVisits: 3 },
  { id: "F017", breed: "Holstein",  age: 5, weight: 640, pen: "Pen 5", daysSinceMonitored: 62, riskLevel: "HIGH",    riskScore: 74, confidence: 71, alertReason: "Abnormal lying posture pattern",     lastActivity: "6h ago",  temperature: 40.1, vetVisits: 8 },
  { id: "C201", breed: "Hereford",  age: 6, weight: 590, pen: "Pen 1", daysSinceMonitored: 90, riskLevel: "MEDIUM",  riskScore: 61, confidence: 74, alertReason: "Mild feed avoidance (2 events)",     lastActivity: "1h ago",  temperature: 38.9, vetVisits: 2 },
  { id: "E115", breed: "Limousin",  age: 3, weight: 523, pen: "Pen 4", daysSinceMonitored: 55, riskLevel: "MEDIUM",  riskScore: 58, confidence: 67, alertReason: "Below-average movement last 48hr",   lastActivity: "3h ago",  temperature: 39.1, vetVisits: 4 },
  { id: "G044", breed: "Charolais", age: 4, weight: 601, pen: "Pen 2", daysSinceMonitored: 44, riskLevel: "MEDIUM",  riskScore: 52, confidence: 61, alertReason: "Temperature elevation (39.7°C)",     lastActivity: "30m ago", temperature: 39.7, vetVisits: 1 },
  { id: "H198", breed: "Angus",     age: 7, weight: 648, pen: "Pen 1", daysSinceMonitored: 88, riskLevel: "MEDIUM",  riskScore: 48, confidence: 63, alertReason: "Reduced social interaction",         lastActivity: "2h ago",  temperature: 38.8, vetVisits: 5 },
  { id: "C201", breed: "Hereford",  age: 6, weight: 590, pen: "Pen 1", daysSinceMonitored: 90, riskLevel: "LOW",     riskScore: 23, confidence: 91, alertReason: null,                                 lastActivity: "45m ago", temperature: 38.6, vetVisits: 2, notes: "Healthy baseline" },
  { id: "D033", breed: "Holstein",  age: 3, weight: 548, pen: "Pen 6", daysSinceMonitored: 12, riskLevel: "NO-CALL", riskScore: 0,  confidence: 28, alertReason: "Insufficient sensor data (<48hr)",  lastActivity: "8h ago",  temperature: 38.7, vetVisits: 1 },
  { id: "J221", breed: "Simmental", age: 2, weight: 467, pen: "Pen 2", daysSinceMonitored: 37, riskLevel: "LOW",     riskScore: 18, confidence: 88, alertReason: null,                                 lastActivity: "20m ago", temperature: 38.5, vetVisits: 0 },
  { id: "K088", breed: "Hereford",  age: 5, weight: 574, pen: "Pen 4", daysSinceMonitored: 65, riskLevel: "LOW",     riskScore: 15, confidence: 85, alertReason: null,                                 lastActivity: "1h ago",  temperature: 38.7, vetVisits: 3 },
  { id: "L332", breed: "Charolais", age: 8, weight: 690, pen: "Pen 1", daysSinceMonitored: 90, riskLevel: "LOW",     riskScore: 12, confidence: 93, alertReason: null,                                 lastActivity: "15m ago", temperature: 38.4, vetVisits: 7 },
  { id: "M067", breed: "Angus",     age: 1, weight: 312, pen: "Pen 6", daysSinceMonitored: 8,  riskLevel: "NO-CALL", riskScore: 0,  confidence: 35, alertReason: "Tag recently installed — 72hr warmup", lastActivity: "5h ago", temperature: 38.9, vetVisits: 0 },
  { id: "N155", breed: "Holstein",  age: 4, weight: 622, pen: "Pen 2", daysSinceMonitored: 50, riskLevel: "LOW",     riskScore: 21, confidence: 80, alertReason: null,                                 lastActivity: "40m ago", temperature: 38.6, vetVisits: 2 },
  { id: "P009", breed: "Limousin",  age: 6, weight: 561, pen: "Pen 5", daysSinceMonitored: 78, riskLevel: "MEDIUM",  riskScore: 44, confidence: 58, alertReason: "Feed intake 22% below 7-day avg",   lastActivity: "3h ago",  temperature: 39.2, vetVisits: 4 },
  { id: "Q274", breed: "Angus",     age: 3, weight: 500, pen: "Pen 4", daysSinceMonitored: 40, riskLevel: "LOW",     riskScore: 9,  confidence: 96, alertReason: null,                                 lastActivity: "5m ago",  temperature: 38.5, vetVisits: 1 },
  { id: "R401", breed: "Hereford",  age: 5, weight: 583, pen: "Pen 3", daysSinceMonitored: 53, riskLevel: "HIGH",    riskScore: 82, confidence: 76, alertReason: "Rapid weight loss (3.1% in 5 days)", lastActivity: "7h ago",  temperature: 40.0, vetVisits: 5 },
  { id: "S119", breed: "Simmental", age: 4, weight: 558, pen: "Pen 1", daysSinceMonitored: 70, riskLevel: "LOW",     riskScore: 17, confidence: 89, alertReason: null,                                 lastActivity: "25m ago", temperature: 38.5, vetVisits: 2 },
  { id: "T288", breed: "Charolais", age: 2, weight: 432, pen: "Pen 6", daysSinceMonitored: 22, riskLevel: "NO-CALL", riskScore: 0,  confidence: 41, alertReason: "Sensor data intermittent",           lastActivity: "12h ago", temperature: 38.8, vetVisits: 0 },
  { id: "U055", breed: "Holstein",  age: 7, weight: 660, pen: "Pen 5", daysSinceMonitored: 85, riskLevel: "LOW",     riskScore: 28, confidence: 77, alertReason: null,                                 lastActivity: "1h ago",  temperature: 38.7, vetVisits: 6 },
];

// Deduplicate by id (C201 appeared twice in spec, fix it)
export const ANIMALS_LIST: Animal[] = (() => {
  const seen = new Set<string>();
  return ANIMALS.map((a, i) => {
    const uid = seen.has(a.id) ? `${a.id}-${i}` : a.id;
    seen.add(a.id);
    return { ...a, id: uid };
  });
})();

export const RECENT_ALERTS: Alert[] = [
  { id: "al1", animalId: "A142", type: "Feed", message: "Cow #A142 — Reduced feeding activity >36hr", severity: "HIGH",   timestamp: "Today 08:14", minutesAgo: 14 },
  { id: "al2", animalId: "R401", type: "Weight", message: "Cow #R401 — Rapid weight loss detected (3.1%)", severity: "HIGH",   timestamp: "Today 07:52", minutesAgo: 36 },
  { id: "al3", animalId: "B089", type: "Gait",   message: "Cow #B089 — Abnormal gait pattern detected",    severity: "HIGH",   timestamp: "Today 07:29", minutesAgo: 59 },
  { id: "al4", animalId: "F017", type: "Posture", message: "Cow #F017 — Abnormal lying posture cluster",   severity: "HIGH",   timestamp: "Today 06:40", minutesAgo: 108 },
  { id: "al5", animalId: "G044", type: "Temp",   message: "Cow #G044 — Temperature spike 39.7°C",          severity: "MEDIUM", timestamp: "Today 05:55", minutesAgo: 153 },
  { id: "al6", animalId: "E115", type: "Activity","message": "Cow #E115 — Below-average movement 48hr",    severity: "MEDIUM", timestamp: "Yesterday",   minutesAgo: 820 },
  { id: "al7", animalId: "P009", type: "Feed",   message: "Cow #P009 — Feed intake 22% below 7-day avg",   severity: "MEDIUM", timestamp: "Yesterday",   minutesAgo: 960 },
];

export const PENS: Pen[] = [
  { id: "pen1", name: "Pen 1 — East Pasture",  animalCount: 42, avgActivity: 74, temperature: 38.7, alertCount: 0, status: "normal",  sparkline: [60,65,70,72,68,74,74] },
  { id: "pen2", name: "Pen 2 — West Barn",     animalCount: 38, avgActivity: 68, temperature: 38.8, alertCount: 1, status: "warning", sparkline: [70,72,65,60,65,68,68] },
  { id: "pen3", name: "Pen 3 — South Field",   animalCount: 41, avgActivity: 31, temperature: 39.6, alertCount: 2, status: "alert",   sparkline: [72,68,60,45,38,35,31] },
  { id: "pen4", name: "Pen 4 — North Barn",    animalCount: 45, avgActivity: 71, temperature: 38.6, alertCount: 0, status: "normal",  sparkline: [68,70,72,69,71,72,71] },
  { id: "pen5", name: "Pen 5 — Pasture Hill",  animalCount: 40, avgActivity: 55, temperature: 39.1, alertCount: 1, status: "warning", sparkline: [72,70,65,60,58,56,55] },
  { id: "pen6", name: "Pen 6 — Quarantine",    animalCount: 12, avgActivity: 62, temperature: 38.9, alertCount: 0, status: "normal",  sparkline: [55,58,60,62,63,62,62] },
];

/** Map pen id (e.g. "pen1") to animal pen label ("Pen 1") for filtering */
export function getPenLabel(penId: string): string {
  const num = penId.replace(/^pen/i, "");
  return `Pen ${num}`;
}

/** Animals in a given pen for Live Feed drill-down */
export function getAnimalsByPenId(penId: string): Animal[] {
  const label = getPenLabel(penId);
  return ANIMALS_LIST.filter(a => a.pen === label);
}

// 30-day health trend
export const HEALTH_TREND = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const baseline = 88;
  const noise = Math.sin(i * 0.4) * 3 + (Math.random() - 0.5) * 2;
  const drop = i >= 22 && i <= 25 ? -6 : 0;
  return {
    day: `Day ${day}`,
    label: day % 7 === 0 ? `D${day}` : "",
    actual: Math.round(Math.max(70, Math.min(98, baseline + noise + drop))),
    baseline: Math.round(baseline + Math.sin(i * 0.15) * 1.5),
  };
});

// 7-day activity heatmap (6 pens × 7 days)
export const HEATMAP_DATA = [
  { pen: "Pen 1", Mon: 74, Tue: 72, Wed: 76, Thu: 71, Fri: 73, Sat: 70, Sun: 72 },
  { pen: "Pen 2", Mon: 70, Tue: 65, Wed: 62, Thu: 60, Fri: 65, Sat: 68, Sun: 68 },
  { pen: "Pen 3", Mon: 72, Tue: 68, Wed: 55, Thu: 42, Fri: 38, Sat: 35, Sun: 31 },
  { pen: "Pen 4", Mon: 71, Tue: 72, Wed: 70, Thu: 73, Fri: 71, Sat: 72, Sun: 71 },
  { pen: "Pen 5", Mon: 72, Tue: 70, Wed: 64, Thu: 60, Fri: 57, Sat: 56, Sun: 55 },
  { pen: "Pen 6", Mon: 55, Tue: 60, Wed: 62, Thu: 63, Fri: 62, Sat: 61, Sun: 62 },
];

// Sensor time-series for animal profile (last 7 days, daily)
export function getSensorData(animalId: string) {
  const seed = animalId.charCodeAt(0) + animalId.charCodeAt(1);
  const riskAnimal = ANIMALS_LIST.find(a => a.id === animalId);
  const isHighRisk = riskAnimal?.riskLevel === "HIGH";

  return Array.from({ length: 7 }, (_, i) => {
    const base = isHighRisk ? 55 - i * 4 : 68 + Math.sin(i + seed) * 5;
    return {
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      activity: Math.round(Math.max(10, Math.min(100, base + (Math.random() - 0.5) * 8))),
      temperature: parseFloat((38.5 + (isHighRisk ? 0.1 * i : 0) + (Math.random() - 0.5) * 0.3).toFixed(1)),
      feedScore: Math.round(Math.max(10, Math.min(100, base - 5 + (Math.random() - 0.5) * 10))),
    };
  });
}

// Health timeline events
export function getHealthTimeline(animalId: string) {
  const events = [
    { day: -88, label: "Tag installed",       severity: "LOW",    icon: "tag" },
    { day: -72, label: "Baseline established", severity: "LOW",    icon: "check" },
    { day: -45, label: "Vet check",            severity: "LOW",    icon: "vet" },
    { day: -30, label: "Mild temp spike",      severity: "MEDIUM", icon: "temp" },
    { day: -15, label: "Vaccination",          severity: "LOW",    icon: "vax" },
    { day: -7,  label: "Activity decline",     severity: "MEDIUM", icon: "activity" },
    { day: -2,  label: "Alert triggered",      severity: "HIGH",   icon: "alert" },
    { day: 0,   label: "Today",                severity: "LOW",    icon: "today" },
  ];
  return events;
}

// Legacy synthetic farm document content
export const FARM_DOCUMENTS = {
  "2024 Annual Farm Report.pdf": `
MEADOWBROOK FARM — 2024 ANNUAL HEALTH & OPERATIONS REPORT
Prepared: December 2024 | Farm Manager: James Callaghan

HERD OVERVIEW
Total animals monitored: 247 head across 6 pens
Breeds: Holstein (38%), Angus (27%), Hereford (20%), Charolais (9%), Simmental/Limousin (6%)
Average herd age: 3.8 years | Average weight: 556 kg

HEALTH INCIDENTS BY QUARTER
Q1 2024: 14 vet interventions — 5 respiratory, 4 lameness, 3 digestive, 2 other
Q2 2024: 9 vet interventions — 3 mastitis, 3 lameness, 2 respiratory, 1 injury
Q3 2024: 11 vet interventions — 6 lameness, 3 respiratory, 2 metabolic
Q4 2024: 7 vet interventions (to date) — 4 respiratory, 2 lameness, 1 wound

TOP HEALTH ISSUES (Full Year)
1. Lameness: 17 cases (35% of interventions) — primarily Pen 3 and Pen 5
2. Respiratory: 15 cases (30%) — seasonal peaks in March and October
3. Mastitis: 6 cases (12%) — all in Holstein cohort
4. Metabolic disorders: 4 cases (8%)
5. Other/Injury: 7 cases (14%)

MORTALITY & REPLACEMENT
2 deaths recorded (0.8% mortality rate, industry avg 2.1%)
7 animals retired/sold
12 new animals introduced (Q2 and Q4)

FEED COSTS BY QUARTER
Q1: $18,450 (winter supplementation, $74.7/head)
Q2: $12,200 (spring pasture reduction, $49.4/head)
Q3: $11,800 (peak pasture, $47.8/head)
Q4: $16,900 (winter prep, $68.4/head)
Full Year Total: $59,350 | Per-head annual average: $240.3

WINTER PREPARATION NOTES (Q4 Actions)
- Pen 3 drainage improvements completed October 15
- Respiratory vaccination boosters administered to all animals November 1
- Feed hay reserves: 340 bales (estimated 14-week supply)
- 3 animals flagged for pre-winter weight monitoring: A142, F017, R401
- Heating element installed in Pen 6 water trough (November 20)

BODY CONDITION SCORE OVERVIEW
Average BCS across herd: 3.1/5 (target: 2.5–3.5)
Animals below threshold (BCS < 2.5): 8 animals (3.2%)
Animals above threshold (BCS > 4): 4 animals (1.6%)
`,

  "Q3 Vet Visit Summary.pdf": `
MEADOWBROOK FARM — Q3 2024 VETERINARY VISIT SUMMARY
Veterinarian: Dr. Sarah Okonkwo, DVM | Dates: July–September 2024

VET VISITS LOG
July 3: Routine check, Pen 1 & Pen 4. Animals B089, Q274, S119 flagged for observation.
July 18: Emergency call — Cow F017 (Pen 5) showing abnormal posture. Diagnosed: mild colic. Treatment: flunixin, dietary adjustment. Follow-up in 2 weeks.
August 1: Lameness cases: E115 (Pen 4), P009 (Pen 5). Hoof trimming performed. E115 prescribed anti-inflammatory.
August 15: Follow-up F017 — improved, cleared for normal activity.
August 28: Respiratory cases in Pen 3 — 3 animals treated (B089, R401 and one unnamed). Prescribed antibiotics, 5-day course.
September 10: Routine herd check. BCS assessment. 6 animals flagged for feed monitoring: A142, F017, P009, R401, H198, E115.
September 25: Vaccination round complete — all 247 animals. IBR + BVD + Leptospirosis.

NOTABLE FINDINGS
- Pen 3 has elevated lameness risk — flooring quality concerns raised, recommend surface replacement before winter
- R401 shows recurring respiratory susceptibility — increased monitoring recommended
- E115 movement restriction resolved by end of Q3 but flagged for sensor-based monitoring
- Feed intake decline noted in 6 animals — correlated with Q3 heat stress period (August)

RECOMMENDATIONS FOR Q4
1. Pre-winter respiratory boosters (November)
2. Pen 3 surface remediation (urgent)
3. Continue elevated monitoring for A142, R401, F017
4. BCS re-evaluation for 8 below-threshold animals in October
5. Consider heel horn erosion treatment for Pen 3 cohort proactively
`,

  "Winter Feed Log.pdf": `
MEADOWBROOK FARM — WINTER FEED LOG 2023/2024
Period: November 2023 – March 2024 | Compiled by: Farm Manager

DAILY FEED RATIONS (per animal)
Hay: 12 kg/day/animal (average) — range 10–15 depending on BCS
Grain supplement: 2.1 kg/day for lactating/underweight animals
Silage: 8 kg/day/animal (pen average)
Mineral lick: Continuous access all pens
Water consumption: Average 45L/day/animal

MONTHLY FEED COSTS
November 2023: $8,200 (hay + grain delivery, winter stockpile)
December 2023: $7,400 (stable consumption)
January 2024: $8,100 (cold snap increase, extra grain for 18 animals)
February 2024: $7,900 (mild month, lower supplementation)
March 2024: $6,200 (spring transition, pasture access from March 18)
TOTAL WINTER PERIOD: $37,800

FEED INCIDENTS
January 12: Pen 3 water trough frozen — resolved in 4 hours, no animal dehydration recorded
February 3: Hay delivery delayed 2 days — reserve stock used, no nutritional impact
February 19: Cow A142 feed avoidance noted (3-day episode) — veterinary advice: monitor, resolved without intervention
March 5: 4 animals in Pen 5 showing spring grass transition sensitivity — reduced pasture access for 1 week

BODY CONDITION OBSERVATIONS
End of winter BCS average: 3.0/5 (down from 3.1 entering winter)
4 animals lost more than 0.5 BCS points — targeted recovery feeding in spring
Pen 6 quarantine animals maintained BCS better than average (3.2) due to controlled feeding

NOTES FOR NEXT WINTER
- Increase hay reserve to 400 bales (current 340 was tight in January cold snap)
- Install automated feed monitoring in Pen 3 and Pen 5 (highest variance observed)
- Schedule trough heater installation for October (vs November this year)
`
};

export const SUGGESTED_QUESTIONS = [
  "Which animals had the most vet visits last season?",
  "Summarize my feed costs by quarter",
  "What health trends should I watch this winter?",
  "Which pen has the highest lameness risk?",
  "What does my winter feed log say about Cow A142?",
  "Compare Q3 vs Q4 vet intervention counts",
];

export const KPI_DATA = {
  totalAnimals: 247,
  atRisk: 12,
  criticalAlerts: 3,
  herdHealthScore: 84,
};
