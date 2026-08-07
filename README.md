# Seer Shield

Seer Shield is a simple demo project built on top of [Seer](https://seer.pm). It uses prediction markets to aggregate risk across DeFi assets and protocols, making it easier to compare yield opportunities with the risks behind them.

Headline APR does not tell the whole story: a position may depend on both the asset holding its peg and the underlying protocol remaining secure. Seer Shield brings those risks together and uses market-implied probabilities to estimate a more realistic, risk-adjusted return.

The demo can be used to:

- Combine related risks, such as cBTC depeg risk and the risk of an Aave exploit
- Find the safest effective APR after accounting for those risks
- Hedge exposure through Seer prediction markets

## How it works

The demo presents a curated set of DeFi yield opportunities alongside relevant Seer risk markets. For each opportunity, it combines the advertised yield with asset-level and protocol-level risk to show its effective APR and make otherwise different opportunities easier to compare.

Because the risk estimates come from prediction markets, users can also open the related Seer market to inspect the market signal or take a position that helps hedge their DeFi exposure.

## Run locally

```bash
npm install
npm run dev
```
