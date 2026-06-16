"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";
import { apiGet } from "@/lib/api";

import type { RiskLevel, SimulationPeriod } from "../investment-simulation/types";
import type { AiRivalResult, AiRivalsSimulationResult } from "./types";

const riskLabels: Record<RiskLevel, string> = {
  low: "Düşük Risk",
  medium: "Orta Risk",
  high: "Yüksek Risk"
};

const periodLabels: Record<SimulationPeriod, string> = {
  short: "Kısa Vade",
  medium: "Orta Vade",
  long: "Uzun Vade"
};

const approachLabels: Record<RiskLevel, string> = {
  low: "Koruyucu",
  medium: "Dengeli",
  high: "Agresif"
};

const lineColors = ["#0f766e", "#2563eb", "#b7791f", "#c2410c"];

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "%0";
  }

  return `%${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function safeValue(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function portfolioItems(item: AiRivalResult) {
  return item.portfolio
    .filter((coin) => Number.isFinite(coin.weight))
    .map((coin) => ({
      label: `${coin.symbol} %${coin.weight.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`,
      symbol: coin.symbol
    }));
}

function compareUserToNearest(result: AiRivalsSimulationResult, formatCurrency: (value: number) => string) {
  const user = result.results.find((item) => item.id === "user");
  if (!user) return "Senin stratejin bu simülasyonda karşılaştırma listesine dahil edildi.";

  const sorted = [...result.results].sort((a, b) => b.currentValue - a.currentValue);
  const above = sorted.find((item) => item.currentValue > user.currentValue);
  const below = [...sorted].reverse().find((item) => item.currentValue < user.currentValue);

  if (above) {
    return `${above.name} bu dönemde senin stratejinden ${formatCurrency(above.currentValue - user.currentValue)} daha yüksek sonuç verdi.`;
  }
  if (below) {
    return `Senin stratejin bu dönemde ${below.name} sonucundan ${formatCurrency(user.currentValue - below.currentValue)} daha yüksek sonuç verdi.`;
  }
  return "Senin stratejin seçilen dönemde diğer stratejilerle benzer bir sonuç verdi.";
}

function buildPercentLineData(result: AiRivalsSimulationResult) {
  if (!Number.isFinite(result.amount) || result.amount <= 0) {
    return [];
  }

  const labels = ["Başlangıç", "Orta dönem", "Bugün"];
  return labels.map((label) => {
    const point: Record<string, string | number> = { label };
    for (const item of result.results) {
      const value = item.performancePoints.find((performancePoint) => performancePoint.label === label)?.value;
      const percentChange = ((safeValue(value ?? result.amount) - result.amount) / result.amount) * 100;
      point[item.name] = Number.isFinite(percentChange) ? Number(percentChange.toFixed(2)) : 0;
    }
    return point;
  });
}

function PerformanceChart({ result }: { result: AiRivalsSimulationResult }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => buildPercentLineData(result), [result]);

  if (!mounted) {
    return <div aria-hidden="true" className="chart-box chart-box-compact" />;
  }

  if (chartData.length === 0) {
    return <div className="empty-state">Grafik için yeterli veri yok.</div>;
  }

  return (
    <section className="card ai-rivals-chart-card">
      <div className="section-heading">
        <h2>Zaman İçinde Strateji Performansı</h2>
        <p className="muted">
          Grafik, başlangıç değerini %0 kabul ederek stratejilerin seçilen dönem içindeki yaklaşık performans değişimini gösterir.
        </p>
      </div>
      <div className="chart-box chart-box-compact">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(value) => formatPercent(Number(value))} width={72} />
            <Tooltip formatter={(value) => formatPercent(Number(value))} />
            <Legend />
            {result.results.map((item, index) => (
              <Line
                dataKey={item.name}
                dot={{ r: 3 }}
                key={item.id}
                stroke={lineColors[index % lineColors.length]}
                strokeWidth={2.5}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function AiRivalsPanel() {
  const { formatCurrency } = useCurrencyFormatter();
  const [amount, setAmount] = useState("10000");
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [period, setPeriod] = useState<SimulationPeriod>("medium");
  const [result, setResult] = useState<AiRivalsSimulationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function runSimulation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Sanal yatırım tutarı 0'dan büyük olmalı.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const query = new URLSearchParams({
        amount: String(parsedAmount),
        risk,
        period
      });
      const data = await apiGet<AiRivalsSimulationResult>(`/api/ai-rivals/simulation?${query.toString()}`);
      setResult(data);
      setStatus("idle");
    } catch {
      setResult(null);
      setErrorMessage("Strateji laboratuvarı için fiyat verisi alınamadı. Daha sonra tekrar dene.");
      setStatus("error");
    }
  }

  const userResult = result?.results.find((item) => item.id === "user") ?? null;

  return (
    <section className="ai-rivals-section">
      <div className="ai-rivals-disclaimer">
        Bu simülasyon geçmiş fiyat verilerine dayanır. Yatırım tavsiyesi değildir. Sanal yatırım tutarıyla çalışır;
        kayıtlı gelir, gider veya bütçe verilerinizi değiştirmez.
      </div>

      <form className="card filter-grid ai-rivals-form" onSubmit={runSimulation} noValidate>
        <div className="field">
          <label htmlFor="rivalsAmount">Sanal yatırım tutarı</label>
          <input
            id="rivalsAmount"
            min="1"
            step="100"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="rivalsRisk">Kullanıcı risk tercihi</label>
          <select id="rivalsRisk" value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)}>
            <option value="low">Düşük Risk</option>
            <option value="medium">Orta Risk</option>
            <option value="high">Yüksek Risk</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rivalsPeriod">Vade</label>
          <select id="rivalsPeriod" value={period} onChange={(event) => setPeriod(event.target.value as SimulationPeriod)}>
            <option value="short">Kısa Vade</option>
            <option value="medium">Orta Vade</option>
            <option value="long">Uzun Vade</option>
          </select>
        </div>
        <button className="button" disabled={status === "loading"} type="submit">
          {status === "loading" ? "Hesaplanıyor" : "Simülasyonu Başlat"}
        </button>
      </form>

      {status === "error" && errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {status === "loading" ? <div className="state-card">Strateji laboratuvarı hesaplanıyor.</div> : null}
      {status !== "loading" && !result ? (
        <div className="empty-state">Sanal tutar, risk ve vade seçip risk profillerini karşılaştır.</div>
      ) : null}

      {result && userResult ? (
        <div className="ai-rivals-result">
          <section className="card simulation-summary-card compact-summary">
            <div>
              <p className="eyebrow">Sonuç Özeti</p>
              <h2>Seçilen geçmiş dönemde öne çıkan strateji: {result.winner.name}.</h2>
              <p className="muted">
                Senin stratejin seçilen dönemde 4 strateji içinde {result.userRank}. sırada yer aldı. {compareUserToNearest(result, formatCurrency)}
              </p>
            </div>
            <div className="simulation-summary-grid">
              <div className="state-card">
                <span>Senin bugünkü tahmini değerin</span>
                <strong>{formatCurrency(safeValue(userResult.currentValue))}</strong>
              </div>
              <div className="state-card">
                <span>Senin getirin</span>
                <strong className={userResult.profitLossPercent >= 0 ? "positive" : "negative"}>
                  {formatPercent(userResult.profitLossPercent)}
                </strong>
              </div>
              <div className="state-card">
                <span>Risk / vade</span>
                <strong>
                  {riskLabels[result.risk]} / {periodLabels[result.period]}
                </strong>
              </div>
            </div>
          </section>

          <section className="selection-chip-row" aria-label="Seçim özeti">
            <span>Risk: {riskLabels[result.risk]}</span>
            <span>Vade: {periodLabels[result.period]}</span>
            <span>Dönem: {result.initialDateLabel}</span>
            <span>Başlangıç: {formatCurrency(result.amount)}</span>
            <span>Yaklaşım: {approachLabels[result.risk]}</span>
            <span>Coin sayısı: {userResult.portfolio.length}</span>
          </section>

          <div className="grid rival-card-grid">
            {result.results
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((item) => {
                const chips = portfolioItems(item);

                return (
                  <article className={`card rival-card ${item.type === "user" ? "rival-card-user" : ""}`} key={item.id}>
                    <div className="rival-card-header compact-card-header">
                      <div>
                        <h3>{item.name}</h3>
                        <p className="muted">{item.description}</p>
                      </div>
                      <span className="risk-badge">{item.riskLevel}</span>
                    </div>
                    <div className="portfolio-chip-list" aria-label={`${item.name} portföy ağırlıkları`}>
                      {chips.length > 0 ? chips.map((chip) => <span key={chip.symbol}>{chip.label}</span>) : <span>-</span>}
                    </div>
                    <div className="rival-values">
                      <span>Bugünkü tahmini değer</span>
                      <strong>{formatCurrency(safeValue(item.currentValue))}</strong>
                    </div>
                    <div className="rival-row">
                      <span>Getiri</span>
                      <strong className={item.profitLossPercent >= 0 ? "positive" : "negative"}>
                        {formatPercent(item.profitLossPercent)}
                      </strong>
                    </div>
                    <div className="rival-row">
                      <span>Sıralama</span>
                      <strong>{item.rank}/4</strong>
                    </div>
                  </article>
                );
              })}
          </div>

          <PerformanceChart result={result} />

          <section className="strategy-explain-grid">
            <div className="card simulation-comment-card compact-comment-card">
              <h2>Neden böyle oldu?</h2>
              <p>{result.reasonText}</p>
            </div>
            <div className="card simulation-comment-card compact-comment-card">
              <h2>Bu senaryodan çıkarım</h2>
              <p>{result.lessonText}</p>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
