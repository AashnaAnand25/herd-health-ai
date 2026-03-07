import { ANIMALS_LIST, RiskLevel, Animal } from "@/data/syntheticData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, AlertCircle } from "lucide-react";

function StatusDot({ level }: { level: RiskLevel }) {
  const cls = {
    HIGH: "status-dot-danger",
    MEDIUM: "status-dot-warning",
    LOW: "status-dot-healthy",
    "NO-CALL": "status-dot-muted",
  }[level];
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cls}`} />;
}

function RiskBadge({ level, score, confidence }: { level: RiskLevel; score: number; confidence: number }) {
  if (level === "NO-CALL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-field-600 text-muted-foreground border border-border">
        <AlertCircle size={10} />
        NO-CALL
      </span>
    );
  }

  const colors = {
    HIGH:   "bg-danger/10 text-danger border-danger/30",
    MEDIUM: "bg-warning/10 text-warning border-warning/30",
    LOW:    "bg-healthy/10 text-healthy border-healthy/30",
  };

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${colors[level]}`}>
        {score}% · {level}
      </span>
      <span className="text-[9px] font-mono text-muted-foreground">{confidence}% conf.</span>
    </div>
  );
}

export default function RiskTable() {
  const navigate = useNavigate();
  const sorted = [...ANIMALS_LIST].sort((a, b) => {
    const order: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, "NO-CALL": 3 };
    return order[a.riskLevel] - order[b.riskLevel] || b.riskScore - a.riskScore;
  });

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-bold text-foreground">Risk-Ranked Animals</h3>
        <span className="text-xs font-mono text-muted-foreground">{ANIMALS_LIST.length} total</span>
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-field-800/50">
              <th className="text-left px-3 py-2 font-mono text-muted-foreground uppercase tracking-wider">Animal</th>
              <th className="text-left px-3 py-2 font-mono text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Breed</th>
              <th className="text-left px-3 py-2 font-mono text-muted-foreground uppercase tracking-wider hidden md:table-cell">Activity</th>
              <th className="text-right px-3 py-2 font-mono text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((animal, i) => (
              <motion.tr
                key={`${animal.id}-${i}`}
                className="border-b border-border/50 hover:bg-field-600/50 cursor-pointer transition-colors group"
                onClick={() => navigate(`/animal/${animal.id}`)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <StatusDot level={animal.riskLevel} />
                    <div>
                      <span className="font-mono font-semibold text-foreground">#{animal.id}</span>
                      {animal.alertReason && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px] mt-0.5 hidden sm:block">
                          {animal.alertReason}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{animal.breed}</td>
                <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell font-mono">{animal.lastActivity}</td>
                <td className="px-3 py-2.5 text-right">
                  <RiskBadge level={animal.riskLevel} score={animal.riskScore} confidence={animal.confidence} />
                </td>
                <td className="px-2 py-2.5">
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
