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
    typeof config.prompt !== "string" ||
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
    (typeof config.thinking !== "string" || !thinkingLevels.has(config.thinking))
  ) {
    throw new Error(`Unsupported thinking level: ${String(config.thinking)}`);
  }

  return config as ExampleWorkflowConfig;
}
