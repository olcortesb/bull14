# bull14

AI models, pricing, tools and GPU cloud tracker — updated daily.

Live at [bull14.olcortesb.com](https://bull14.olcortesb.com)

## Name

From **bulbullia** (Latin) — bubble. A reminder that not all that inflates has substance.

## What is this?

A tracker for the AI ecosystem: models, APIs, frameworks and GPU cloud pricing.
Built for personal use first — to decide what model/API to use, how much it costs, what's new.

## Views

| Route | Description |
|-------|-------------|
| `/` | Home — live stats, nav, sources and how to contribute |
| `/models` | Curated models with metadata, access type, modalities and HF stats. Filters by provider, access and modality |
| `/pricing` | Cost per token across 60+ providers. Input, output, cached and batch pricing |
| `/tools` | 26 frameworks — versions, activity badge, capability breakdown |
| `/hardware` | GPU cloud pricing across 6 providers — live where APIs are available |
| `/changelog` | Daily feed of detected changes: price drops, new models, new versions |
| `/analytics` | Hype index, price trends and API vs self-host breakeven |
| `/metrics` | Pipeline health — Lambda invocations, errors, S3 file status |

## Data

JSON files served from CloudFront, generated daily by [bull14-backend](https://github.com/olcortesb/bull14-backend):

| File | Content |
|------|---------|
| `data/models.json` | Models metadata, HF downloads/likes, access type |
| `data/pricing.json` | Pricing per token — 378 models, 61 providers |
| `data/tools.json` | Framework versions, stars, activity, capabilities |
| `data/hardware.json` | GPU cloud pricing — RunPod/Vast.ai live, rest static |
| `data/changelog.json` | Detected changes (90-day window) |
| `data/analytics.json` | Hype index, price trends, breakeven |
| `data/metrics.json` | Pipeline health metrics |

## Tech Stack

- Vue 3 + Vite
- Tailwind CSS
- Vue Router
- AWS Amplify (hosting)

## Development

```bash
npm install
npm run dev   # http://localhost:5173
```

## Contribute

- **Add a model** → edit `src/models-collector/handler.py` in the backend repo
- **Add a tool** → edit `src/tools-collector/tools_base.yaml`
- **Add a GPU provider** → edit `src/hardware-collector/hardware_base.yaml`
- **Report an issue** → open an issue on GitHub

## License

MIT
