"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:3001";

type TestResult = {
  testCase: number;
  passed: boolean;
  stdout: string;
  expected: string;
  stderr: string;
  durationMs: number;
};

type SubmissionResult = {
  verdict: string;
  testResults: TestResult[];
  totalDurationMs: number;
};
type ProblemData = {
  slug: string;
  description: string;
  starters: Record<string, string>;
};
const VERDICT_COLOR: Record<string, string> = {
  ACCEPTED:              "green",
  WRONG_ANSWER:          "red",
  TIME_LIMIT_EXCEEDED:   "orange",
  MEMORY_LIMIT_EXCEEDED: "orange",
  RUNTIME_ERROR:         "red",
  COMPILE_ERROR:         "purple",
};

export default function Page() {
  const [problems,        setProblems]        = useState<string[]>([]);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [problemData,     setProblemData]     = useState<ProblemData | null>(null);
  const [language,        setLanguage]        = useState("python");
  const [code,            setCode]            = useState("");
  const [status,          setStatus]          = useState("");
  const [result,          setResult]          = useState<SubmissionResult | null>(null);

  // Fetch problem list on mount
  useEffect(() => {
    fetch(`${API}/problems`)
      .then(r => r.json())
      .then(setProblems);
  }, []);
  // Fetch problem details when problem changes
  useEffect(() => {
    if (!selectedProblem) return;
    fetch(`${API}/problems/${selectedProblem}`)
      .then(r => r.json())
      .then((data: ProblemData) => {
        setProblemData(data);
        setCode(data.starters?.[language] ?? "");
        setResult(null);
      });
  }, [selectedProblem]);
  // Swap starter code when language changes
  useEffect(() => {
    if (!problemData) return;
    setCode(problemData.starters?.[language] ?? "");
  }, [language]);
  async function submitCode() {
    if (!selectedProblem) { alert("Select a problem first"); return; }
    if (!code.trim())     { alert("Write some code first");  return; }

    setStatus("Running...");
    setResult(null);

    const { id } = await fetch(`${API}/submissions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ language, code, problemSlug: selectedProblem }),
    }).then(r => r.json());
    // Poll every second until done
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      // Give up after 60 seconds
      if (attempts > 60) {
        clearInterval(poll);
        setStatus("Timed out — server took too long");
        return;
      }
      // Handle network errors silently — just try again next tick
      const sub = await fetch(`${API}/submissions/${id}`)
        .then(r => r.json())
        .catch(() => null);
      if (!sub) return;
      if (sub.status === "DONE") {
        clearInterval(poll);
        setStatus("");
        setResult(sub.result);
      }
    }, 1000);
  }
  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <select
          value={selectedProblem}
          onChange={e => setSelectedProblem(e.target.value)}
          style={styles.select}
        >
          <option value="">-- select a problem --</option>
          {problems.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <pre style={styles.problemContent}>
          {problemData?.description ?? ""}
        </pre>
      </div>

      {/* ── Right: editor ── */}
      <div style={styles.right}>

        {/* Controls */}
        <div style={styles.controls}>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={styles.select}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
          <button onClick={submitCode} style={styles.button}>
            Submit
          </button>
          <span style={{ color: "#666" }}>{status}</span>
        </div>
        {/* Code editor */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Write your solution here..."
          style={styles.textarea}
          spellCheck={false}
        />

        {/* Results */}
        {result && (
          <div style={styles.results}>
            <div style={{
              ...styles.verdict,
              color: VERDICT_COLOR[result.verdict] ?? "black",
            }}>
              {result.verdict}
            </div>

            <pre style={{ fontSize: 13, lineHeight: 1.8 }}>
              {result.testResults.map(t => {
                const icon = t.passed ? "✅" : "❌";
                let line = `${icon}  Test ${t.testCase}`;
                line += `   got: "${t.stdout}"`;
                line += `   expected: "${t.expected}"`;
                line += `   ${t.durationMs}ms\n`;
                if (t.stderr) line += `      ${t.stderr.slice(0, 200)}\n`;
                return line;
              }).join("")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
const styles: Record<string, React.CSSProperties> = {
  page: {
    display:    "flex",
    height:     "100vh",
    fontFamily: "monospace",
    fontSize:   14,
  },
  left: {
    width:         "40%",
    padding:       16,
    borderRight:   "1px solid #ccc",
    overflowY:     "auto",
    display:       "flex",
    flexDirection: "column",
    gap:           12,
  },
  right: {
    width:         "60%",
    padding:       16,
    display:       "flex",
    flexDirection: "column",
    gap:           10,
  },
  controls: {
    display:     "flex",
    gap:         8,
    alignItems:  "center",
  },
  select: {
    padding:    "6px 10px",
    fontFamily: "monospace",
    fontSize:   14,
    cursor:     "pointer",
  },
  button: {
    padding:    "6px 10px",
    fontFamily: "monospace",
    fontSize:   14,
    cursor:     "pointer",
  },
  textarea: {
    flex:       1,
    fontFamily: "monospace",
    fontSize:   13,
    padding:    10,
    resize:     "none",
    border:     "1px solid #ccc",
  },
  problemContent: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
  },
  results: {
    borderTop:  "1px solid #ccc",
    paddingTop: 10,
  },
  verdict: {
    fontWeight:   "bold",
    fontSize:     15,
    marginBottom: 6,
  },
};