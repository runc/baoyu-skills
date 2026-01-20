import type { TextModelId, TextGenerationInput, TextGenerationOutput, ChatMessage } from './types.js';

const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1';

function getApiKey(): string {
  const key = process.env.MIMO_API_KEY;
  if (!key) throw new Error('MIMO_API_KEY environment variable is required');
  return key;
}

function getModelName(model: TextModelId): string {
  switch (model) {
    case 'mimo-v2-flash':
      return 'mimo-v2-flash';
    default:
      return 'mimo-v2-flash';
  }
}

export async function generateText(input: TextGenerationInput): Promise<TextGenerationOutput> {
  const apiKey = getApiKey();
  const modelName = getModelName(input.model);

  const messages: ChatMessage[] = [{ role: 'user', content: input.prompt }];

  const res = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: input.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      text: '',
      model: input.model,
      errorMessage: `MiMo API error: ${res.status} ${res.statusText} - ${text.slice(0, 500)}`,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      }
    : undefined;

  return { text: content, model: input.model, usage };
}

export async function generateTextWithMessages(
  messages: ChatMessage[],
  model: TextModelId,
  signal?: AbortSignal,
): Promise<TextGenerationOutput> {
  const apiKey = getApiKey();
  const modelName = getModelName(model);

  const res = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      text: '',
      model,
      errorMessage: `MiMo API error: ${res.status} ${res.statusText} - ${text.slice(0, 500)}`,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      }
    : undefined;

  return { text: content, model, usage };
}
