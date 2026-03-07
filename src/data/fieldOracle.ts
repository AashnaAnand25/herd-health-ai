export type FieldOracleDocType =
  | "Annual Report"
  | "Vet Records"
  | "SOP"
  | "Extension Publication"
  | "Cost Log";

export type FieldOracleConfidence = "High" | "Moderate" | "Not Found";

export interface FieldOracleEvidence {
  source: string;
  quote: string;
}

export interface FieldOracleStructuredResponse {
  answer: string;
  evidence: FieldOracleEvidence[];
  confidence: FieldOracleConfidence;
  confidenceNote: string;
}

export interface FieldOracleSeedDocument {
  name: string;
  type: FieldOracleDocType;
  pageCount: number;
  text: string;
}

export const FIELD_ORACLE_STORAGE_KEY = "herdmind_api_key";
export const FIELD_ORACLE_DEMO_ACK_KEY = "field_oracle_demo_ack";
export const FIELD_ORACLE_CONTEXT_LIMIT = 80_000;

export const FIELD_ORACLE_SUGGESTED_QUESTIONS = [
  "What were our top health issues last year?",
  "Summarize the winter feeding SOP as a checklist",
  "How many vet visits did we have in Q3?",
  "Which animals were flagged for follow-up?",
  "What does the extension factsheet say about foot rot?",
  "Compare our feed costs this year vs last year",
  "Which animals are due for vaccines this month?",
] as const;

