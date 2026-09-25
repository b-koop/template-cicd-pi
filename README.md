# template-cicd-pi

A small public template for setting up reusable AI workflows with Pi. It keeps
workflow configuration, prompts, skills, extensions, and external connections in
one project so a new workflow can start from a working hello-world example.

This repository does not contain API keys, provider-specific business logic, or
an automated code-review product. Replace the examples with the workflow your
team needs.

## Use this repository as a template

On GitHub, select **Use this template → Create a new repository**. Then clone
your new repository and follow [Quick start](#quick-start). The generated
repository includes the Deno entry point, example prompt, workflow config,
skill, extension, connection placeholder, and GitHub Actions workflow.

## Quick start

### 1. Install prerequisites

- [Deno](https://deno.com/) 2.x
- Node.js 22+ and npm
- Pi, installed and available as the `pi` command
- An API key or OAuth credential for the provider and model you choose

Install Pi with the same command used by CI:

```sh
npm install --global --ignore-scripts @earendil-works/pi-coding-agent
pi --version
```

### 2. Configure credentials

Copy the example for local reference:

```sh
cp .env.example .env
```

Deno does not load `.env` automatically. Export the values in your shell, or
load the local file before running the task:

```sh
set -a
. ./.env
set +a
```

You can also use Pi's `/login` credential flow. The template never reads or
passes an API key as a command-line argument.

For a provider API key, export the provider's documented variable, for example:

```sh
export ANTHROPIC_API_KEY="..."
export PI_MODEL="anthropic/claude-sonnet-4-5"
```

Do not commit `.env`, credential files, or real secret values.

### Common provider setups

The workflow supports separate `provider` and `model` values. Set them in
`examples/workflow.json`, or override them locally with `PI_PROVIDER` and
`PI_MODEL`:

#### Direct provider API

```sh
export PI_PROVIDER="anthropic"
export PI_MODEL="anthropic/claude-sonnet-4-5"
export ANTHROPIC_API_KEY="..."
```

#### OpenAI

```sh
export PI_PROVIDER="openai"
export PI_MODEL="openai/gpt-4.1-mini"
export OPENAI_API_KEY="..."
```

#### OpenRouter

OpenRouter uses its own provider key and usually a bare routed model ID:

```sh
export PI_PROVIDER="openrouter"
export PI_MODEL="z-ai/glm-latest"
export OPENROUTER_API_KEY="..."
```

#### Google Gemini

```sh
export PI_PROVIDER="google"
export PI_MODEL="google/gemini-2.5-flash"
export GEMINI_API_KEY="..."
```

#### Local or custom OpenAI-compatible endpoints

Configure the custom provider and base URL in Pi's user-level model settings,
then set `PI_PROVIDER`, `PI_MODEL`, and the provider's documented credential
variable. Keep that user-level configuration outside this repository when it
contains machine-specific URLs or credentials.

The provider-specific environment variable is inherited by the child process.
The Deno entry point does not convert credentials into `--api-key` arguments. If
a provider's model catalog or credential variable differs, use that provider's
Pi documentation as the source of truth.

### 3. Validate the example workflow

```sh
deno task hello:dry-run
```

This prints the exact command shape without contacting a model. It should show a
`pi --print` invocation with the example skill and extension.

### 4. Run the hello-world workflow

```sh
deno task hello
```

The entry point loads `examples/workflow.json`, adds the configured resources,
and starts Pi. The example prompt asks the model to respond with:

```text
Hello, world!
```

## Workflow setup

The example has one workflow entry point and one declarative workflow file:

| Purpose               | File                                       | What it does                                                                               |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Entry point           | `src/main.ts`                              | Loads the workflow, applies `PI_PROVIDER`/`PI_MODEL`, builds the command, and starts `pi`. |
| Config and validation | `src/workflow.ts`                          | Validates `examples/workflow.json` and loads its prompt file.                              |
| Command construction  | `src/command.ts`                           | Converts config into the safe `pi` argument list.                                          |
| Workflow config       | `examples/workflow.json`                   | Selects the model, thinking level, skill, extension, tools, and prompt file.               |
| Prompt file           | `examples/prompts/hello-world.md`          | Contains the user prompt passed to `pi`.                                                   |
| Skill instructions    | `examples/skills/example-skill/SKILL.md`   | Provides reusable instructions loaded with `--skill`.                                      |
| Extension code        | `examples/extensions/example-extension.ts` | Provides optional runtime hooks loaded with `--extension`.                                 |

### Configure the example workflow

1. Install Deno, Node.js, and Pi as shown in [Quick start](#quick-start).
2. Copy `.env.example` to `.env` and export the values, or use Pi's `/login`
   flow.
3. Edit `examples/workflow.json` to choose the provider, model, thinking level,
   tools, skill, extension, and prompt file.
4. Edit `examples/prompts/hello-world.md` when you want to change the user
   prompt. The `promptPath` is relative to `examples/workflow.json`.
5. Run `deno task hello:dry-run` and inspect the JSON command before enabling
   model access.
6. Run `deno task hello` only after a provider credential is configured.

The current entry point loads `examples/workflow.json` by design. To add a
second workflow, copy that config and prompt file, then add a small entry point
that calls
`loadExampleWorkflowConfig(new URL("../examples/my-workflow.json",
import.meta.url))`
and passes the result to `buildAgentInvocation`. Add a Deno task for that entry
point. This keeps each workflow explicit instead of making an uncontrolled
config path part of the CI interface.

### Prompt source and precedence

The example prompt is `examples/prompts/hello-world.md`. It is referenced by
`promptPath` in `examples/workflow.json`; `src/workflow.ts` reads that file and
passes the resulting text as the final prompt argument to `pi`.

For a small workflow, you may use an inline `prompt` string in
`examples/workflow.json` instead. Use either `promptPath` or `prompt` for a
workflow. The workflow prompt is separate from the optional system prompt and
reusable prompt templates supported by Pi. This template does not silently merge
those layers.

## Entry point and commands

The normal entry point is `src/main.ts`. These Deno tasks call it:

```sh
deno task hello:dry-run  # build and print the command; no model call
deno task hello           # execute pi with the configured prompt
```

The direct equivalents are:

```sh
deno run --allow-read --allow-env=PI_PROVIDER,PI_MODEL src/main.ts --dry-run
deno run --allow-read --allow-env=PI_PROVIDER,PI_MODEL --allow-run=pi src/main.ts
```

`--dry-run` prints the command as JSON and exits successfully without starting
Pi. A live run returns Pi's exit code. Missing credentials or provider setup
therefore fail the live task; that is expected until authentication is
configured.

## How startup works

`deno task hello` runs `src/main.ts` with the minimum permissions needed by the
example:

1. Deno reads `examples/workflow.json`.
2. `PI_PROVIDER` and `PI_MODEL` override the provider and model in that file
   when they are set.
3. `src/command.ts` builds a safe argument list.
4. The entry point starts `pi` with `Deno.Command`.
5. Pi loads the selected skill and extension.
6. Pi resolves any configured connections from its settings and the provider
   credential from its normal credential flow or environment variable.
7. Pi runs the prompt in print mode and forwards its output.

The generated command includes `--no-session`, `--approve`, the configured
thinking level, and the configured tool policy. Thinking level is optional and
accepts `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. If it is
unset, the CLI keeps its own default. The example uses `--no-tools` because
hello-world does not need file or shell access. Change the `tools` list in the
workflow config when a workflow genuinely needs tools.

Use `--dry-run` whenever you want to inspect the invocation without starting Pi:

```sh
deno run --allow-read --allow-env=PI_PROVIDER,PI_MODEL src/main.ts --dry-run
```

## Workflow configuration

The example configuration is deliberately declarative:

```json
{
  "name": "hello-world",
  "promptPath": "prompts/hello-world.md",
  "model": "anthropic/claude-sonnet-4-5",
  "thinking": "medium",
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
3. Choose a thinking level only when the workflow needs to override the CLI
   default.
4. Add or remove skills, extensions, tools, and connections.
5. Add a Deno task or entry point that loads the new config.
6. Run the dry-run command before enabling model access.

## Customizing prompts

There are three useful prompt layers:

- **Workflow prompt:** edit `examples/prompts/hello-world.md`, or use an inline
  `prompt` field in the workflow config.
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

`examples/connections.example.json` shows a generic external connection. It uses
an environment-variable reference rather than a literal token:

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
referenced variable before starting a workflow. `connectionsPath` is validated
as part of the workflow config, but the Deno entry point does not copy settings,
modify user settings, or start connections itself. The repository's
`.prime/agent/settings.example.json` is documentation only; it is not a place to
store credentials.

Connection setup should follow this rule:

- URLs and non-secret settings may be committed.
- Tokens must be environment-variable references or a supported credential store
  entry.
- Literal secrets must never appear in JSON, TypeScript, shell commands, logs,
  workflow arguments, or pull requests.

## GitHub Actions setup

The workflow file is `.github/workflows/hello-world.yml`, and its display name
is **Hello world template check**. It has two trigger paths:

| Trigger                                        | Jobs                                       | Credentials                | Purpose                                                                |
| ---------------------------------------------- | ------------------------------------------ | -------------------------- | ---------------------------------------------------------------------- |
| Pull request opened, synchronized, or reopened | `validate-workflow`                        | None                       | Install Deno, Node.js, and Pi; verify `pi --version`; run the dry-run. |
| Manual `workflow_dispatch`                     | `validate-workflow` and `live-hello-world` | `ANTHROPIC_API_KEY` secret | Run the live hello-world workflow.                                     |

### Configure the manual live job

The checked-in live job is intentionally configured for the direct Anthropic
provider. Add the repository secret before dispatching it:

1. Open **Settings → Secrets and variables → Actions**.
2. Create a repository secret named `ANTHROPIC_API_KEY`.
3. Optionally create a repository variable named `PI_MODEL` to override the
   default `anthropic/claude-sonnet-4-5` model.
4. Open **Actions → Hello world template check**.
5. Select **Run workflow**, choose the branch, and confirm **Run workflow**.

The live job does not run on pull requests. This prevents untrusted pull request
code from receiving provider credentials. A missing API key makes the manual
live step fail with a provider-authentication error; setup and dry-run steps can
still pass.

To use another provider in CI, edit the `live-hello-world` job in
`.github/workflows/hello-world.yml`: map that provider's secret under `env`, set
`PI_PROVIDER` when the provider must be passed separately, and set a compatible
`PI_MODEL` default. Keep provider secrets in GitHub Actions secrets, never in
workflow arguments or committed files.

## Pull-request workflow

`.github/workflows/hello-world.yml` keeps pull requests safe by installing the
CLI without credentials, verifying the installation, and running
`deno task hello:dry-run`. The separate live job is available only through
manual `workflow_dispatch`.

## Project layout

```text
src/main.ts                              # Deno entry point
src/workflow.ts                          # Config loading and validation
src/command.ts                           # Safe Pi command construction
examples/workflow.json                   # Hello-world workflow config
examples/prompts/hello-world.md          # Prompt passed to pi
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

The Deno entry point requires only read access, the optional `PI_PROVIDER` and
`PI_MODEL` environment variables, and permission to execute `pi` when running
the live workflow.
