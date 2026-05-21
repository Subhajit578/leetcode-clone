import { processSubmission } from "./index.js";

async function run(name: string, language: any, code: string, slug: string) {
  console.log(`\n=== ${name} ===`);
  const result = await processSubmission(language, code, slug);
  console.log(`Verdict: ${result.verdict} (${result.totalDurationMs}ms)`);
  result.testResults.forEach((t) => {
    const icon = t.passed ? "Yes" : "No";
    console.log(`  ${icon} test ${t.testCase} — got: ${t.stdout} expected: ${t.expected} (${t.durationMs}ms)`);
    if (t.stderr) console.log(`     stderr: ${t.stderr.slice(0, 100)}`);
  });
}

await run(
  "Python correct",
  "python",
  `n = int(input())
print(n * (n + 1) // 2)`,
  "sum"
);

await run(
  "Python wrong answer",
  "python",
  `n = int(input())
print(0)`,  // always prints 0
  "sum"
);

await run(
  "Python TLE",
  "python",
  `n = int(input())
while True: pass`,
  "sum"
);

await run(
  "Python runtime error",
  "python",
  `n = int(input())
print(1 / 0)`,
  "sum"
);

await run(
  "JS correct",
  "javascript",
  `const n = parseInt(require('fs').readFileSync(0, 'utf-8').trim());
console.log(n * (n + 1) / 2);`,
  "sum"
);

await run(
  "Java correct",
  "java",
  `import java.util.Scanner;
public class Solution {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    System.out.println(n * (n + 1) / 2);
  }
}`,
  "sum"
);

await run(
  "Java compile error",
  "java",
  `public class Solution {
  public static void main(String[] args) {
    this is not valid java
  }
}`,
  "sum"
);