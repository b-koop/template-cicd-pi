export type ThinkingLevel =
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

const thinkingLevels: ReadonlySet<string> = new Set([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

export type ExampleWorkflowConfig = {
  name: string;
  prompt: string;
  promptPath?: string;
  provider?: string;
  model?: string;
  thinking?: ThinkingLevel;
  tools?: string[];
  skill: string;
  skillPath: string;
  extension: string;
  extensionPath: string;
  connectionsPath: string;
};

const defaultConfigUrl = new URL("../examples/workflow.json", import.meta.url);

export async function loadExampleWorkflowConfig(
  configUrl: URL = defaultConfigUrl,
): Promise<ExampleWorkflowConfig> {
  const raw = await Deno.readTextFile(configUrl);
  const config = JSON.parse(raw) as Partial<ExampleWorkflowConfig>;

  if (
    typeof config.name !== "string" ||
    (config.prompt !== undefined && typeof config.prompt !== "string") ||
    (config.promptPath !== undefined &&
      (typeof config.promptPath !== "string" ||
        config.promptPath.trim() === "")) ||
    (typeof config.prompt !== "string" &&
      typeof config.promptPath !== "string") ||
    (config.provider !== undefined &&
      (typeof config.provider !== "string" || config.provider.trim() === "")) ||
    typeof config.skill !== "string" ||
    typeof config.skillPath !== "string" ||
    typeof config.extension !== "string" ||
    typeof config.extensionPath !== "string" ||
    typeof config.connectionsPath !== "string"
  ) {
    throw new Error("Workflow config is missing a required string field");
  }

  if (
    config.thinking !== undefined &&
    (typeof config.thinking !== "string" ||
      !thinkingLevels.has(config.thinking))
  ) {
    throw new Error(`Unsupported thinking level: ${String(config.thinking)}`);
  }

  const prompt = typeof config.prompt === "string"
    ? config.prompt
    : await Deno.readTextFile(new URL(config.promptPath!, configUrl));

  return { ...config, prompt } as ExampleWorkflowConfig;
}
