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
    config.promptPath === "prompts/hello-world.md",
    "the example workflow should reference the prompt file",
  );
  assert(
    typeof config.prompt === "string" &&
      config.prompt.includes("Hello, world!"),
    "the loader should read the hello-world prompt file",
  );
  assert(
    config.skill === "example-skill",
    "the example workflow should reference the example skill",
  );
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
  assert(
    invocation.includes("hello-world"),
    "the invocation should carry the prompt",
  );
  assert(
    invocation.includes("example-skill"),
    "the invocation should carry the skill",
  );
  assert(
    invocation.includes("example-extension"),
    "the invocation should carry the extension",
  );
  assert(
    invocation.every((argument) => !argument.includes(apiKey)),
    "the invocation should not contain API-key values",
  );
});

Deno.test("the invocation forwards an optional provider separately from its model", async () => {
  const config = await loadExampleWorkflowConfig();
  const invocation = buildAgentInvocation({
    ...config,
    provider: "openrouter",
    model: "z-ai/glm-latest",
  });
  const providerFlag = invocation.indexOf("--provider");

  assert(providerFlag >= 0, "the invocation should include the provider flag");
  assert(
    invocation[providerFlag + 1] === "openrouter",
    "the invocation should pass the provider",
  );
  assert(
    invocation.includes("z-ai/glm-latest"),
    "the invocation should pass the provider model",
  );
});

type ThinkingWorkflow =
  & Awaited<ReturnType<typeof loadExampleWorkflowConfig>>
  & {
    thinking?: string;
  };

const supportedThinkingLevels = new Set([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

Deno.test("the example workflow declares a supported thinking level", async () => {
  const config = await loadExampleWorkflowConfig() as ThinkingWorkflow;

  assert(
    typeof config.thinking === "string" &&
      supportedThinkingLevels.has(config.thinking),
    "the example workflow should declare a supported thinking level",
  );
});

Deno.test("the invocation passes a configured thinking level and omits it when unset", async () => {
  const config = await loadExampleWorkflowConfig();
  const configured = { ...config, thinking: "high" } as ThinkingWorkflow;
  const configuredInvocation = buildAgentInvocation(configured);
  const thinkingFlag = configuredInvocation.indexOf("--thinking");

  assert(
    thinkingFlag >= 0,
    "the invocation should include the thinking flag when configured",
  );
  assert(
    configuredInvocation[thinkingFlag + 1] === "high",
    "the invocation should pass the configured thinking level",
  );

  const unset = { ...config } as ThinkingWorkflow;
  delete unset.thinking;
  const unsetInvocation = buildAgentInvocation(unset);
  assert(
    !unsetInvocation.includes("--thinking"),
    "the invocation should omit the thinking flag when it is unset",
  );
});

Deno.test("the workflow loader rejects an unsupported thinking level", async () => {
  const config = await loadExampleWorkflowConfig();
  const invalidConfigUrl = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(
      invalidConfigUrl,
      JSON.stringify({ ...config, thinking: "unsupported" }),
    );

    let rejected = false;
    try {
      await loadExampleWorkflowConfig(new URL(`file://${invalidConfigUrl}`));
    } catch {
      rejected = true;
    }

    assert(
      rejected,
      "the workflow loader should reject unsupported thinking levels",
    );
  } finally {
    await Deno.remove(invalidConfigUrl);
  }
});
