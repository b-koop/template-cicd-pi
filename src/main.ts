import { buildAgentInvocation } from "./command.ts";
import { loadExampleWorkflowConfig } from "./workflow.ts";

type CommandExecutor = (command: string, args: string[]) => Promise<number>;

const executeCommand: CommandExecutor = async (command, args) => {
  const child = new Deno.Command(command, {
    args,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const result = await child.output();
  return result.code;
};

export async function runWorkflow(
  args: string[] = Deno.args,
  execute: CommandExecutor = executeCommand,
): Promise<number> {
  const config = await loadExampleWorkflowConfig();
  const provider = Deno.env.get("PI_PROVIDER");
  const model = Deno.env.get("PI_MODEL");
  const invocation = buildAgentInvocation(
    provider || model
      ? {
        ...config,
        ...(provider ? { provider } : {}),
        ...(model ? { model } : {}),
      }
      : config,
  );
  const [command, ...commandArgs] = invocation;

  if (args.includes("--dry-run")) {
    console.log(JSON.stringify({ command, args: commandArgs }));
    return 0;
  }

  return execute(command, commandArgs);
}

if (import.meta.main) {
  try {
    Deno.exit(await runWorkflow());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
