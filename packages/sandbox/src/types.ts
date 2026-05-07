import type { Language } from "./language.ts";
export type SandboxLimits = {
    timeoutMs: number;
    memoryMb: number; 
}; 
export type SandboxResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    timedOut: boolean; 
    phase: "compile" | "run";
};
export type {Language}