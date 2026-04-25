import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { getCreateMarketExecution } from "@seer-pm/sdk/create-market";
import { marketFactoryAbi } from "@seer-pm/sdk/contracts/market-factory";
import { MarketTypes } from "@seer-pm/sdk/market";
import { createPublicClient, createWalletClient, decodeEventLog, http, parseEther } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { Asset, MarketGroup, Protocol, RiskMarketSeedDefinition } from "../src/lib/types";
import { DEFAULT_RISK_MARKET_CATEGORY } from "../src/lib/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketGroupsPath = path.resolve(__dirname, "../data/market-groups.json");
const assetsPath = path.resolve(__dirname, "../data/assets.json");
const protocolsPath = path.resolve(__dirname, "../data/protocols.json");
const dryRun = process.argv.includes("--dry-run");
const seerPrivateKey = process.env.SEER_CREATOR_PRIVATE_KEY as `0x${string}` | undefined;
const defaultChainId = Number(process.env.SEER_CHAIN_ID ?? "100");
const defaultMinBond = BigInt(process.env.SEER_MIN_BOND ?? "10000000000000000");

const chains = {
  [mainnet.id]: mainnet,
  [gnosis.id]: gnosis,
  [optimism.id]: optimism,
  [base.id]: base
} as const;

function getChain(chainId: number) {
  const chain = chains[chainId as keyof typeof chains];
  if (!chain) {
    throw new Error(`Unsupported chain id "${chainId}" for risk market sync`);
  }
  return chain;
}

function requirePrivateKey() {
  if (!seerPrivateKey) {
    throw new Error("Missing SEER_CREATOR_PRIVATE_KEY");
  }
  return seerPrivateKey;
}

async function loadMarketGroups() {
  const raw = await readFile(marketGroupsPath, "utf8");
  return JSON.parse(raw) as MarketGroup[];
}

async function loadAssets() {
  const raw = await readFile(assetsPath, "utf8");
  return JSON.parse(raw) as Asset[];
}

async function loadProtocols() {
  const raw = await readFile(protocolsPath, "utf8");
  return JSON.parse(raw) as Protocol[];
}

function toMarketType(seed: RiskMarketSeedDefinition) {
  return seed.marketType === "scalar" ? MarketTypes.SCALAR : MarketTypes.CATEGORICAL;
}

async function createConfiguredMarket(seed: RiskMarketSeedDefinition) {
  const chainId = seed.chainId ?? defaultChainId;
  const chain = getChain(chainId);
  const account = privateKeyToAccount(requirePrivateKey());
  const publicClient = createPublicClient({ chain, transport: http() });
  const walletClient = createWalletClient({ chain, transport: http(), account });
  const execution = getCreateMarketExecution({
    chainId,
    marketType: toMarketType(seed),
    marketName: seed.question,
    outcomes: seed.outcomes ?? ["Yes", "No"],
    lowerBound: parseEther(seed.lowerBound ?? "0"),
    upperBound: parseEther(seed.upperBound ?? "100"),
    unit: seed.unit ?? "%",
    openingTime: Math.floor(new Date(seed.openingTime).getTime() / 1000),
    minBond: BigInt(seed.minBondWei ?? defaultMinBond),
    category: seed.category ?? DEFAULT_RISK_MARKET_CATEGORY
  });
  const hash = await walletClient.sendTransaction(execution);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: marketFactoryAbi,
        data: log.data,
        topics: log.topics
      });

      if (decoded.eventName === "NewMarket") {
        return {
          marketId: decoded.args.market as `0x${string}`,
          chainId
        };
      }
    } catch {
      // ignore unrelated logs
    }
  }

  throw new Error(`Transaction ${hash} mined but no NewMarket event was found`);
}

function getSubjectLabel(group: MarketGroup, assets: Asset[], protocols: Protocol[]) {
  if (group.subjectType === "asset") {
    const asset = assets.find((entry) => entry.id === group.subjectId);
    return asset?.symbol ?? group.subjectId;
  }

  if (group.subjectType === "protocol") {
    const protocol = protocols.find((entry) => entry.id === group.subjectId);
    return protocol?.name ?? group.subjectId;
  }

  return group.subjectId;
}

function printPlannedCreations(
  creations: Array<{
    subjectType: MarketGroup["subjectType"];
    subjectId: string;
    subjectLabel: string;
    marketGroupId: string;
    marketId: string;
    marketLabel: string;
    question: string;
    chainId: number;
  }>
) {
  if (creations.length === 0) {
    console.log("No markets need to be created.");
    return;
  }

  console.log(dryRun ? "Markets that would be created:" : "Markets created:");

  for (const creation of creations) {
    console.log(
      [
        `- ${creation.subjectType} ${creation.subjectLabel} (${creation.subjectId})`,
        `market=${creation.marketId}`,
        `group=${creation.marketGroupId}`,
        `chainId=${creation.chainId}`,
        `label="${creation.marketLabel}"`,
        `question="${creation.question}"`
      ].join(" | ")
    );
  }
}

async function main() {
  const [marketGroups, assets, protocols] = await Promise.all([loadMarketGroups(), loadAssets(), loadProtocols()]);
  const updatedGroups: MarketGroup[] = [];
  const plannedCreations: Array<{
    subjectType: MarketGroup["subjectType"];
    subjectId: string;
    subjectLabel: string;
    marketGroupId: string;
    marketId: string;
    marketLabel: string;
    question: string;
    chainId: number;
  }> = [];
  const summary = {
    dryRun,
    alreadyConfigured: 0,
    missing: 0,
    missingSeed: 0,
    created: 0
  };

  for (const group of marketGroups) {
    const subjectLabel = getSubjectLabel(group, assets, protocols);
    const nextGroup: MarketGroup = {
      ...group,
      markets: []
    };

    for (const market of group.markets) {
      if (market.seerMarketId) {
        summary.alreadyConfigured += 1;
        nextGroup.markets.push(market);
        continue;
      }

      summary.missing += 1;

      if (!market.seed) {
        summary.missingSeed += 1;
        nextGroup.markets.push({
          ...market,
          creation: {
            status: "missing",
            chainId: defaultChainId,
            lastSyncedAt: new Date().toISOString()
          }
        });
        continue;
      }

      if (dryRun) {
        plannedCreations.push({
          subjectType: group.subjectType,
          subjectId: group.subjectId,
          subjectLabel,
          marketGroupId: group.id,
          marketId: market.id,
          marketLabel: market.label,
          question: market.seed.question,
          chainId: market.seed.chainId ?? defaultChainId
        });
        nextGroup.markets.push(market);
        continue;
      }

      const created = await createConfiguredMarket(market.seed);
      summary.created += 1;
      plannedCreations.push({
        subjectType: group.subjectType,
        subjectId: group.subjectId,
        subjectLabel,
        marketGroupId: group.id,
        marketId: market.id,
        marketLabel: market.label,
        question: market.seed.question,
        chainId: created.chainId
      });
      nextGroup.markets.push({
        ...market,
        seerMarketId: created.marketId,
        creation: {
          status: "created",
          chainId: created.chainId,
          url: `https://app.seer.pm/markets/${created.chainId}/${created.marketId}`,
          lastSyncedAt: new Date().toISOString()
        }
      });
    }

    updatedGroups.push(nextGroup);
  }

  if (!dryRun) {
    await writeFile(marketGroupsPath, `${JSON.stringify(updatedGroups, null, 2)}\n`, "utf8");
  }

  printPlannedCreations(plannedCreations);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