export const FIELD_ORACLE_DEMO_DOCUMENTS: FieldOracleSeedDocument[] = [
  {
    name: "2024 Meadowbrook Annual Farm Report",
    type: "Annual Report",
    pageCount: 12,
    text: `MEADOWBROOK FARM — 2024 ANNUAL FARM REPORT

HERD OVERVIEW
Total herd size: 247 cattle across six pens.
Vaccination compliance for the year: 89%.

HEALTH OVERVIEW
Top health issues in 2024 were respiratory illness in Q1, lameness in Q3, and pinkeye in Q4.

QUARTERLY VET VISIT COUNTS
Q1: 18 visits
Q2: 11 visits
Q3: 23 visits
Q4: 9 visits

FEED COSTS BY SEASON
Spring: $18,600
Summer: $20,100
Fall: $21,900
Winter: $23,600

WINTER PREP NOTES
Hay reserves were increased before December.
Water line insulation was checked across all pens.
Shelter repairs were completed in Pen 3 before the first freeze.`,
  },
  {
    name: "Q3 2024 Veterinary Visit Summary",
    type: "Vet Records",
    pageCount: 6,
    text: `Q3 2024 VETERINARY VISIT SUMMARY

SUMMARY
Total visits in Q3: 23.
Average cost per visit: $340.

CASE BREAKDOWN
Lameness cases: 8.
Respiratory cases: 4.
Other cases included digestive issues, wound care, and preventive follow-ups.

ANTIBIOTIC USAGE LOG
Oxytetracycline used in 3 respiratory cases.
Ceftiofur used in 2 follow-up respiratory treatments.

FOLLOW-UP FLAGS
Three animals were flagged for follow-up: A142, B089, and C201.`,
  },
  {
    name: "Beef Cattle Winter Feeding SOP",
    type: "SOP",
    pageCount: 8,
    text: `BEEF CATTLE WINTER FEEDING SOP

PURPOSE
Standard procedure for winter feed management.

HAY ALLOCATION BY WEIGHT CLASS
Under 450 kg: 9 kg hay/day.
450 to 600 kg: 11 kg hay/day.
Over 600 kg: 13 kg hay/day.

WATER SYSTEM DAILY CHECKS
Inspect trough flow at 06:00 and 16:00.
Break surface ice immediately when present.
Record any heater malfunction in the maintenance log.

SHELTER TEMPERATURE MINIMUMS
Maintain sheltered areas above -4 C during extreme cold.

STAFF DUTY ROSTER
Morning feed lead checks hay distribution.
Midday round verifies water and bedding.
Evening closeout confirms intake notes and shelter condition.`,
  },
  {
    name: "UIUC Extension: Common Cattle Diseases Factsheet",
    type: "Extension Publication",
    pageCount: 5,
    text: `UIUC EXTENSION FACTSHEET — COMMON CATTLE DISEASES

BRD
Symptoms include fever, nasal discharge, coughing, and reduced intake.
Treatment protocol: isolate affected cattle, monitor temperature, and consult veterinarian for antibiotic selection.

FOOT ROT
Identification: sudden lameness, swelling between the claws, foul odor, and heat in the hoof.
Treatment: clean the hoof, begin veterinarian-directed antibiotics, and keep animals in dry footing.

PINKEYE
Prevention steps include fly control, reducing face irritation, and early isolation of affected animals.

HEAT STRESS
Indicators include panting, crowding around water, drooling, and reduced movement.

ESCALATION CRITERIA
Call the veterinarian immediately when lameness is severe, breathing is labored, or animals stop eating.`,
  },
  {
    name: "2024 Feed Purchase and Cost Log",
    type: "Cost Log",
    pageCount: 9,
    text: `2024 FEED PURCHASE AND COST LOG

MONTHLY PURCHASE SUMMARY
Hay purchases were highest in January and November.
Protein supplement spending increased in late summer.

COST PER TON
Hay: $248 per ton.
Silage: $78 per ton.
Protein supplement: $412 per ton.

ANNUAL TOTAL
Total annual feed spend for 2024: $84,200.

YEAR-OVER-YEAR COMPARISON
Feed spend increased by 12% versus 2023.`,
  },
  {
    name: "2024–2025 Vaccination & Health Record",
    type: "Vet Records",
    pageCount: 6,
    text: `2024–2025 VACCINATION & HEALTH RECORD — MEADOWBROOK FARM

PER-ANIMAL VACCINATION LOG (sample animals)

Animal ID: A142 (Bessie). Breed: Holstein. Pen: Pen 3.
- Clostridial 7-way: given 2024-09-15; next due 2025-03-15 (booster due in ~10 days).
- IBR/BVD/PI3/BRSV (respiratory): given 2024-10-01; next due 2025-04-01.
- Deworming: given 2024-11-20; next due 2025-02-20.
Notes: Currently flagged for reduced feeding; ensure vaccine timing does not stress animal.

Animal ID: R401 (Ginger). Breed: Hereford. Pen: Pen 3.
- Clostridial 7-way: given 2024-08-22; next due 2025-02-22 (OVERDUE).
- Respiratory (IBR/BVD): given 2024-09-10; next due 2025-03-10.
Notes: Rapid weight loss noted; vet follow-up scheduled. Do not vaccinate until vet clears.

Animal ID: B089 (Daisy). Breed: Angus. Pen: Pen 3.
- Clostridial 7-way: given 2024-10-05; next due 2025-04-05.
- Respiratory: given 2024-10-05; next due 2025-04-05.
- Deworming: given 2024-12-01; next due 2025-03-01.
Notes: Gait irregularity under observation. Vaccines current.

Animal ID: F017 (Clover). Breed: Holstein. Pen: Pen 5.
- Clostridial 7-way: given 2024-09-28; next due 2025-03-28.
- Respiratory: given 2024-09-28; next due 2025-03-28.
Notes: Abnormal lying posture; monitor before next booster.

Animal ID: G044 (Rosie). Breed: Charolais. Pen: Pen 2.
- Clostridial 7-way: given 2024-11-01; next due 2025-05-01.
- Respiratory: given 2024-11-01; next due 2025-05-01.
Notes: Temperature elevation recently; delay any new vaccines until normal.

Animal ID: C201 (Ishani). Breed: Hereford. Pen: Pen 1.
- Clostridial 7-way: given 2024-10-15; next due 2025-04-15.
- Deworming: given 2024-11-25; next due 2025-02-25 (due soon).
Notes: Healthy baseline.

HERD-LEVEL REMINDERS
- Animals due for clostridial booster in next 30 days: A142, R401 (overdue).
- Do not vaccinate animals with active fever or acute illness; consult vet for stressed or at-risk animals.
- Withdrawal times: observe drug withdrawal times per FDA CVM / FARAD reference before slaughter or milk.`,
  },
];

export const FIELD_ORACLE_DEMO_RESPONSES: Record<
  (typeof FIELD_ORACLE_SUGGESTED_QUESTIONS)[number],
  FieldOracleStructuredResponse
