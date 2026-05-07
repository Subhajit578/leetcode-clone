import { readFile } from "node:fs/promises";
import { join } from "node:path";

type Field = { name: string; type: string };

type ProblemStructure = {
  functionName: string;
  inputs: Field[];
};

// Parse Structure.md into a typed object
export async function parseStructure(problemDir: string): Promise<ProblemStructure> {
  const content = await readFile(join(problemDir, "Structure.md"), "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  let functionName = "";
  const inputs: Field[] = [];
  let inInput = false;

  for (const line of lines) {
    if (line.startsWith("Function Name:")) {
        //@ts-ignore
      functionName = line.split(":")[1].trim();
    } else if (line === "Input Structure:") {
      inInput = true;
    } else if (line === "Output Structure:") {
      inInput = false;
    } else if (line.startsWith("Field:") && inInput) {
      const parts = line.replace("Field:", "").split(",");
      //@ts-ignore
      const name = parts[0].trim();
      const type = parts[1]?.replace("Type:", "").trim() ?? "string";
      inputs.push({ name, type });
    }
  }

  return { functionName, inputs };
}

// Generate the stdin/stdout wrapper that calls the user's function
export function generateWrapper(
  structure: ProblemStructure,
  language: "python" | "javascript"
): string {
  const { functionName, inputs } = structure;
  const args = inputs.map(f => f.name).join(", ");

  if (language === "python") {
    const reads = inputs
      .map((f, i) => `${f.name} = json.loads(lines[${i}])`)
      .join("\n");

    return [
      "import json, sys",
      "lines = sys.stdin.read().splitlines()",
      reads,
      `result = ${functionName}(${args})`,
      "print(json.dumps(result))",
    ].join("\n");
  }

  if (language === "javascript") {
    const reads = inputs
      .map((f, i) => `const ${f.name} = JSON.parse(lines[${i}]);`)
      .join("\n");

    return [
      `const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');`,
      reads,
      `const result = ${functionName}(${args});`,
      `console.log(JSON.stringify(result));`,
    ].join("\n");
  }

  return "";
}