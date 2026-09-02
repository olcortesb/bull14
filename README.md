# bull14

AI models, pricing, tools and GPU tracker — updated daily.

Live at [bull14.olcortesb.com](https://bull14.olcortesb.com)

## What is this?

A tracker for the AI ecosystem: models, APIs, frameworks and GPU cloud pricing.
Built for personal use first — to decide what model/API to use, how much it costs, what's new.

> "Not everything that shines is intelligence."

## Tech Stack

- Vue 3 + Vite
- Tailwind CSS
- Vue Router
- AWS Amplify (hosting)

## Views

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/models` | 10 curated AI models with metadata and live HF stats |

## Data

JSON files served from CloudFront, generated daily by [bull14-backend](https://github.com/olcortesb/bull14-backend):

| File | Content |
|------|---------|
| `data/models.json` | Models metadata, HF downloads/likes, access type |
| `data/pricing.json` | Pricing per token by provider *(coming soon)* |
| `data/tools.json` | Framework versions *(coming soon)* |
| `data/hardware.json` | GPU cloud pricing *(coming soon)* |
| `data/changelog.json` | Detected changes *(coming soon)* |

## Models (v1)

10 curated models covering the main use cases:

- **API-only**: GPT-4o, Claude Sonnet 4, Gemini 2.0 Flash
- **Open-weight large**: Llama 3.1 70B, DeepSeek R1, Qwen 2.5 72B
- **Open-weight local**: Llama 3.1 8B, Mistral 7B, Phi-4, Gemma 3 27B

## Development

```bash
npm install
npm run dev   # http://localhost:5173
```

## Deploy

Connected to AWS Amplify — auto-deploys on push to `main`.

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## License

MIT
