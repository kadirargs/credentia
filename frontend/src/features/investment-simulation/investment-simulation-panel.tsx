"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";
import { apiGet } from "@/lib/api";

import type { InvestmentSimulationResult, RiskLevel, SimulationPeriod } from "./types";

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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "%0";
  }

  return `%${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function SimulationChart({ data }: { data: InvestmentSimulationResult["chartData"] }) {
  const { formatCurrency } = useCurrencyFormatter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" className="chart-box" />;
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={data}>
          <CartesianGrid stroke="#d9e0e6" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={88} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InvestmentSimulationPanel() {
  const { formatCurrency } = useCurrencyFormatter();
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [period, setPeriod] = useState<SimulationPeriod>("medium");
  const [amount, setAmount] = useState("10000");
  const [result, setResult] = useState<InvestmentSimulationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function runSimulation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Yatırım tutarı 0'dan büyük olmalı.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const query = new URLSearchParams({
        risk,
        period,
        amount: String(parsedAmount)
      });
      const data = await apiGet<InvestmentSimulationResult>(`/api/investment-simulation?${query.toString()}`);
      setResult(data);
      setStatus("idle");
    } catch {
      setResult(null);
      setErrorMessage("Kripto fiyat verisi alınamadı. Daha sonra tekrar dene.");
      setStatus("error");
    }
  }

  return (
    <div className="grid content-grid">
      <section className="card">
        <h2>Simülasyon ayarları</h2>
        <form className="form-grid" style={{ marginTop: 16 }} onSubmit={runSimulation} noValidate>
          <div className="field">
            <label htmlFor="risk">Risk tercihi</label>
            <select id="risk" value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)}>
              <option value="low">Düşük Risk</option>
              <option value="medium">Orta Risk</option>
              <option value="high">Yüksek Risk</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="period">Vade</label>
            <select id="period" value={period} onChange={(event) => setPeriod(event.target.value as SimulationPeriod)}>
              <option value="short">Kısa Vade</option>
              <option value="medium">Orta Vade</option>
              <option value="long">Uzun Vade</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="amount">Yatırım tutarı</label>
            <input
              id="amount"
              min="1"
              step="100"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <button className="button" disabled={status === "loading"} type="submit">
            {status === "loading" ? "Hesaplanıyor" : "Simülasyonu Başlat"}
          </button>

          {status === "error" && errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <p className="field-hint">Bu simülasyon geçmiş fiyat verilerine dayanır. Yatırım tavsiyesi değildir.</p>
        </form>
      </section>

      <section className="card">
        <h2>Simülasyon sonucu</h2>
        <div style={{ marginTop: 16 }}>
          {status === "loading" ? <div className="state-card">Simülasyon hesaplanıyor.</div> : null}
          {status !== "loading" && !result ? (
            <div className="empty-state">Risk, vade ve tutar seçip simülasyonu başlat.</div>
          ) : null}
          {result ? (
            <div className="simulation-result">
              <div className="grid simulation-metrics">
                <div className="state-card">
                  <span>Başlangıç tutarı</span>
                  <strong>{formatCurrency(result.amount)}</strong>
                </div>
                <div className="state-card">
                  <span>Bugünkü tahmini değer</span>
                  <strong>{formatCurrency(result.currentValue)}</strong>
                </div>
                <div className="state-card">
                  <span>Kar / zarar</span>
                  <strong className={result.profitLoss >= 0 ? "positive" : "negative"}>{formatCurrency(result.profitLoss)}</strong>
                </div>
                <div className="state-card">
                  <span>Kar / zarar yüzdesi</span>
                  <strong className={result.profitLossPercent >= 0 ? "positive" : "negative"}>{formatPercent(result.profitLossPercent)}</strong>
                </div>
              </div>

              <SimulationChart data={result.chartData} />

              <div>
                <h3 className="section-subtitle">Kullanılan portföy</h3>
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Coin</th>
                        <th>Ağırlık</th>
                        <th>{result.initialDateLabel}</th>
                        <th>Bugün</th>
                        <th>Değişim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.portfolio.map((coin) => (
                        <tr key={coin.symbol}>
                          <td>
                            <strong>{coin.symbol}</strong>
                            <span className="muted"> {coin.name}</span>
                          </td>
                          <td>{formatPercent(coin.weight)}</td>
                          <td>{formatCurrency(coin.startValue)}</td>
                          <td>{formatCurrency(coin.currentValue)}</td>
                          <td className={coin.profitLossPercent >= 0 ? "positive" : "negative"}>
                            {formatPercent(coin.profitLossPercent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="inline-alert">
                <p>{result.disclaimer}</p>
                <p>
                  Seçim: {riskLabels[result.risk]} / {periodLabels[result.period]}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
