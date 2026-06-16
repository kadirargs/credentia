"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { apiPost } from "@/lib/api";
import { formatMonthYear } from "@/lib/format";

import type { AssistantMessage, AssistantResponse } from "./types";

type AssistantStatus = "idle" | "loading" | "error";

function currentPeriod() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1
  };
}

function recentMonthOptions() {
  const today = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return {
      key: `${year}-${month}`,
      label: formatMonthYear(month, year),
      year,
      month
    };
  });
}

const starterPrompts = [
  "Bu ay gelir-gider dengem nasıl?",
  "En yüksek harcama kategorim hangisi?",
  "Bütçe kullanımımda risk var mı?",
  "Geçen aya göre finansal durumum nasıl değişti?",
  "Bu ay tasarruf fırsatları nerede?"
];

export function AssistantPanel() {
  const [period, setPeriod] = useState(() => currentPeriod());
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const periodOptions = useMemo(() => recentMonthOptions(), []);

  async function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || status === "loading") return;

    const userMessage: AssistantMessage = { role: "user", content: trimmedMessage };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStatus("loading");
    setErrorMessage("");

    try {
      const data = await apiPost<
        AssistantResponse,
        { message: string; year: number; month: number; history: AssistantMessage[] }
      >("/api/assistant/ask", {
        message: trimmedMessage,
        year: period.year,
        month: period.month,
        history: messages.slice(-10)
      });

      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Asistan yanıtı şu anda alınamadı. Lütfen daha sonra tekrar deneyin.");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="assistant-section">
      <div className="card assistant-controls">
        <div className="section-heading">
          <h2>Credentia Asistan</h2>
          <p className="muted">
            Finans verilerin, uygulama kullanımı, planlama ve günlük konular hakkında rahatça sohbet edebilirsin.
          </p>
        </div>

        <label className="field compact-field">
          <span>Veri dönemi</span>
          <select
            value={`${period.year}-${period.month}`}
            onChange={(event) => {
              const [year, month] = event.target.value.split("-").map(Number);
              setPeriod({ year, month });
            }}
          >
            {periodOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card assistant-chat-card">
        {messages.length === 0 ? (
          <div className="assistant-welcome">
            <h3>Asistana doğrudan yaz</h3>
            <p>
              İstersen harcamalarına beraber bakalım, istersen gününü planlayalım ya da aklına takılan şeyi hızlıca
              konuşalım.
            </p>
            <div className="assistant-starter-row" aria-label="Örnek sorular">
              {starterPrompts.map((prompt) => (
                <button key={prompt} className="secondary-button" type="button" onClick={() => void sendMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="assistant-message-list" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`assistant-message ${message.role === "user" ? "user" : "assistant"}`} key={`${message.role}-${index}`}>
                <span>{message.role === "user" ? "Sen" : "Credentia Asistan"}</span>
                <p>{message.content}</p>
              </div>
            ))}
            {status === "loading" ? (
              <div className="assistant-message assistant">
                <span>Credentia Asistan</span>
                <p>Yanıt hazırlanıyor.</p>
              </div>
            ) : null}
          </div>
        )}

        {status === "error" ? <div className="state-card error">{errorMessage}</div> : null}

        <form className="assistant-chat-form" onSubmit={handleSubmit}>
          <textarea
            aria-label="Asistana mesaj yaz"
            maxLength={1200}
            placeholder="Aklındaki şeyi yaz... mesela: Bu ay bende dikkat çeken ne var?"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <button className="button icon-button-text" disabled={status === "loading" || !input.trim()} type="submit">
            <Send size={18} />
            Gönder
          </button>
        </form>
        <p className="field-hint">
          Kişisel finans yorumlarında kayıtlı Credentia verilerini kullanır; diğer konularda genel yardımcı asistan gibi yanıt verir.
        </p>
      </div>
    </section>
  );
}
