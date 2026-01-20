import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import type { ImageGenerationInput, ImageGenerationOutput } from './types.js';

const GLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

function getApiKey(): string {
  const key = process.env.GLM_API_KEY;
  if (!key) throw new Error('GLM_API_KEY environment variable is required');
  return key;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateJwtToken(apiKey: string): string {
  const [id, secret] = apiKey.split('.');
  if (!id || !secret) throw new Error('Invalid GLM_API_KEY format. Expected: {id}.{secret}');

  const now = Date.now();
  const header = { alg: 'HS256', sign_type: 'SIGN' };
  const payload = {
    api_key: id,
    exp: now + 3600 * 1000,
    timestamp: now,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret).update(signatureInput).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${headerB64}.${payloadB64}.${signature}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface GlmImageData {
  url?: string;
  b64_json?: string;
}

interface GlmResponse {
  created?: number;
  data?: GlmImageData[];
  error?: { code: string; message: string };
}

const MAX_RETRIES = 3;

export async function generateGlmImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
  const apiKey = getApiKey();
  const token = generateJwtToken(apiKey);

  const body: Record<string, unknown> = {
    model: 'glm-image',
    prompt: input.prompt,
    size: input.size ?? '1280x1280',
  };

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
      const res = await fetch(`${GLM_BASE_URL}/images/generations`, {
        method: 'POST',
        signal: input.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as GlmResponse;

        if (data.error) {
          return {
            saved: false,
            imagePath: input.outputPath,
            errorMessage: `GLM API error: ${data.error.code} - ${data.error.message}`,
          };
        }

        const imageData = data.data?.[0];
        if (!imageData?.url) {
          return {
            saved: false,
            imagePath: input.outputPath,
            errorMessage: 'GLM API: No image URL returned',
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
        console.error(`[glm-image] Rate limited, retrying in ${waitTime / 1000}s...`);
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
    errorMessage: `GLM API error: ${lastError ?? 'Unknown error after retries'}`,
  };
}
