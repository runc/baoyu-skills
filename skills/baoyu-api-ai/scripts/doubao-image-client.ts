import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageGenerationInput, ImageGenerationOutput } from './types.js';

const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

function getApiKey(): string {
  const key = process.env.DOUBAO_API_KEY;
  if (!key) throw new Error('DOUBAO_API_KEY environment variable is required');
  return key;
}

interface DoubaoImageData {
  url?: string;
  b64_json?: string;
  size?: string;
  error?: { code: string; message: string };
}

interface DoubaoResponse {
  model?: string;
  created?: number;
  data?: DoubaoImageData[];
  error?: { code: string; message: string };
}

export async function generateDoubaoImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model: 'doubao-seedream-4-5-251128',
    prompt: input.prompt,
    size: input.size ?? '2048x2048',
    response_format: 'url',
    watermark: false,
    sequential_image_generation: 'disabled',
  };

  const res = await fetch(`${DOUBAO_BASE_URL}/images/generations`, {
    method: 'POST',
    signal: input.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: `Doubao API error: ${res.status} ${res.statusText} - ${text.slice(0, 500)}`,
    };
  }

  const data = (await res.json()) as DoubaoResponse;

  if (data.error) {
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: `Doubao API error: ${data.error.code} - ${data.error.message}`,
    };
  }

  const imageData = data.data?.[0];
  if (!imageData) {
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: 'Doubao API: No image data returned',
    };
  }

  if (imageData.error) {
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: `Doubao image error: ${imageData.error.code} - ${imageData.error.message}`,
    };
  }

  const imageUrl = imageData.url;
  if (!imageUrl) {
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: 'Doubao API: No image URL returned',
    };
  }

  const imgRes = await fetch(imageUrl, { signal: input.signal });
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
