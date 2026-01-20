import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageModelId, ImageGenerationInput, ImageGenerationOutput } from './types.js';

const MODELSCOPE_BASE_URL = 'https://api-inference.modelscope.cn';

function getApiKey(): string {
  const key = process.env.MODELSCOPE_API_KEY;
  if (!key) throw new Error('MODELSCOPE_API_KEY environment variable is required');
  return key;
}

function getModelName(model: ImageModelId): string {
  switch (model) {
    case 'z-image-turbo':
      return 'Tongyi-MAI/Z-Image-Turbo';
    default:
      return 'Tongyi-MAI/Z-Image-Turbo';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TaskResponse {
  task_id?: string;
  task_status?: string;
  output_images?: string[];
  error?: string;
}

export async function generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
  const apiKey = getApiKey();
  const modelName = getModelName(input.model);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-ModelScope-Async-Mode': 'true',
  };

  const createRes = await fetch(`${MODELSCOPE_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    signal: input.signal,
    headers,
    body: JSON.stringify({
      model: modelName,
      prompt: input.prompt,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: `ModelScope API error: ${createRes.status} ${createRes.statusText} - ${text.slice(0, 500)}`,
    };
  }

  const createData = (await createRes.json()) as TaskResponse;
  const taskId = createData.task_id;

  if (!taskId) {
    return {
      saved: false,
      imagePath: input.outputPath,
      errorMessage: 'ModelScope API error: No task_id returned',
    };
  }

  const pollHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-ModelScope-Task-Type': 'image_generation',
  };

  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i += 1) {
    if (input.signal?.aborted) {
      return {
        saved: false,
        imagePath: input.outputPath,
        errorMessage: 'Image generation aborted',
      };
    }

    const pollRes = await fetch(`${MODELSCOPE_BASE_URL}/v1/tasks/${taskId}`, {
      method: 'GET',
      signal: input.signal,
      headers: pollHeaders,
    });

    if (!pollRes.ok) {
      const text = await pollRes.text();
      return {
        saved: false,
        imagePath: input.outputPath,
        errorMessage: `ModelScope poll error: ${pollRes.status} ${pollRes.statusText} - ${text.slice(0, 500)}`,
      };
    }

    const pollData = (await pollRes.json()) as TaskResponse;

    if (pollData.task_status === 'SUCCEED') {
      const imageUrl = pollData.output_images?.[0];
      if (!imageUrl) {
        return {
          saved: false,
          imagePath: input.outputPath,
          errorMessage: 'ModelScope: No output image URL',
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

      const data = new Uint8Array(await imgRes.arrayBuffer());
      await mkdir(path.dirname(input.outputPath), { recursive: true });
      await writeFile(input.outputPath, data);

      return { saved: true, imagePath: input.outputPath };
    }

    if (pollData.task_status === 'FAILED') {
      return {
        saved: false,
        imagePath: input.outputPath,
        errorMessage: `ModelScope: Image generation failed - ${pollData.error ?? 'Unknown error'}`,
      };
    }

    await sleep(3000);
  }

  return {
    saved: false,
    imagePath: input.outputPath,
    errorMessage: 'ModelScope: Image generation timed out',
  };
}
