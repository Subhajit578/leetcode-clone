import express from "express";
import cors from 'cors';
import { fileURLToPath } from "node:url";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { processSubmission } from "@leetcode/worker";
import type { SubmissionResult } from "@leetcode/worker";
const app = express()
app.use(cors())
app.use(express.json())
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROBLEMS_DIR = join(__dirname, "../../../problems");
app.use(express.static(join(__dirname, "../static")));
type Submission = {
    id: string;
    status: "QUEUED" | "RUNNING" | "DONE";
    language: string;
    problemSlug: string;
    result?: SubmissionResult;
  };
  
  const submissions = new Map<string, Submission>();
app.get("/problems" , async (req, res) => {
    // get all the problems
    const slugs = await readdir(PROBLEMS_DIR);
    res.json(slugs);
})
app.get("/problems/:slug", async (req, res) => {
    // get specific problem details 
    const { slug } = req.params;
    const problemDir = join(PROBLEMS_DIR, slug);
  
    const description = await readFile(join(problemDir, "Problem.md"), "utf-8");

    const starters: Record<string, string> = {};
    for (const [lang, file] of [["python", "solution.py"], ["javascript", "solution.js"], ["java", "Solution.java"]]) {
      try {
        starters[lang] = await readFile(join(problemDir, "starters", file), "utf-8");
      } catch {
        starters[lang] = "";
      }
    }
  
    res.json({ slug, description, starters });
  });
app.post("/submissions" , (req, res) => {
    // get the submitted code, language, problem code\
    //return a submission id which will be used to get the status 
    const { language, code, problemSlug } = req.body;

  if (!language || !code || !problemSlug) {
    res.status(400).json({ error: "language, code and problemSlug are required" });
    return;
  }

  const id = randomUUID();

  submissions.set(id, {
    id,
    status: "QUEUED",
    language,
    problemSlug,
  });

res.json({ id, status: "QUEUED" });
submissions.get(id)!.status = "RUNNING";
  processSubmission(language, code, problemSlug)
    .then((result) => {
      const sub = submissions.get(id)!;
      sub.status = "DONE";
      sub.result = result;
    })
    .catch((err) => {
      const sub = submissions.get(id)!;
      sub.status = "DONE";
      sub.result = {
        verdict: "RUNTIME_ERROR",
        testResults: [],
        totalDurationMs: 0,
      };
      console.error("Worker error:", err);
    });
})

app.get("/submissions/:id", (req,res)=> {
    // get the status of the submission
    //use polling WS generally for 100ms latency but here we are talking around 2s in best case 
    const submission = submissions.get(req.params.id);
    if (!submission) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
  
    res.json(submission);
})

app.listen(3001)