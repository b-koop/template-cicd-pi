import { loadExampleWorkflowConfig } from "../src/workflow.ts";
import { buildAgentInvocation } from "../src/command.ts";

const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) throw new Error(message);
};

Deno.test("the example workflow loads its hello-world prompt, skill, and extension", async () => {
  const config = await loadExampleWorkflowConfig();

  assert(
    typeof config.prompt === "string" && config.prompt.includes("hello-world"),
    "the example workflow should contain a hello-world prompt",
  );
  assert(config.skill === "example-skill", "the example workflow should reference the example skill");
  assert(
    config.extension === "example-extension",
    "the example workflow should reference the example extension",
  );
});

Deno.test("the workflow launches pi without placing API-key values in its command", () => {
  const apiKey = "test-api-key-value";
  const invocation: string[] = buildAgentInvocation(
    {
      prompt: "hello-world",
      skill: "example-skill",
      extension: "example-extension",
    },
    { apiKey },
  );

  assert(invocation[0] === "pi", "the invocation should launch pi");
  assert(invocation.includes("hello-world"), "the invocation should carry the prompt");
  assert(invocation.includes("example-skill"), "the invocation should carry the skill");
  assert(invocation.includes("example-extension"), "the invocation should carry the extension");
  assert(
    invocation.every((argument) => !argument.includes(apiKey)),
    "the invocation should not contain API-key values",
  );
});
