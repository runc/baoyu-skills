import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageGenerationInput, ImageGenerationOutput } from './types.js';

const NANO_BANANA_ENDPOINT = 'https://api.bltcy.ai/v1/images/generations';

function getApiKey(): string {
  const key = process.env.NANO_BANANA_API_KEY;
  if (!key) throw new Error('NANO_BANANA_API_KEY environment variable is required');
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NanoBananaResponse {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message: string; code?: string };
}

const MAX_RETRIES = 3;

export async function generateNanoBananaImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model: 'nano-banana',
    prompt: input.prompt,
  };

  if (input.size) {
    body.size = input.size;
  }

  let lastError: string | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (input.signal?.aborted) {
      return {
        saved: false,
        imagePath: input.outputPath,
        errorMessage: 'Image generation aborted',
      };
    }

    try {
      const res = await fetch(NANO_BANANA_ENDPOINT, {
        method: 'POST',
        signal: input.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as NanoBananaResponse;

        if (data.error) {
          return {
            saved: false,
            imagePath: input.outputPath,
            errorMessage: `Nano Banana API error: ${data.error.code ?? 'unknown'} - ${data.error.message}`,
          };
        }

        const imageData = data.data?.[0];
        if (!imageData?.url) {
          return {
            saved: false,
            imagePath: input.outputPath,
            errorMessage: 'Nano Banana API: No image URL returned',
          };
        }

        const imgRes = await fetch(imageData.url, { signal: input.signal });
        if (!imgRes.ok) {
          return {
            saved: false,
            imagePath: input.outputPath,
            errorMessage: `Failed to download image: ${imgRes.status}`,
          };
        }

        const imgData = new Uint8Array(await imgRes.arrayBuffer());
        await mkdir(path.dirname(input.outputPath), { recursive: true });
        await writeFile(input.outputPath, imgData);

        return { saved: true, imagePath: input.outputPath };
      }

      const errorText = await res.text();
      lastError = `HTTP ${res.status}: ${errorText.slice(0, 200)}`;

      if (res.status === 429) {
        const waitTime = 2 ** (attempt + 1) * 1000;
        console.error(`[nano-banana] Rate limited, retrying in ${waitTime / 1000}s...`);
        await sleep(waitTime);
        continue;
      }

      if (res.status >= 500) {
        await sleep(1000);
        continue;
      }

      break;
    } catch (err) {
      if (input.signal?.aborted) {
        return {
          saved: false,
          imagePath: input.outputPath,
          errorMessage: 'Image generation aborted',
        };
      }
      lastError = err instanceof Error ? err.message : String(err);
      await sleep(1000);
    }
  }

  return {
    saved: false,
    imagePath: input.outputPath,
    errorMessage: `Nano Banana API error: ${lastError ?? 'Unknown error after retries'}`,
  };
}
