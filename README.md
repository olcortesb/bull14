# bull14

AI models, APIs, tools and GPU pricing tracker — updated daily.

> From *bulbullia* (Latin) — the root of *burbuja* (bubble). An honest look at the AI hype.

Live at [bull14.olcortesb.com](https://bull14.olcortesb.com)

## What it tracks

- **Models** — open-weight and API-only, with context window, modalities, license and quantization formats
- **Pricing** — input/output cost per 1M tokens per provider, updated daily
- **Deployments** — where each model runs (API, cloud GPU, local) and at what cost
- **Tools** — frameworks, runtimes, eval and observability tools with latest versions
- **Hardware** — GPU cloud pricing (vast.ai, RunPod, Lambda Labs) per GPU type
- **Analytics** — hype index, price tracker, model velocity, GPU price index, breakeven calculator

## Tech Stack

- Vue 3 + Vite + Tailwind CSS
- AWS Amplify (hosting)
- Data served via CloudFront fetch() — no static imports

## Development

```bash
npm install
npm run dev
```

## Data

JSON files served from CloudFront, generated daily by [bull14-backend](https://github.com/olcortesb/bull14-backend).

## License

MIT
