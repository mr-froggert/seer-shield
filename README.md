# Yield Seer

Yield Seer is a read-only DeFi yield and risk terminal built around a small, curated config universe. It combines:

- DefiLlama APY and TVL reads for configured opportunities
- Seer-linked risk markets for explicit downside inputs
- a config-driven risk model that compares gross carry versus expected loss through each market horizon

The app is intentionally not a generalized market creation engine or full protocol discovery product. Config files define the opportunity universe:

- `data/protocols.json`
- `data/assets.json`
- `data/opportunities.json`
- `data/market-groups.json`

## Local setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` if you need to override defaults.

Required for the frontend:

- `VITE_SEER_API_HOST`: defaults to `https://app.seer.pm`
- `VITE_SEER_CHAIN_ID`: defaults to `100`
- `VITE_SEER_MARKET_CATEGORY`: optional default category for seeded risk markets

Required only for live risk-market creation:

- `SEER_CREATOR_PRIVATE_KEY`
- `SEER_CHAIN_ID`
- `SEER_MIN_BOND`

DefiLlama reads use the public yields API and do not require an API key.

## Risk-market sync

Dry run:

```bash
npm run sync:risk-markets:dry-run
```

Live creation:

```bash
npm run sync:risk-markets
```

The sync script:

- reads configured market groups from `data/market-groups.json`
- identifies configured markets that do not yet have `seerMarketId`
- lists which asset or protocol each missing market belongs to during `--dry-run`
- creates only those configured markets when seed metadata is present
- does not mutate `data/market-groups.json` during `--dry-run`
- writes back market ids and creation metadata to `data/market-groups.json`

## Deploying to Vercel

This repo includes a GitHub Actions workflow at `.github/workflows/vercel-deploy.yml` that deploys to Vercel on pushes to `main`.

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required setup:

1. Create or import the project in Vercel.
2. In Vercel, add the frontend environment variables the app needs for production.
3. In GitHub, add the three Vercel secrets above under repository secrets.
4. If you use this workflow, disable Vercel's automatic Git-based production deployments to avoid duplicate deploys.

The included `vercel.json` adds an SPA rewrite so direct visits to nested React Router URLs resolve to `index.html` instead of returning a 404.
