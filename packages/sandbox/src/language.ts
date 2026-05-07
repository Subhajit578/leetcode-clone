export type Language = "python" | "javascript" | "java"

export type LanguageConfig = {
    image:string, 
    filename: string, 
    steps: {
        name:"compile" | "run";
        cmd: string[]
    }[];
    needsWritableMount: boolean; 
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
    python : {
        image: "leetcode-runner-python:latest",
        filename: "solution.py",
        steps: [
          { name: "run", cmd: ["python", "/sandbox/solution.py"] },
        ],
        needsWritableMount: false,      
    }, 
    javascript: {
        image: "leetcode-runner-node:latest",
        filename: "solution.js",
        steps: [
          { name: "run", cmd: ["node", "/sandbox/solution.js"] },
        ],
        needsWritableMount: false,
    },
    java: {
        image: "leetcode-runner-java:latest",
        filename: "Solution.java",
        steps: [
          { name: "compile", cmd: ["javac", "/sandbox/Solution.java"] },
          { name: "run",     cmd: ["java", "-cp", "/sandbox", "Solution"] },
        ],
        needsWritableMount: true,
    }
}