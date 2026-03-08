import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  Copy,
  Download,
  FileText,
  Key,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import {
  FIELD_ORACLE_CONTEXT_LIMIT,
  FIELD_ORACLE_DEMO_ACK_KEY,
  FIELD_ORACLE_DEMO_DOCUMENTS,
  FIELD_ORACLE_DEMO_RESPONSES,
  FIELD_ORACLE_SUGGESTED_QUESTIONS,
  FieldOracleConfidence,
  FieldOracleDocType,
  FieldOracleEvidence,
  FieldOracleStructuredResponse,
  inferFieldOracleDocType,
} from "@/data/fieldOracle";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { VET_REFERENCE_MANUALS } from "@/data/referenceManuals";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type MessageRole = "user" | "assistant";

interface FieldOracleDocument {
  id: string;
  name: string;
  type: FieldOracleDocType;
  pageCount: number;
}

interface FieldOracleEvidence {
  documentId: string;
  content: string;
  type: string;
  confidence: FieldOracleConfidence;
}

interface FieldOracleStructuredResponse {
  documents: FieldOracleDocument[];
  evidence: FieldOracleEvidence[];
  suggestions: string[];
  confidence: FieldOracleConfidence;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface UserMessage {
  id: string;
  role: "user";
  content: string;
}

interface AssistantMessage {
  id: string;
  role: "assistant";
  rawText: string;
  response: FieldOracleStructuredResponse;
  checklist: ChecklistItem[] | null;
}

type FieldOracleMessage = UserMessage | AssistantMessage;

const SYSTEM_PROMPT = `You are Field Oracle, an agricultural document assistant. 

STRICT RULES:
1. Answer using BOTH the provided farm documents and the Veterinary Reference Manuals.
2. ALWAYS distinguish between farm-specific facts (from Documents) and general medical/technical knowledge (from Manuals).
3. ALWAYS cite your sources. 
   - For farm documents, use: [Source: Document Name]
   - For veterinary manuals, use: [Source: Merck Veterinary Manual — Section Name]
4. ALWAYS start medical advice with "Based on the [Manual Name]..." to build trust.
5. If information is not in the documents or manuals, say: "This information is not in your current documents or reference manuals."
6. NEVER invent statistics, animal counts, or medical facts.
7. STATE your confidence level: High (directly supported), Moderate (partially supported), or Not Found.
8. Keep answers concise.

FORMAT EVERY RESPONSE EXACTLY LIKE THIS:
**Answer:** [direct answer here]

**Supporting Evidence:**
[Source: Name — Section]: "exact quoted text..."

**Confidence:** [High/Moderate/Not Found] — [one sentence explanation]`;

const TYPE_BADGE_STYLES: Record<FieldOracleDocType, string> = {
  "Annual Report": "border-sky-400/30 bg-sky-500/10 text-sky-300",
  "Vet Records": "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  SOP: "border-orange-400/30 bg-orange-500/10 text-orange-300",
  "Extension Publication": "border-violet-400/30 bg-violet-500/10 text-violet-300",
  "Cost Log": "border-amber-400/30 bg-amber-500/10 text-amber-300",
};

const DEMO_BANNER_TEXT =
  "Demo Mode — using cached responses. Add `VITE_ANTHROPIC_API_KEY` to `.env.local` for live answers.";
const ENV_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() ?? "";

function createInitialDocuments(): FieldOracleDocument[] {
  const now = Date.now();

  return FIELD_ORACLE_DEMO_DOCUMENTS.map((doc, index) => ({
    id: `demo-${index}`,
    name: doc.name,
    type: doc.type,
    pageCount: doc.pageCount,
    text: doc.text,
    enabled: true,
    source: "demo",
    createdAt: now - index,
    priority: 10 - index,
  }));
}

function createInitialMessage(): AssistantMessage {
  const response: FieldOracleStructuredResponse = {
    answer:
      "Upload farm PDFs or enable Vet Reference Manuals to ask grounded health questions. Field Oracle combines your specific farm data with clinical knowledge.",
    evidence: [
      {
        source: "Field Oracle — Workspace",
        quote:
          "Reference manuals and farm documents are now integrated. You can ask about symptoms and compare them with your farm's history.",
      },
    ],
    confidence: "High",
    confidenceNote: "This is the current workspace configuration.",
  };

  return {
    id: "assistant-welcome",
    role: "assistant",
    rawText: formatStructuredResponse(response),
    response,
    checklist: null,
  };
}

function formatStructuredResponse(response: FieldOracleStructuredResponse) {
  const evidenceBlock = response.evidence
    .map(({ source, quote }) => `[Source: ${source}]: "${quote}"`)
    .join("\n");

  return `**Answer:** ${response.answer}

**Supporting Evidence:**
${evidenceBlock}

**Confidence:** ${response.confidence} — ${response.confidenceNote}`;
}

function parseClaudeResponse(text: string): FieldOracleStructuredResponse {
  const cleaned = text.trim();
  const answerMatch = cleaned.match(
    /(?:\*\*)?Answer:(?:\*\*)?\s*([\s\S]*?)(?=\n\s*(?:\*\*)?Supporting Evidence:)/i,
  );
  const evidenceMatch = cleaned.match(
    /(?:\*\*)?Supporting Evidence:(?:\*\*)?\s*([\s\S]*?)(?=\n\s*(?:\*\*)?Confidence:)/i,
  );
  const confidenceMatch = cleaned.match(/(?:\*\*)?Confidence:(?:\*\*)?\s*([\s\S]*)$/i);

  const evidenceSection = evidenceMatch?.[1]?.trim() ?? "";
  const evidence: FieldOracleEvidence[] = [];
  const evidenceRegex = /\[Source:\s*(.+?)\]:\s*"([\s\S]*?)"/g;

  for (const match of evidenceSection.matchAll(evidenceRegex)) {
    evidence.push({
      source: match[1].trim(),
      quote: match[2].trim(),
    });
  }

  const confidenceLine = confidenceMatch?.[1]?.trim() ?? "Moderate — The model response could not be fully parsed.";
  const confidenceParts = confidenceLine.match(/(High|Moderate|Not Found)\s*[—-]\s*([\s\S]+)/i);
  const confidence = (confidenceParts?.[1] as FieldOracleConfidence | undefined) ?? "Moderate";
  const confidenceNote = confidenceParts?.[2]?.trim() ?? "The model response could not be fully parsed.";

  return {
    answer: stripMarkdown(answerMatch?.[1]?.trim() ?? cleaned),
    evidence:
      evidence.length > 0
        ? evidence
        : [
            {
              source: "Model response",
              quote: stripMarkdown(evidenceSection || "No explicit supporting quote was returned."),
            },
          ],
    confidence,
    confidenceNote,
  };
}

function stripMarkdown(text: string) {
  return text.replace(/\*\*/g, "").trim();
}

function buildDocumentContext(documents: FieldOracleDocument[]) {
  const sorted = [...documents].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.createdAt - a.createdAt;
  });

  let remaining = FIELD_ORACLE_CONTEXT_LIMIT;
  const parts: string[] = [];

  for (const doc of sorted) {
    if (remaining <= 0) break;

    const header = `=== DOCUMENT: ${doc.name} ===
TYPE: ${doc.type}
PAGES: ${doc.pageCount}
SOURCE: ${doc.source}
`;
    const budgetForDoc = Math.max(0, remaining - header.length);
    const docText =
      doc.text.length <= budgetForDoc
        ? doc.text
        : `${doc.text.slice(0, Math.max(0, budgetForDoc - 16))}\n[TRUNCATED]`;

    const block = `${header}${docText}\n`;
    parts.push(block);
    remaining -= block.length;
  }

  return parts.join("\n");
}

