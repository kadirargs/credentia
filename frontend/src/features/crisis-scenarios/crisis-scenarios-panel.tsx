"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";
import { apiGet } from "@/lib/api";

import type { CrisisCoin, CrisisScenarioId, CrisisScenarioResult } from "./types";

const coins: CrisisCoin[] = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK", "TRX"];
const DISCLAIMER_TEXT = "Bu analiz geçmiş fiyat verilerine dayanır. Yatırım tavsiyesi değildir.";
const DISCLAIMER_DETAIL =
  "Sanal yatırım hesabı yalnızca geçmiş dönem karşılaştırması içindir; gerçek alım/satım yönlendirmesi değildir.";

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "%0";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}%${Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function safeCurrency(value: number | null, formatCurrency: (value: number) => string) {
  return formatCurrency(Number.isFinite(value ?? NaN) ? Number(value) : 0);
}

function getScenarioComment(result: CrisisScenarioResult) {
  if (!result.hasEnoughData) {
    return "Seçilen varlık için bu kriz döneminde yeterli geçmiş fiyat verisi bulunamadı.";
  }

  const change = result.profitLossPercent ?? 0;
  const movement =
    change > 2 ? "dönem sonunda artış göstermiştir" : change < -2 ? "dönem sonunda değer kaybı göstermiştir" : "dönem sonunda yataya yakın seyretmiştir";

  if (result.scenario === "pandemic_2020") {
    return `${result.scenarioName} döneminde ${result.coin}, aylık kapanış verilerine göre yıl içindeki dalgalanmanın ardından ${movement}.`;
  }

  return `${result.scenarioName} döneminde ${result.coin}, aylık kapanış verilerine göre belirgin piyasa baskısı altında ${movement}.`;
}

function CrisisChart({ result }: { result: CrisisScenarioResult }) {
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
        <LineChart data={result.monthlyPrices}>
          <CartesianGrid stroke="#d9e0e6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={88} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line dataKey="estimatedValue" name="Tahmini değer" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CrisisScenariosPanel() {
  const { formatCurrency } = useCurrencyFormatter();
  const [scenario, setScenario] = useState<CrisisScenarioId>("crypto_2022");
  const [coin, setCoin] = useState<CrisisCoin>("BTC");
  const [amount, setAmount] = useState("10000");
  const [result, setResult] = useState<CrisisScenarioResult | null>(null);
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
        scenario,
        coin,
        amount: String(parsedAmount)
      });
      const data = await apiGet<CrisisScenarioResult>(`/api/crisis-scenarios/simulation?${query.toString()}`);
      setResult(data);
      setStatus("idle");
    } catch {
      setResult(null);
      setErrorMessage("Kriz senaryosu için fiyat verisi alınamadı. Daha sonra tekrar dene.");
      setStatus("error");
    }
  }

  return (
    <section className="card crisis-section">
      <div className="section-heading">
        <h2>Kriz Senaryoları</h2>
        <p className="muted">
          Seçilen kriz döneminde kripto varlığın aylık fiyat değişimini ve sanal yatırım değerini inceleyin.
        </p>
      </div>

      <form className="filter-grid crisis-form" onSubmit={runSimulation} noValidate>
        <div className="field">
          <label htmlFor="crisisScenario">Kriz senaryosu</label>
          <select id="crisisScenario" value={scenario} onChange={(event) => setScenario(event.target.value as CrisisScenarioId)}>
            <option value="pandemic_2020">2020 Pandemi Dönemi</option>
            <option value="crypto_2022">2022 Kripto Piyasası Çöküşü</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="crisisCoin">Coin</label>
          <select id="crisisCoin" value={coin} onChange={(event) => setCoin(event.target.value as CrisisCoin)}>
            {coins.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="crisisAmount">Sanal yatırım tutarı</label>
          <input
            id="crisisAmount"
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
      </form>

      <p className="crisis-method-note">
        Veri kaynağı: Binance geçmiş fiyat verileri. Canlı veri alınamazsa yaklaşık referans seri kullanılır.
        Hesaplama: aylık kapanış fiyatı ve aynı ay USDT/TRY kapanış kuru.
      </p>

      {status === "error" && errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {status === "loading" ? <div className="state-card">Kriz senaryosu hesaplanıyor.</div> : null}
      {status !== "loading" && !result ? (
        <div className="empty-state">Senaryo, coin ve tutar seçip simülasyonu başlat.</div>
      ) : null}

      {result && !result.hasEnoughData ? (
        <div className="crisis-no-data">
          <p>{result.message ?? "Seçilen varlık için bu kriz döneminde yeterli fiyat verisi bulunamadı."}</p>
          <p>{DISCLAIMER_TEXT}</p>
        </div>
      ) : null}

      {result && result.hasEnoughData ? (
        <div className="crisis-result">
          <div className="grid simulation-metrics">
            <div className="state-card">
              <span>Senaryo</span>
              <strong>{result.scenarioName}</strong>
            </div>
            <div className="state-card">
              <span>Coin</span>
              <strong>{result.coin}</strong>
            </div>
            <div className="state-card">
              <span>Başlangıç tutarı</span>
              <strong>{formatCurrency(result.amount)}</strong>
            </div>
            <div className="state-card">
              <span>Dönem sonu tahmini değer</span>
              <strong>{safeCurrency(result.finalValue, formatCurrency)}</strong>
            </div>
            <div className="state-card">
              <span>Kar / zarar</span>
              <strong className={(result.profitLoss ?? 0) >= 0 ? "positive" : "negative"}>{safeCurrency(result.profitLoss, formatCurrency)}</strong>
            </div>
            <div className="state-card">
              <span>Kar / zarar yüzdesi</span>
              <strong className={(result.profitLossPercent ?? 0) >= 0 ? "positive" : "negative"}>
                {formatPercent(result.profitLossPercent)}
              </strong>
            </div>
            <div className="state-card">
              <span>Başlangıç ayı kapanış fiyatı</span>
              <strong>{safeCurrency(result.startPrice, formatCurrency)}</strong>
            </div>
            <div className="state-card">
              <span>Bitiş ayı kapanış fiyatı</span>
              <strong>{safeCurrency(result.endPrice, formatCurrency)}</strong>
            </div>
          </div>

          <div className="crisis-comment-card">
            <h3>Senaryo Yorumu</h3>
            {result.isEstimated && result.message ? <p className="field-hint">{result.message}</p> : null}
            <p>{getScenarioComment(result)}</p>
          </div>

          <div className="crisis-chart-heading">
            <h3>Aylık Tahmini Yatırım Değeri</h3>
            <p>Başlangıç tutarı, seçilen coinin aylık kapanış fiyatı değişimine göre yeniden hesaplanır.</p>
          </div>

          <CrisisChart result={result} />

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Ay</th>
                  <th>Aylık kapanış coin fiyatı</th>
                  <th>Tahmini yatırım değeri</th>
                </tr>
              </thead>
              <tbody>
                {result.monthlyPrices.map((point) => (
                  <tr key={point.month}>
                    <td>{point.month}</td>
                    <td>{formatCurrency(point.price)}</td>
                    <td>{formatCurrency(point.estimatedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crisis-disclaimer">
            <p>{DISCLAIMER_TEXT}</p>
            <p>{DISCLAIMER_DETAIL}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
