// Провайдер-агностичный слой LLM для генерации JSON.
//
// Зачем: чтобы смена модели/тарифа/провайдера была одной env-переменной,
// а не правкой кода по всему проекту.
//
// ENV:
//   LLM_PROVIDER  — "gemini" | "groq" (по умолчанию "gemini")
//   GEMINI_API_KEY, GEMINI_MODEL (по умолчанию gemini-2.5-flash)
//   GROQ_API_KEY,   GROQ_MODEL   (по умолчанию llama-3.3-70b-versatile)
//
// Отличает временные сбои (обрезанный JSON, 5xx) — их ретраит,
// от исчерпания квоты (429/лимит) — кидает QuotaError, чтобы вызывающий
// корректно остановил батч, а не жёг заведомо провальные запросы.

import { GoogleGenerativeAI } from "@google/generative-ai";

/** Исчерпана квота/лимит — продолжать батч бессмысленно. */
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export interface LlmClient {
  /** Отдаёт распарсенный JSON. Ретраит транзиентное, кидает QuotaError на лимите. */
  generateJSON<T = unknown>(prompt: string): Promise<T>;
}

const RETRIES = 3;

function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 429 || /\b429\b|quota|rate limit|too many requests/i.test(e?.message ?? "");
}

/** Общая retry-обёртка: ретраит транзиент, пробрасывает QuotaError сразу. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isQuotaError(err)) throw new QuotaError(String((err as Error)?.message ?? err));
      lastErr = err; // транзиент (обрезанный JSON, 5xx) — пауза и повтор
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}

// ── Gemini ──────────────────────────────────────────────────────────────────
class GeminiClient implements LlmClient {
  private model;
  constructor(apiKey: string, modelName: string) {
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        // gemini-2.5-flash — thinking-модель: «мышление» съедает output-токены
        // и обрезает JSON. Отключаем, иначе ~половина ответов невалидна.
        thinkingConfig: { thinkingBudget: 0 },
      } as Record<string, unknown>,
    });
  }
  generateJSON<T = unknown>(prompt: string): Promise<T> {
    return withRetry(async () => {
      const res = await this.model.generateContent(prompt);
      return JSON.parse(res.response.text()) as T;
    });
  }
}

// ── OpenAI-совместимый (Groq, OpenRouter, и т.п.) ────────────────────────────
class OpenAICompatClient implements LlmClient {
  constructor(private baseUrl: string, private apiKey: string, private model: string) {}
  generateJSON<T = unknown>(prompt: string): Promise<T> {
    return withRetry(async () => {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new Error(`${res.status} ${body.slice(0, 200)}`) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "";
      return JSON.parse(content) as T;
    });
  }
}

let cached: LlmClient | null = null;

export function getLlm(): LlmClient {
  if (cached) return cached;
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY не задан");
    cached = new GeminiClient(key, process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
    return cached;
  }

  if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY не задан");
    cached = new OpenAICompatClient(
      "https://api.groq.com/openai/v1",
      key,
      process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
    );
    return cached;
  }

  throw new Error(`Неизвестный LLM_PROVIDER: ${provider}`);
}