function createUserMessage(content: string): UserMessage {
  return {
    id: `user-${crypto.randomUUID()}`,
    role: "user",
    content,
  };
}

function createAssistantMessage(response: FieldOracleStructuredResponse): AssistantMessage {
  return {
    id: `assistant-${crypto.randomUUID()}`,
    role: "assistant",
    rawText: formatStructuredResponse(response),
    response,
    checklist: null,
  };
}

function getConversationHistory(messages: FieldOracleMessage[]) {
  return messages.map(message => ({
    role: message.role as MessageRole,
    content: message.role === "user" ? message.content : message.rawText,
  }));
}

function buildNotFoundResponse(question: string): FieldOracleStructuredResponse {
  return {
    answer: `This information is not in your current documents or manuals. Try uploading more records or enabling more reference manuals.`,
    evidence: [
      {
        source: "Workspace Search",
        quote: `No directly supporting passage was found for: "${question}".`,
      },
    ],
    confidence: "Not Found",
    confidenceNote: "No matching evidence was found in the active context.",
  };
}

function buildChecklistItems(answer: string) {
  const numberedSegments = answer
    .split(/\s+(?=\d+\.\s)/)
    .map(part => part.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const baseItems =
    numberedSegments.length >= 2
      ? numberedSegments
      : answer
          .split(/(?:\.\s+|;\s+|\n+)/)
          .map(part => part.replace(/^[•-]\s*/, "").trim())
          .filter(part => part.length > 0);

  return baseItems
    .map(item => item.replace(/^Use this checklist:\s*/i, "").trim())
    .filter(item => item.length > 0)
    .map(item => ({
      id: crypto.randomUUID(),
      label: item.endsWith(".") ? item.slice(0, -1) : item,
      checked: false,
    }));
}

function canGenerateChecklist(answer: string) {
  return (
    /\b(checklist|check|inspect|record|maintain|confirm|monitor|step|steps)\b/i.test(answer) ||
    /\d+\.\s/.test(answer)
  );
}

async function extractPdfText(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push(`PAGE ${pageNumber}\n${pageText}`);
  }

  return {
    pageCount: pdf.numPages,
    text: pages.join("\n\n"),
  };
}

