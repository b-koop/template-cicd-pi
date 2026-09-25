import type { ExampleWorkflowConfig } from "./workflow.ts";

export type Credentials = {
  apiKey?: string;
};

export function buildAgentInvocation(
  config:
    | ExampleWorkflowConfig
    | Pick<ExampleWorkflowConfig, "prompt" | "skill" | "extension">,
  _credentials: Credentials = {},
): string[] {
  const workflow = config as Partial<ExampleWorkflowConfig>;
  const invocation = ["pi", "--print", "--no-session", "--approve"];

  if (workflow.provider) invocation.push("--provider", workflow.provider);
  if (workflow.model) invocation.push("--model", workflow.model);
  if (workflow.thinking) invocation.push("--thinking", workflow.thinking);
  if (workflow.tools) {
    if (workflow.tools.length === 0) invocation.push("--no-tools");
    else invocation.push("--tools", workflow.tools.join(","));
  }
  invocation.push("--skill", workflow.skillPath ?? workflow.skill ?? "");
  invocation.push(
    "--extension",
    workflow.extensionPath ?? workflow.extension ?? "",
  );
  invocation.push("--", workflow.prompt ?? "");

  return invocation;
}
