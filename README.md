# template-cicd-pi

A small public template for setting up reusable AI workflows with Pi. It keeps
workflow configuration, prompts, skills, extensions, and external connections
in one project so a new workflow can start from a working hello-world example.

This repository does not contain API keys, provider-specific business logic, or
an automated code-review product. Replace the examples with the workflow your
team needs.

## Quick start

### 1. Install prerequisites

- [Deno](https://deno.com/) 2.x
- Pi, installed and available as the `pi` command
- An API key or OAuth credential for the provider and model you choose

### 2. Configure credentials

Copy the example for local reference:

```sh
cp .env.example .env
```

Deno does not load `.env` automatically. Export the values in your shell or use
Pi's credential flow. The template never reads or passes an API key as a
command-line argument.

For a provider API key, export the provider's documented variable, for example:

```sh
export ANTHROPIC_API_KEY="..."
export PI_MODEL="anthropic/claude-sonnet-4-5"
```

Do not commit `.env`, credential files, or real secret values.

### 3. Validate the example workflow

```sh
deno task hello:dry-run
```

This prints the exact command shape without contacting a model. It should show
a `pi --print` invocation with the example skill and extension.

### 4. Run the hello-world workflow

```sh
deno task hello
```

The entry point loads `examples/workflow.json`, adds the configured resources,
and starts Pi. The example prompt asks the model to respond with:

```text
Hello, world!
```

## How startup works

`deno task hello` runs `src/main.ts` with the minimum permissions needed by the
example:

1. Deno reads `examples/workflow.json`.
2. `PI_MODEL` overrides the model in that file when it is set.
3. `src/command.ts` builds a safe argument list.
4. The entry point starts `pi` with `Deno.Command`.
5. Pi loads the selected skill and extension.
6. Pi resolves any configured connections from its settings and the provider
   credential from its normal credential flow or environment variable.
7. Pi runs the prompt in print mode and forwards its output.

The generated command includes `--no-session`, `--approve`, and the configured
tool policy. The example uses `--no-tools` because hello-world does not need
file or shell access. Change the `tools` list in the workflow config when a
workflow genuinely needs tools.

Use `--dry-run` whenever you want to inspect the invocation without starting
Pi:

```sh
deno run --allow-read --allow-env=PI_MODEL src/main.ts --dry-run
```

## Workflow configuration

The example configuration is deliberately declarative:

```json
{
  "name": "hello-world",
  "prompt": "hello-world: use the example-skill and respond with exactly: Hello, world!",
  "model": "anthropic/claude-sonnet-4-5",
  "tools": [],
  "skill": "example-skill",
  "skillPath": "examples/skills/example-skill/SKILL.md",
  "extension": "example-extension",
  "extensionPath": "examples/extensions/example-extension.ts",
  "connectionsPath": "examples/connections.example.json"
}
```

To create another workflow:

1. Copy `examples/workflow.json`.
2. Give it a new name and prompt.
3. Add or remove skills, extensions, tools, and connections.
4. Add a Deno task or entry point that loads the new config.
5. Run the dry-run command before enabling model access.

## Customizing prompts

There are three useful prompt layers:

- **Workflow prompt:** edit the `prompt` field in the workflow config.
- **System prompt:** pass `--system-prompt` or `--append-system-prompt` when a
  workflow needs stable behavior across runs.
- **Reusable prompt template:** put Markdown templates in the Pi prompt
  directory and invoke them by name in the interactive interface.

Keep user input and external service output separate from trusted instructions.
Treat both as untrusted data.

## Customizing skills

A skill is a directory containing `SKILL.md` with frontmatter:

```text
examples/skills/example-skill/SKILL.md
```

The required fields are `name` and `description`. The description tells Pi when
the skill is relevant; the body contains the detailed workflow.

To add a skill:

1. Copy `examples/skills/example-skill` to a new directory.
2. Change the `name`, `description`, and instructions.
3. Reference its `SKILL.md` in the workflow config.
4. Test it with `deno task hello:dry-run`, then run the workflow.

Skills are instructions and may include executable helpers. Review them before
loading them into a workflow.

## Customizing extensions

An extension is a TypeScript module with a default export. It can register
commands, tools, lifecycle hooks, or UI behavior:

```ts
export default function registerExtension(pi: any): void {
  pi.on?.("session_start", async (_event: unknown, context: any) => {
    if (context?.hasUI && context.ui?.notify) {
      context.ui.notify("Extension loaded", "info");
    }
  });
}
```

To add an extension:

1. Copy `examples/extensions/example-extension.ts`.
2. Implement the command, tool, or lifecycle hook.
3. Reference the file with `extensionPath`.
4. Review its permissions and test it in a local session.

Extensions run inside the Pi process and can execute arbitrary code. Never load
an unreviewed extension alongside production credentials.

## Connections and API keys

`examples/connections.example.json` shows a generic external connection. It
uses an environment-variable reference rather than a literal token:

```json
{
  "mcpServers": {
    "example-service": {
      "type": "http",
      "url": "https://mcp.example.invalid/mcp",
      "bearerTokenEnvVar": "EXAMPLE_SERVICE_TOKEN",
      "enabled": false
    }
  }
}
```

Copy the connection definition into your local Pi settings and export the
referenced variable before starting a workflow. The Deno entry point does not
modify user settings or start connections itself. The repository's
`.prime/agent/settings.example.json` is documentation only; it is not a place
to store credentials.

Connection setup should follow this rule:

- URLs and non-secret settings may be committed.
- Tokens must be environment-variable references or a supported credential
  store entry.
- Literal secrets must never appear in JSON, TypeScript, shell commands, logs,
  workflow arguments, or pull requests.

## Pull-request workflow

`.github/workflows/hello-world.yml` has two intentionally different paths:

- Every pull request runs `deno task hello:dry-run`. This validates the config
  without sending credentials to code from a pull request.
- A manual workflow run installs Pi and executes the live hello-world workflow
  using the configured repository secret.

This split gives the repository a safe pull-request check while keeping the
model-backed example available when explicitly requested. If you change the
live job for automatic pull-request execution, review the trust boundary first.

## Project layout

```text
src/main.ts                              # Deno entry point
src/workflow.ts                          # Config loading and validation
src/command.ts                           # Safe Pi command construction
examples/workflow.json                   # Hello-world workflow config
examples/skills/example-skill/SKILL.md   # Example skill
examples/extensions/example-extension.ts # Example extension
examples/connections.example.json        # Connection placeholder
.prime/agent/settings.example.json       # Settings placeholder
.env.example                             # Credential variable names
.github/workflows/hello-world.yml        # PR validation and manual live run
tests/first_slice_test.ts                # Behavior tests
```

## Development

```sh
deno task check
deno task test
deno task hello:dry-run
```

The Deno entry point requires only read access, the `PI_MODEL` environment
variable, and permission to execute `pi` when running the live workflow.