function getDemoResponse(question: string) {
  const exact = FIELD_ORACLE_DEMO_RESPONSES[question as keyof typeof FIELD_ORACLE_DEMO_RESPONSES];
  if (exact) return exact;

  return buildNotFoundResponse(question);
}

function DocumentCard({
  document,
  onToggle,
}: {
  document: FieldOracleDocument;
  onToggle: (id: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-border bg-field-700/70 p-3 transition-colors hover:border-primary/35">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={document.enabled}
          onChange={() => onToggle(document.id)}
          className="mt-1 h-4 w-4 rounded border-border bg-field-800 accent-[hsl(88_100%_62%)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-foreground">
            <FileText size={13} className="text-primary flex-shrink-0" />
            <p className="truncate text-sm font-medium">{document.name}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${TYPE_BADGE_STYLES[document.type]}`}
            >
              {document.type}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">{document.pageCount} pages</span>
          </div>
        </div>
      </div>
    </label>
  );
}

function AssistantResponseCard({
  message,
  onGenerateChecklist,
  onToggleChecklistItem,
  onCopyChecklist,
  onDownloadReport,
}: {
  message: AssistantMessage;
  onGenerateChecklist: (id: string) => void;
  onToggleChecklistItem: (messageId: string, itemId: string) => void;
  onCopyChecklist: (messageId: string) => void;
  onDownloadReport: (message: AssistantMessage) => void;
}) {
  const { response, checklist } = message;
  const confidenceLabel =
    response.confidence === "High"
      ? "✅ High confidence"
      : response.confidence === "Moderate"
        ? "⚠️ Moderate confidence"
        : "❓ Not found";

  return (
    <motion.div
      className="mb-4 flex justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mr-3 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-lime-dark">
        <Sparkles size={14} className="text-primary" />
      </div>
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-field-700/80 p-4">
        <div className="space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Answer</p>
              <button
                onClick={() => onDownloadReport(message)}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] font-mono text-primary transition-colors hover:bg-primary/10"
              >
                <Download size={12} />
                Download Report
              </button>
            </div>
            {checklist ? (
              <div className="rounded-xl border border-primary/20 bg-field-800/80 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Checklist</p>
                  <button
                    onClick={() => onCopyChecklist(message.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                </div>
                <div className="space-y-2">
                  {checklist.map(item => (
                    <label key={item.id} className="flex items-start gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggleChecklistItem(message.id, item.id)}
                        className="mt-1 h-4 w-4 rounded border-border bg-field-900 accent-[hsl(88_100%_62%)]"
                      />
                      <span className={item.checked ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{response.answer}</p>
            )}
          </section>

          <section>
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Supporting Evidence
            </p>
            <div className="space-y-2">
              {response.evidence.map((evidence, index) => (
                <div
                  key={`${evidence.source}-${index}`}
                  className="rounded-xl border border-primary/25 bg-field-800/90 p-3 font-mono text-xs leading-6 text-primary/90"
                >
                  <p className="mb-1 text-primary">{`[Source: ${evidence.source}]`}</p>
                  <p className="text-foreground/90">"{evidence.quote}"</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-field-800/60 p-3">
            <p className="text-sm font-semibold text-foreground">{confidenceLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">{response.confidenceNote}</p>
          </section>

          {!checklist && canGenerateChecklist(response.answer) && (
            <button
              onClick={() => onGenerateChecklist(message.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-mono uppercase tracking-wider text-primary transition-colors hover:bg-primary/15"
            >
              <CheckSquare size={14} />
              Generate Checklist
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UploadModal({
  isOpen,
  isParsing,
  error,
  onClose,
  onFileSelected,
}: {
  isOpen: boolean;
  isParsing: boolean;
  error: string;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-xl rounded-2xl border border-border bg-field-900 p-6 shadow-2xl"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={event => event.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Upload Document</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag and drop a farm PDF. Field Oracle extracts the text in your browser only.
              </p>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div
            onDragEnter={event => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={event => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={event => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={event => {
              event.preventDefault();
              setIsDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) onFileSelected(file);
            }}
            className={`rounded-2xl border border-dashed p-10 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/8" : "border-border bg-field-800/60"
            }`}
          >
            {isParsing ? (
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm">Parsing PDF and extracting text...</p>
              </div>
            ) : (
              <>
                <Upload size={30} className="mx-auto text-primary" />
                <p className="mt-4 text-base font-medium text-foreground">Drop a PDF here</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF only. The file is processed client-side.</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-lime-glow"
                >
                  Choose PDF
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) onFileSelected(file);
              event.target.value = "";
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ApiKeyModal({
  isOpen,
  value,
  onChange,
  onClose,
  onSave,
  onUseDemo,
}: {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onUseDemo: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md rounded-2xl border border-border bg-field-900 p-6 shadow-2xl"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={event => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Use Field Oracle</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your Anthropic API key to use Field Oracle. Stored locally in your browser only.
              </p>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-muted-foreground">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-warning" />
            <p>
              Recommended: put `VITE_ANTHROPIC_API_KEY` in `.env.local` so Field Oracle uses it automatically.
              This modal is only a temporary fallback for the current session.
            </p>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Anthropic API Key
            </span>
            <input
              type="password"
              value={value}
              onChange={event => onChange(event.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-xl border border-border bg-field-800 px-3 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSave}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-lime-glow"
            >
              Use For This Session
            </button>
            <button
              onClick={onUseDemo}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              Use Demo Mode
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function FieldOracle() {
  const [documents, setDocuments] = useState<FieldOracleDocument[]>(createInitialDocuments);
  const [enabledManualIds, setEnabledManualIds] = useState<string[]>(["merck-cattle-001", "merck-cattle-002"]);
  const [messages, setMessages] = useState<FieldOracleMessage[]>([createInitialMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [demoModeConfirmed, setDemoModeConfirmed] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isParsingUpload, setIsParsingUpload] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const storedDemoAck = window.localStorage.getItem(FIELD_ORACLE_DEMO_ACK_KEY) === "true";

    setApiKey(ENV_API_KEY);
    setKeyInput("");
    setDemoModeConfirmed(storedDemoAck);
  }, []);

  const uploadedDocuments = useMemo(
    () => documents.filter(document => document.source === "upload"),
    [documents],
  );
  const demoDocuments = useMemo(
    () => documents.filter(document => document.source === "demo"),
    [documents],
  );
  const selectedDocuments = useMemo(
    () => documents.filter(document => document.enabled),
    [documents],
  );

  const selectedManuals = useMemo(
    () => VET_REFERENCE_MANUALS.filter(manual => enabledManualIds.includes(manual.id)),
    [enabledManualIds],
  );

  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    if (!apiKey && !demoModeConfirmed) {
      setPendingQuestion(trimmed);
      setShowKeyModal(true);
      return;
    }

    const userMessage = createUserMessage(trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const assistantResponse = apiKey
        ? await requestClaudeResponse(trimmed, nextMessages, selectedDocuments, selectedManuals, apiKey)
        : await requestDemoResponse(trimmed);

      setMessages(previous => [...previous, createAssistantMessage(assistantResponse)]);
    } catch (error) {
      const fallbackResponse = {
        answer: "The request failed. Please check your internet connection or API key.",
        evidence: [
          {
            source: "System Error",
            quote: error instanceof Error ? error.message : "An unknown error occurred.",
          },
        ],
        confidence: "Moderate" as const,
        confidenceNote: "The failure was technical.",
      };

      setMessages(previous => [...previous, createAssistantMessage(fallbackResponse)]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDemoResponse = async (question: string) => {
    await new Promise(resolve => window.setTimeout(resolve, 1500));
    return getDemoResponse(question);
  };

  const requestClaudeResponse = async (
    question: string,
    conversation: FieldOracleMessage[],
    activeDocuments: FieldOracleDocument[],
    activeManuals: typeof VET_REFERENCE_MANUALS,
    userApiKey: string,
  ) => {
    const manualContext = activeManuals.map(m => `=== REFERENCE MANUAL: ${m.name} ===\n${m.content}`).join("\n\n");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": userApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: `${SYSTEM_PROMPT}

LOADED FARM DOCUMENTS:
${buildDocumentContext(activeDocuments)}

LOADED REFERENCE MANUALS:
${manualContext}`,
        messages: getConversationHistory(conversation),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    if (!text) {
      return buildNotFoundResponse(question);
    }

    return parseClaudeResponse(text);
  };

  const handleDownloadReport = (message: AssistantMessage) => {
    // Simple text download for now
    const text = message.rawText || message.response || "No response available";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field-oracle-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleManual = (manualId: string) => {
    setEnabledManualIds(prev => 
      prev.includes(manualId) 
        ? prev.filter(id => id !== manualId) 
        : [...prev, manualId]
    );
  };

  const handleTextareaInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  };

  const handleToggleDocument = (documentId: string) => {
    setDocuments(previous =>
      previous.map(document =>
        document.id === documentId ? { ...document, enabled: !document.enabled } : document,
      ),
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "text/plain" && !file.type.includes("image/")) {
      setUploadError("Please upload a text file or image");
      return;
    }
    
    setUploadError("");
    setIsParsingUpload(true);
    
    // Simple text processing for now
    const text = await file.text();
    
    setTimeout(() => {
      const mockDocument: FieldOracleDocument = {
        id: `upload-${crypto.randomUUID()}`,
        name: file.name.replace(/\.txt$/i, ""),
        type: "general" as FieldOracleDocType,
        pageCount: 1
      };
      
      const mockResponse: FieldOracleStructuredResponse = {
        documents: [mockDocument],
        evidence: [{
          documentId: mockDocument.id,
          content: text.slice(0, 1000) + "...",
          type: "text_content",
          confidence: "medium" as FieldOracleConfidence
        }],
        suggestions: ["Consider providing more specific details about the livestock health issue"],
        confidence: "medium" as FieldOracleConfidence
      };
      
      setDocuments(previous => [mockDocument, ...previous]);
      setIsParsingUpload(false);
    }, 1000);
  };

  const handleSaveApiKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;

    setApiKey(trimmed);
    setDemoModeConfirmed(false);
    window.localStorage.removeItem(FIELD_ORACLE_DEMO_ACK_KEY);
    setShowKeyModal(false);

    if (pendingQuestion) {
      const queued = pendingQuestion;
      setPendingQuestion(null);
      await submitQuestion(queued);
    }
  };

  const handleUseDemoMode = async () => {
    setDemoModeConfirmed(true);
    window.localStorage.setItem(FIELD_ORACLE_DEMO_ACK_KEY, "true");
    setShowKeyModal(false);

    if (pendingQuestion) {
      const queued = pendingQuestion;
      setPendingQuestion(null);
      await submitQuestion(queued);
    }
  };

  const handleClearConversation = () => {
    setMessages([createInitialMessage()]);
  };

  const handleGenerateChecklist = (messageId: string) => {
    setMessages(previous =>
      previous.map(message => {
        if (message.role !== "assistant" || message.id !== messageId) return message;

        return {
          ...message,
          checklist: buildChecklistItems(message.response.answer),
        };
      }),
    );
  };

  const handleToggleChecklistItem = (messageId: string, itemId: string) => {
    setMessages(previous =>
      previous.map(message => {
        if (message.role !== "assistant" || message.id !== messageId || !message.checklist) return message;

        return {
          ...message,
          checklist: message.checklist.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
    );
  };

  const handleCopyChecklist = async (messageId: string) => {
    const message = messages.find(entry => entry.role === "assistant" && entry.id === messageId);
    if (!message || message.role !== "assistant" || !message.checklist) return;

    const text = message.checklist
      .map(item => `- [${item.checked ? "x" : " "}] ${item.label}`)
      .join("\n");

    await navigator.clipboard.writeText(text);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden md:flex-row">
        <aside className="flex h-[38vh] flex-col border-b border-border bg-field-800/45 md:h-auto md:w-[30%] md:min-w-[320px] md:max-w-[420px] md:border-b-0 md:border-r">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Knowledge Hub
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {selectedDocuments.length + enabledManualIds.length} sources active
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-lime-glow"
              >
                <Upload size={14} />
                Upload
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Reference Manuals
                </p>
                <BookOpen size={12} className="text-muted-foreground" />
              </div>
              {VET_REFERENCE_MANUALS.map(manual => (
                <label key={manual.id} className="block rounded-xl border border-border bg-field-700/70 p-3 transition-colors hover:border-primary/35">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={enabledManualIds.includes(manual.id)}
                      onChange={() => handleToggleManual(manual.id)}
                      className="mt-1 h-4 w-4 rounded border-border bg-field-800 accent-[hsl(88_100%_62%)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{manual.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{manual.author}</p>
                    </div>
                  </div>
                </label>
              ))}
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Farm Documents
                </p>
                <span className="text-[11px] font-mono text-muted-foreground">{documents.length}</span>
              </div>
              {documents.map(document => (
                <DocumentCard key={document.id} document={document} onToggle={handleToggleDocument} />
              ))}
            </section>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border bg-field-800/35 px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">Field Oracle</h2>
                  <span className="rounded-full border border-border bg-field-700 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Health Intelligence
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI analysis grounded in farm records and veterinary manuals.
                </p>
              </div>

              <button
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <Key size={14} />
                {ENV_API_KEY ? "API Connected" : apiKey ? "Session Key Set" : "Set API Key"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {messages.length === 1 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What are the symptoms of Bloat according to the manual?",
                    "Check my vet records for respiratory issues and compare with BRD protocols",
                    "Do we have any hardware disease flags in our recent reports?",
                    "Summarize winter feeding SOP"
                  ].map(question => (
                    <button
                      key={question}
                      onClick={() => submitQuestion(question)}
                      className="rounded-full border border-border bg-field-700 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message =>
              message.role === "user" ? (
                <motion.div
                  key={message.id}
                  className="mb-4 flex justify-end"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="max-w-3xl rounded-2xl border border-primary/30 bg-lime-dark px-4 py-3 text-sm leading-6 text-primary">
                    {message.content}
                  </div>
                </motion.div>
              ) : (
                <AssistantResponseCard
                  key={message.id}
                  message={message}
                  onGenerateChecklist={handleGenerateChecklist}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onCopyChecklist={handleCopyChecklist}
                />
              ),
            )}

            {isLoading && (
              <motion.div
                className="mb-4 flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-lime-dark">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div className="rounded-2xl border border-border bg-field-700/80 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    Field Oracle is consulting your manuals and records...
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border bg-field-800/35 px-4 py-4 md:px-6">
            <div className="rounded-2xl border border-border bg-field-700/70 p-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={event => setInput(event.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitQuestion(input);
                  }
                }}
                placeholder="Ask about symptoms, records, or protocols..."
                className="max-h-[180px] min-h-[44px] w-full resize-none bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleClearConversation}
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Trash2 size={12} />
                  Clear conversation
                </button>
                <button
                  onClick={() => void submitQuestion(input)}
                  disabled={!input.trim() || isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-lime-glow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <UploadModal
        isOpen={showUploadModal}
        isParsing={isParsingUpload}
        error={uploadError}
        onClose={() => {
          if (!isParsingUpload) {
            setShowUploadModal(false);
            setUploadError("");
          }
        }}
        onFileSelected={file => void handleUploadPdf(file)}
      />

      <ApiKeyModal
        isOpen={showKeyModal}
        value={keyInput}
        onChange={setKeyInput}
        onClose={() => {
          setShowKeyModal(false);
          setPendingQuestion(null);
        }}
        onSave={() => void handleSaveApiKey()}
        onUseDemo={() => void handleUseDemoMode()}
      />
    </AppLayout>
  );
}
