//todos here - 
// Receive language, code, problemSlug from the API
// load paths 
//Load test cases from disk
//Read all files in inputs/ folder
//Check if language needs codegen py or js
//If yes parse Structure.md to get function name and input fields
//Generate the stdin/stdout wrapper
//user code + wrapper = fullCode
//If no (Java)  use code as-is
//Loop through each test case:
//Call runInSandbox(language, fullCode, input, limits)
//Wait for result
//Compare stdout to expected using JSON deep equal
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runInSandbox } from "@leetcode/sandbox";
import type { Language } from "@leetcode/sandbox";
import { fileURLToPath } from "node:url";
import { parseStructure, generateWrapper } from "./code-generator.js";
export type Verdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILE_ERROR";

export type TestResult = {
  testCase: number;  
  passed: boolean;
  stdout: string; 
  expected: string; 
  stderr: string;  
  durationMs: number;
};

export type SubmissionResult = {
  verdict: Verdict;
  testResults: TestResult[];
  totalDurationMs: number;
};

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROBLEMS_DIR = join(__dirname, "../../../problems");
const DEFAULT_LIMITS = {
  timeoutMs: 3000,
  memoryMb: 256,
};
async function loadTestCases(problemSlug: string) {
  const inputsDir  = join(PROBLEMS_DIR, problemSlug, "inputs");
  const outputsDir = join(PROBLEMS_DIR, problemSlug, "outputs");
  const files = (await readdir(inputsDir)).sort();
  return Promise.all(
    files.map(async (file) => ({
      input:    (await readFile(join(inputsDir,  file), "utf-8")).trim(),
      expected: (await readFile(join(outputsDir, file), "utf-8")).trim(),
    }))
  );
}
function outputMatches(actual: string, expected: string): boolean {
  try {
    const a = JSON.parse(actual.trim());
    const e = JSON.parse(expected.trim());
    return JSON.stringify(a) === JSON.stringify(e);
  } catch {
    return actual.trim() === expected.trim();
  }
}
function toVerdict(
  exitCode: number | null,
  timedOut: boolean,
  phase: "compile" | "run",
  passed: boolean
): Verdict {
  if (phase === "compile" && exitCode !== 0) return "COMPILE_ERROR";
  if (timedOut)                              return "TIME_LIMIT_EXCEEDED";
  if (exitCode === 137)                      return "MEMORY_LIMIT_EXCEEDED";
  if (exitCode !== 0)                        return "RUNTIME_ERROR";
  if (!passed)                               return "WRONG_ANSWER";
  return "ACCEPTED";
}
export async function processSubmission(
  language: Language,
  code: string,
  problemSlug: string,
  limits = DEFAULT_LIMITS
): Promise<SubmissionResult> {
  const testCases = await loadTestCases(problemSlug);
  const testResults: TestResult[] = [];
  const start = Date.now();
  let fullCode = code;
  if (language === "python" || language === "javascript") {
    const structure = await parseStructure(PROBLEMS_DIR);
    const wrapper   = generateWrapper(structure, language);
    fullCode = `${code}\n\n${wrapper}`;
  }
  for (let i = 0; i < testCases.length; i++) {
    //@ts-ignore
    const { input, expected } = testCases[i];
    const result = await runInSandbox(language, code, input + "\n", limits);
    const passed =
      result.exitCode === 0 &&
      !result.timedOut &&
      outputMatches(result.stdout, expected);
    const verdict = toVerdict(
      result.exitCode,
      result.timedOut,
      result.phase,
      passed
    );
    testResults.push({
      testCase: i + 1,
      passed,
      stdout:    result.stdout.trim(),
      expected,
      stderr:    result.stderr.trim(),
      durationMs: result.durationMs,
    });
    if (verdict !== "ACCEPTED") {
      return {
        verdict,
        testResults,
        totalDurationMs: Date.now() - start,
      };
    }
  }
  return {
    verdict: "ACCEPTED",
    testResults,
    totalDurationMs: Date.now() - start,
  };
}