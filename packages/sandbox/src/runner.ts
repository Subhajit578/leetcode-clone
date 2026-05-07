//runStep = take cmd, image, tmpDir, limits and some other imp ones 



import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SandboxLimits, SandboxResult, Language } from "./types.js";
import { LANGUAGES } from "./language.js";

const MAX_OUTPUT_BYTES = 1024 * 1024;

type StepResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
};

async function runStep(
  cmd: string[],
  image: string,
  tmpDir: string,
  mountReadOnly: boolean,
  stdin: string,
  limits: SandboxLimits
): Promise<StepResult> {
    //mount
  const mountSpec = mountReadOnly
    ? `${tmpDir}:/sandbox:ro`
    : `${tmpDir}:/sandbox`;
// read docks to figure args 
  const args = [
    "run", "--rm", "-i",
    "-v", mountSpec,
    "--network", "none",
    "--memory", `${limits.memoryMb}m`,
    "--cpus", "0.5",
    "--pids-limit", "64",
    "--read-only",
    "--tmpfs", "/tmp",
    image,
    ...cmd,
  ];
// start process

  const start = Date.now();
  const child = spawn("docker", args);

  let stdout = "";
  let stderr = "";
  let truncated = false;
  // everytime i AM WRITING OUT DATA MONITOR 
// monitor the size 
  child.stdout.on("data", (chunk: Buffer) => {
    if (stdout.length < MAX_OUTPUT_BYTES) {
      stdout += chunk.toString();
      if (stdout.length >= MAX_OUTPUT_BYTES) {
        stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
        truncated = true;
        child.kill("SIGKILL");
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    if (stderr.length < MAX_OUTPUT_BYTES) {
      stderr += chunk.toString();
    }
  });

  child.stdin.write(stdin);
  child.stdin.end();
  // timeout logic 
  //if the limits passes without the container getting killed kill the process immed
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, limits.timeoutMs);

  const exitCode = await new Promise<number | null>((resolve) => {
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });

  if (truncated) stderr += "\n[output truncated: exceeded 1MB]";

  return { stdout, stderr, exitCode, durationMs: Date.now() - start, timedOut };
}

export async function runInSandbox(
  language: Language,
  code: string,
  stdin: string,
  limits: SandboxLimits
): Promise<SandboxResult> {
  const config = LANGUAGES[language];
  const tmpDir = await mkdtemp(join(tmpdir(), "sandbox-"));
  const codePath = join(tmpDir, config.filename);
  await writeFile(codePath, code);
  try {
    let lastResult: StepResult | null = null;
    for (const step of config.steps) {
      const stepLimits: SandboxLimits =
        step.name === "compile"
          ? { timeoutMs: 10_000, memoryMb: 512 }
          : limits;
      const stepStdin = step.name === "run" ? stdin : "";
      lastResult = await runStep(
        step.cmd,
        config.image,
        tmpDir,
        !config.needsWritableMount,
        stepStdin,
        stepLimits
      );
      if (lastResult.exitCode !== 0 || lastResult.timedOut) {
        return { ...lastResult, phase: step.name };
      }
    }

    return { ...lastResult!, phase: "run" };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}