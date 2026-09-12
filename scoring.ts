import type { Company } from "./data";

export type Horizon = "short" | "long";

export interface Weights {
  emissionsIntensity: number;
  energyEfficiency: number;
  greenCapex: number;
  carbonSensitivity: number;
  trackRecord: number;
  rdGreen: number;
}

// Short-term leans on current emissions intensity and carbon price exposure
// Long-term leans on green capex and R&D as forward-looking signals
const SHORT_TERM_BASE: Weights = {
  emissionsIntensity: 0.30,  // heavy weight on current performance
  energyEfficiency:   0.25,
  greenCapex:         0.10,
  carbonSensitivity:  0.20,  // carbon price exposure is near-term risk
  trackRecord:        0.10,
  rdGreen:            0.05,
};

const LONG_TERM_BASE: Weights = {
  emissionsIntensity: 0.12,
  energyEfficiency:   0.13,
  greenCapex:         0.28,  // green capex is the key forward signal
  carbonSensitivity:  0.10,
  trackRecord:        0.12,
  rdGreen:            0.25,  // R&D is the other key forward signal
};

// emissions category: emissionsIntensity, energyEfficiency, carbonSensitivity
// resilience category: greenCapex, trackRecord, rdGreen
// emissionsWeight 0–1 controls split between the two
export function computeWeights(horizon: Horizon, emissionsWeight: number): Weights {
  const base = horizon === "short" ? SHORT_TERM_BASE : LONG_TERM_BASE;
  const resilienceWeight = 1 - emissionsWeight;

  // Redistribute within each category proportionally
  const emissionsTotal = base.emissionsIntensity + base.energyEfficiency + base.carbonSensitivity;
  const resilienceTotal = base.greenCapex + base.trackRecord + base.rdGreen;

  return {
    emissionsIntensity: (base.emissionsIntensity / emissionsTotal) * emissionsWeight,
    energyEfficiency:   (base.energyEfficiency   / emissionsTotal) * emissionsWeight,
    carbonSensitivity:  (base.carbonSensitivity   / emissionsTotal) * emissionsWeight,
    greenCapex:         (base.greenCapex   / resilienceTotal) * resilienceWeight,
    trackRecord:        (base.trackRecord  / resilienceTotal) * resilienceWeight,
    rdGreen:            (base.rdGreen      / resilienceTotal) * resilienceWeight,
  };
}

export function rawScore(c: Company, w: Weights): number {
  // Inverted indicators: lower raw = better = higher score
  const emissionsScore    = (100 - c.emissionsIntensity);
  const carbonSensScore   = (100 - c.carbonSensitivity);

  return (
    emissionsScore          * w.emissionsIntensity +
    c.energyEfficiency      * w.energyEfficiency +
    c.greenCapex            * w.greenCapex +
    carbonSensScore         * w.carbonSensitivity +
    c.trackRecord           * w.trackRecord +
    c.rdGreen               * w.rdGreen
  );
}

export interface ScoredCompany extends Company {
  score: number;           // 0–100 normalized within sector
  sectorRank: number;      // 1-based rank within sector
  sectorCount: number;
}

export function scoreAndRank(companies: Company[], w: Weights): ScoredCompany[] {
  // Group by sector, compute raw scores, normalize within each sector
  const bySector: Record<string, { company: Company; raw: number }[]> = {};
  for (const c of companies) {
    if (!bySector[c.sector]) bySector[c.sector] = [];
    bySector[c.sector].push({ company: c, raw: rawScore(c, w) });
  }

  const result: ScoredCompany[] = [];

  for (const sector of Object.keys(bySector)) {
    const group = bySector[sector].sort((a, b) => b.raw - a.raw);
    const maxRaw = group[0].raw;
    const minRaw = group[group.length - 1].raw;
    const range = maxRaw - minRaw || 1;

    group.forEach(({ company, raw }, idx) => {
      result.push({
        ...company,
        score: Math.round(((raw - minRaw) / range) * 100),
        sectorRank: idx + 1,
        sectorCount: group.length,
      });
    });
  }

  return result;
}