> = {
  "What were our top health issues last year?": {
    answer:
      "Your top health issues last year were respiratory illness in Q1, lameness in Q3, and pinkeye in Q4.",
    evidence: [
      {
        source: "2024 Meadowbrook Annual Farm Report — Health Overview",
        quote:
          "Top health issues in 2024 were respiratory illness in Q1, lameness in Q3, and pinkeye in Q4.",
      },
    ],
    confidence: "High",
    confidenceNote: "The annual report states the top health issues directly.",
  },
  "Summarize the winter feeding SOP as a checklist": {
    answer:
      "Use this winter feeding checklist: 1. Match hay allocation to each weight class. 2. Check trough flow at 06:00 and 16:00. 3. Break ice immediately when present. 4. Log heater malfunctions. 5. Keep sheltered areas above -4 C during extreme cold. 6. Confirm hay distribution, bedding, and intake notes on each staff round.",
    evidence: [
      {
        source: "Beef Cattle Winter Feeding SOP — Hay Allocation by Weight Class",
        quote:
          "Under 450 kg: 9 kg hay/day. 450 to 600 kg: 11 kg hay/day. Over 600 kg: 13 kg hay/day.",
      },
      {
        source: "Beef Cattle Winter Feeding SOP — Water System Daily Checks",
        quote:
          "Inspect trough flow at 06:00 and 16:00. Break surface ice immediately when present. Record any heater malfunction in the maintenance log.",
      },
      {
        source: "Beef Cattle Winter Feeding SOP — Shelter Temperature Minimums",
        quote: "Maintain sheltered areas above -4 C during extreme cold.",
      },
    ],
    confidence: "High",
    confidenceNote: "The SOP provides explicit operational steps that convert cleanly into a checklist.",
  },
  "How many vet visits did we have in Q3?": {
    answer: "You had 23 vet visits in Q3.",
    evidence: [
      {
        source: "Q3 2024 Veterinary Visit Summary — Summary",
        quote: "Total visits in Q3: 23.",
      },
      {
        source: "2024 Meadowbrook Annual Farm Report — Quarterly Vet Visit Counts",
        quote: "Q3: 23 visits",
      },
    ],
    confidence: "High",
    confidenceNote: "Two documents independently confirm the same Q3 visit count.",
  },
  "Which animals were flagged for follow-up?": {
    answer: "The animals flagged for follow-up were A142, B089, and C201.",
    evidence: [
      {
        source: "Q3 2024 Veterinary Visit Summary — Follow-Up Flags",
        quote: "Three animals were flagged for follow-up: A142, B089, and C201.",
      },
    ],
    confidence: "High",
    confidenceNote: "The vet summary lists the flagged animals explicitly.",
  },
  "What does the extension factsheet say about foot rot?": {
    answer:
      "The extension factsheet says foot rot is identified by sudden lameness, swelling between the claws, foul odor, and heat in the hoof. It recommends cleaning the hoof, starting veterinarian-directed antibiotics, and keeping animals in dry footing.",
    evidence: [
      {
        source: "UIUC Extension: Common Cattle Diseases Factsheet — Foot Rot",
        quote:
          "Identification: sudden lameness, swelling between the claws, foul odor, and heat in the hoof. Treatment: clean the hoof, begin veterinarian-directed antibiotics, and keep animals in dry footing.",
      },
    ],
    confidence: "High",
    confidenceNote: "The factsheet provides both identification and treatment guidance directly.",
  },
  "Compare our feed costs this year vs last year": {
    answer:
      "Your 2024 feed spend was $84,200, which was 12% higher than 2023.",
    evidence: [
      {
        source: "2024 Feed Purchase and Cost Log — Annual Total",
        quote: "Total annual feed spend for 2024: $84,200.",
      },
      {
        source: "2024 Feed Purchase and Cost Log — Year-Over-Year Comparison",
        quote: "Feed spend increased by 12% versus 2023.",
      },
    ],
    confidence: "High",
    confidenceNote: "The cost log states both the annual total and the year-over-year change directly.",
  },
  "Which animals are due for vaccines this month?": {
    answer:
      "From your vaccination record: A142 (Bessie) has a clostridial 7-way booster due around March 15 (in ~10 days). R401 (Ginger) is OVERDUE for clostridial booster (next due was Feb 22). C201 (Ishani) has deworming due soon (Feb 25). Do not vaccinate R401 until the vet clears her (rapid weight loss); and delay vaccines for G044 (Rosie) until her temperature is normal.",
    evidence: [
      {
        source: "2024–2025 Vaccination & Health Record — Per-Animal Log (A142)",
        quote: "Clostridial 7-way: given 2024-09-15; next due 2025-03-15 (booster due in ~10 days).",
      },
      {
        source: "2024–2025 Vaccination & Health Record — Per-Animal Log (R401)",
        quote: "Clostridial 7-way: given 2024-08-22; next due 2025-02-22 (OVERDUE).",
      },
      {
        source: "2024–2025 Vaccination & Health Record — Herd-Level Reminders",
        quote: "Animals due for clostridial booster in next 30 days: A142, R401 (overdue). Do not vaccinate animals with active fever or acute illness.",
      },
    ],
    confidence: "High",
    confidenceNote: "The vaccination record lists next-due dates and herd-level reminders directly.",
  },
};

export function inferFieldOracleDocType(fileName: string): FieldOracleDocType {
  const name = fileName.toLowerCase();

  if (name.includes("annual")) return "Annual Report";
  if (name.includes("vet")) return "Vet Records";
  if (name.includes("sop")) return "SOP";
  if (name.includes("extension") || name.includes("factsheet")) return "Extension Publication";
  return "Cost Log";
}
