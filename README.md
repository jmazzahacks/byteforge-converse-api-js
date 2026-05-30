# @jmazzahacks/byteforge-converse-api-js

TypeScript client for the ByteforgeConverse backend API. Designed to be consumed by Next.js apps that want to embed a conversation UI.

The TS types in `src/types.ts` mirror the Python models in [`byteforge-converse-models`](https://github.com/jmazzahacks/byteforge-converse-models) — keep them in sync.

## Installation

Per the workspace convention (no local `file:` references), consumers depend on this package directly from GitHub:

```json
{
  "dependencies": {
    "@jmazzahacks/byteforge-converse-api-js": "github:jmazzahacks/byteforge-converse-api-js"
  }
}
```

For private repos, install via SSH or with a `https://${GH_TOKEN}@github.com/...` URL.

## Usage

```ts
import { ConverseClient } from "@jmazzahacks/byteforge-converse-api-js";

const client = new ConverseClient({
  baseUrl: "https://converse.example.com",
  extraHeaders: { Authorization: `Bearer ${userToken}` },
});

const { data: conversations } = await client.listConversations();
const turn = await client.chat(conversations[0].id, "Hello!");

// `turn.message` is always set; `turn.tool_calls` is populated when the
// model asked the caller to invoke one or more tools. Execute them and
// post each result back as a `tool`-role message with matching
// `tool_call_id` before the next chat() call.
console.log(turn.message.content);
if (turn.tool_calls) {
  for (const call of turn.tool_calls) {
    const result = await runTool(call.name, JSON.parse(call.arguments));
    await client.postMessage(conversations[0].id, {
      role: "tool",
      content: JSON.stringify(result),
      tool_call_id: call.id,
    });
  }
}
```

Auth is delegated to the consuming app — pass auth headers via `extraHeaders` or wrap the client.

## Development

```bash
npm install
npm run build   # tsc → dist/
npm run lint    # tsc --noEmit
```

## License

O'Saasy License — see [LICENSE](LICENSE). See https://osaasy.dev/ for details.

## Author

Jason Byteforge ([@jmazzahacks](https://github.com/jmazzahacks)) — jason@reallybadapps.com
