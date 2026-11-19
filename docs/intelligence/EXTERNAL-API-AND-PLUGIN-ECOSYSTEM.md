# EXTERNAL API AND PLUGIN ECOSYSTEM
## Complete Reference for Upstream Model APIs, Developer SDKs, MCP Protocols, and Third-Party Connectors

**Date:** November 19, 2026  
**Document Version:** 1.0.0  
**Scope:** Integration specification for all external AI services, protocols, and developer ecosystems.

---

## 1. Upstream AI Model APIs & Developer SDKs

| Provider | Core API Endpoint | Official SDKs | Key Features & Models | Authentication | Pricing Tiers & Quota Constraints |
|---|---|---|---|---|---|
| **Anthropic** | `https://api.anthropic.com/v1/messages` | `@anthropic-ai/sdk` (Node/TS), `anthropic` (Python) | Claude 3.7 Sonnet (Hybrid Thinking), Claude 3.5 Sonnet/Haiku, Prompt Caching, Computer Use Beta | `x-api-key: $ANTHROPIC_API_KEY` | Input: \$3.00/M, Output: \$15.00/M; Prompt Cache Read: \$0.30/M (90% savings). Rate limits scaled by organization tier. |
| **OpenAI** | `https://api.openai.com/v1/chat/completions`<br>`https://api.openai.com/v1/realtime` | `openai` (Node/Python) | GPT-4o, o1, o3-mini, Realtime WebSockets, Structured Outputs | `Authorization: Bearer $OPENAI_API_KEY` | GPT-4o: \$2.50/M in, \$10.00/M out; o3-mini: \$1.10/M in, \$4.40/M out. Realtime Audio: \$0.06/min in, \$0.24/min out. |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/`<br>`wss://generativelanguage.googleapis.com/ws/...` | `@google/genai` (Node), `google-genai` (Python) | Gemini 1.5 Pro (2M Context), Gemini 2.0 Flash (Multimodal Live API), Grounding with Search | `x-goog-api-key: $GEMINI_API_KEY` | Flash: \$0.075/M in, \$0.30/M out; Pro: \$1.25/M in, \$5.00/M out; Free tier available with rate limits. |
| **Moonshot AI (Kimi)** | `https://api.moonshot.cn/v1/chat/completions` | Compatible with OpenAI SDK (`baseURL: https://api.moonshot.cn/v1`) | Moonshot-v1-8k/32k/128k, Kimi K1.5 Long-Context Reasoning | `Authorization: Bearer $MOONSHOT_API_KEY` | Tiered pricing based on context window; competitive token rates for Chinese/English text. |
| **DeepSeek** | `https://api.deepseek.com/v1/chat/completions` | Compatible with OpenAI SDK (`baseURL: https://api.deepseek.com/v1`) | DeepSeek-V3, DeepSeek-R1 (Open Reasoning Model) | `Authorization: Bearer $DEEPSEEK_API_KEY` | R1: \$0.55/M in (cache miss), \$0.14/M in (cache hit), \$2.19/M out. |
| **Local (Ollama)** | `http://127.0.0.1:11434/api/` | `ollama` (Node/Python) | Llama 3.3, Qwen 2.5, DeepSeek-R1-Distill, Mistral | None (Localhost Loopback) | **Free & Self-Hosted**; constrained only by local GPU VRAM. |

---

## 2. Model Context Protocol (MCP) Ecosystem

The **Model Context Protocol (MCP)** is an open JSON-RPC 2.0 standard connecting AI models to local tools, data repositories, and enterprise APIs.

### 2.1 Protocol Transports
1. **`stdio` Transport**:
   - Host spawns a child process and communicates via standard input/output streams.
   - Ideal for local command-line tools, SQLite databases, git utilities, and filesystem inspectors.
2. **`sse` (Server-Sent Events) Transport**:
   - HTTP-based streaming for remote or networked MCP servers.
   - Requires token authentication and CORS header validation.

### 2.2 Standard Primitives
- **Tools**: Executable functions with JSON schema parameter validation (`tools/list`, `tools/call`).
- **Resources**: URI-addressable structured or text data (`resources/list`, `resources/read`).
- **Prompts**: Reusable prompt templates with parameter substitution (`prompts/list`, `prompts/get`).
- **Sampling**: Host-provided completion generation initiated by the server (`sampling/createMessage`).

### 2.3 Verified Essential MCP Servers
- **Filesystem**: `@modelcontextprotocol/server-filesystem` (Sandboxed directory access).
- **Git**: `@modelcontextprotocol/server-git` (Repository inspection, branch switching, diffs).
- **PostgreSQL / SQLite**: `@modelcontextprotocol/server-postgres` (Database querying and schema inspection).
- **Puppeteer / Playwright**: Real-time browser automation and page scraping.
- **Google Drive / Slack / GitHub**: Enterprise collaboration and issue tracking.

---

## 3. Extensibility & Third-Party Integration Frameworks

### 3.1 Antigravity Customization Architecture
- **Skills (`SKILL.md`)**: Self-contained operational instructions, reference guides, and helper scripts loaded on-demand based on prompt relevance.
- **Rules (`AGENTS.md`, `.agentrules`)**: Standing operational constraints enforced across all agent turns.
- **Workflows (`run_workflow`)**: Scripted multi-agent pipelines orchestrating fan-outs and barrier synchronizations.

### 3.2 Hermes 100+ Skill Catalog
- Pre-packaged skills in `harmes agent/skills`:
  - **Software Engineering**: Code refactoring, test generation, security audits, git management.
  - **DevOps**: Docker, Kubernetes, CI/CD pipeline authoring, Terraform.
  - **Research**: Academic paper extraction, multi-hop search, citation validation.
  - **Productivity**: Markdown notes, calendar scheduling, email drafting.

### 3.3 Multi-Channel Connectors (OpenClaw)
- Supported inbound/outbound messaging channels in `openclaw/src/channels`:
  - **Discord**: Discord bot gateway via WebSocket.
  - **Slack**: Bolt.js Slack app with webhook support.
  - **Telegram**: Telegram Bot API long-polling / webhooks.
  - **WhatsApp**: Baileys / WhatsApp Business API.
  - **Matrix**: Decentralized matrix-js-sdk messaging.
