import fs from 'node:fs';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { load_browser_cookies, type CookieMap } from './utils/load-browser-cookies.js';
import { uploadImageToWuliArt } from './utils/upload-image.js';
import { DEFAULT_MODEL } from './models.js';

export type InputImage = {
  url: string;
  width: number;
  height: number;
  imageUrl: string;
};

export type GenerateOptions = {
  modelName?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  prompt: string;
  aspectRatio?: string;
  optimizePrompt?: boolean;
  resolution?: string;
  inputImageList?: InputImage[];
  videoTotalSeconds?: number;
  predictType?: 'TEXT_2_VIDEO' | 'FF_2_VIDEO';
};

export type GenerateImageOptions = GenerateOptions;

export type ImageResult = {
  imageId: string;
  imageUrl: string;
  status: string;
  progress: number | null;
  errorMsg: string | null;
  star: number;
};

export type VideoResult = {
  videoId?: string;
  imageId?: string;
  videoUrl?: string;
  imageUrl?: string;
  status: string;
  progress: number | null;
  errorMsg: string | null;
  coverUrl?: string;
  star?: number;
};

export type GenerateResponse = {
  recordId: string;
  status: string;
  images?: ImageResult[];
  videos?: VideoResult[];
};

export type GenerateImageResponse = GenerateResponse;

export class WuliArtClient {
  private cookies: CookieMap = {};
  private initialized = false;

  async init(verbose: boolean = false): Promise<void> {
    if (this.initialized) return;
    this.cookies = await load_browser_cookies(verbose);
    this.initialized = true;
  }

  async generate_image(opts: GenerateOptions): Promise<GenerateResponse> {
    if (!this.initialized) {
      throw new Error('WuliArtClient not initialized. Call init() first.');
    }

    const cookieString = Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const mediaType = opts.mediaType || 'IMAGE';
    const body: any = {
      modelName: opts.modelName || DEFAULT_MODEL,
      mediaType,
      prompt: opts.prompt,
      inputImageList: opts.inputImageList || [],
      inputVideoList: [],
      aspectRatio: opts.aspectRatio || 'auto',
      optimizePrompt: opts.optimizePrompt ?? true,
      resolution: opts.resolution || '2K',
    };

    if (mediaType === 'VIDEO') {
      body.videoTotalSeconds = opts.videoTotalSeconds || 5;
      body.predictType = opts.predictType || 'FF_2_VIDEO';
    }

    const res = await fetch('https://wuli.art/api/v1/predict/submit', {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,en-US;q=0.9,en-GB;q=0.8,zh-CN;q=0.7,zh;q=0.6',
        'bx-v': '2.5.36',
        'content-type': 'application/json',
        'cookie': cookieString,
        'priority': 'u=1, i',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'Referer': 'https://wuli.art/generate',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response');
      throw new Error(`Wuli Art API error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = (await res.json()) as any;

    if (!data.success) {
      throw new Error(`API returned error: ${data.msg || data.userMsg || 'Unknown error'}`);
    }

    const recordId = data?.data?.recordId;

    if (!recordId) {
      throw new Error(`No recordId returned from Wuli Art API: ${JSON.stringify(data)}`);
    }

    return {
      recordId,
      status: 'submitted',
    };
  }

  async poll_task_status(recordId: string, maxWaitMs: number = 120_000): Promise<GenerateResponse> {
    if (!this.initialized) {
      throw new Error('WuliArtClient not initialized. Call init() first.');
    }

    const cookieString = Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const res = await fetch(`https://wuli.art/api/v1/predict/query?recordId=${recordId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'cookie': cookieString,
          'Referer': 'https://wuli.art/generate',
        },
      });

      if (!res.ok) {
        throw new Error(`Wuli Art query API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as any;

      if (!data.success) {
        throw new Error(`Query API returned error: ${data.msg || data.userMsg || 'Unknown error'}`);
      }

      const recordStatus = data?.data?.recordStatus;
      const results = data?.data?.results;
      const mediaType = data?.data?.mediaType;

      if (recordStatus === 'SUCCEED' || recordStatus === 'COMPLETED') {
        if (mediaType === 'VIDEO') {
          return {
            recordId,
            status: 'completed',
            videos: results || [],
          };
        } else {
          return {
            recordId,
            status: 'completed',
            images: results || [],
          };
        }
      }

      if (recordStatus === 'FAILED' || recordStatus === 'ERROR') {
        throw new Error(`Task failed with status: ${recordStatus}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error(`Task polling timeout after ${maxWaitMs}ms`);
  }

  async upload_reference_images(filePaths: string[]): Promise<InputImage[]> {
    if (!this.initialized) {
      throw new Error('WuliArtClient not initialized. Call init() first.');
    }

    const inputImages: InputImage[] = [];

    for (const filePath of filePaths) {
      const uploaded = await uploadImageToWuliArt(filePath, this.cookies);
      inputImages.push({
        url: uploaded.url,
        width: uploaded.width,
        height: uploaded.height,
        imageUrl: uploaded.url,
      });
    }

    return inputImages;
  }

  async download_image(imageUrl: string, outputPath: string): Promise<string> {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    const dir = path.dirname(outputPath);
    await mkdir(dir, { recursive: true });
    await writeFile(outputPath, new Uint8Array(buffer));

    return outputPath;
  }

  async download_video(videoUrl: string, outputPath: string): Promise<string> {
    const res = await fetch(videoUrl);
    if (!res.ok) {
      throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    const dir = path.dirname(outputPath);
    await mkdir(dir, { recursive: true });
    await writeFile(outputPath, new Uint8Array(buffer));

    return outputPath;
  }

  async generate_and_save(opts: GenerateOptions & { outputPath: string; downloadAll?: boolean }): Promise<string[]> {
    const submitResult = await this.generate_image(opts);
    const result = await this.poll_task_status(submitResult.recordId);

    const savedPaths: string[] = [];

    if (result.videos && result.videos.length > 0) {
      if (opts.downloadAll) {
        for (let i = 0; i < result.videos.length; i++) {
          const video = result.videos[i]!;
          if (video.status !== 'SUCCEED') continue;

          const videoUrl = video.videoUrl || video.imageUrl;
          if (!videoUrl) continue;

          const ext = path.extname(opts.outputPath);
          const base = opts.outputPath.slice(0, -ext.length);
          const outputPath = result.videos.length > 1 ? `${base}-${i + 1}${ext}` : opts.outputPath;

          const savedPath = await this.download_video(videoUrl, outputPath);
          savedPaths.push(savedPath);
        }
      } else {
        const firstSucceed = result.videos.find((video) => video.status === 'SUCCEED');
        if (!firstSucceed) {
          throw new Error('No successful video in results.');
        }

        const videoUrl = firstSucceed.videoUrl || firstSucceed.imageUrl;
        if (!videoUrl) {
          throw new Error('Video result missing URL field');
        }

        const savedPath = await this.download_video(videoUrl, opts.outputPath);
        savedPaths.push(savedPath);
      }
    } else if (result.images && result.images.length > 0) {
      if (opts.downloadAll) {
        for (let i = 0; i < result.images.length; i++) {
          const img = result.images[i]!;
          if (img.status !== 'SUCCEED') continue;

          const ext = path.extname(opts.outputPath);
          const base = opts.outputPath.slice(0, -ext.length);
          const outputPath = result.images.length > 1 ? `${base}-${i + 1}${ext}` : opts.outputPath;

          const savedPath = await this.download_image(img.imageUrl, outputPath);
          savedPaths.push(savedPath);
        }
      } else {
        const firstSucceed = result.images.find((img) => img.status === 'SUCCEED');
        if (!firstSucceed) {
          throw new Error('No successful image in results.');
        }

        const savedPath = await this.download_image(firstSucceed.imageUrl, opts.outputPath);
        savedPaths.push(savedPath);
      }
    } else {
      throw new Error('No images or videos returned from task.');
    }

    return savedPaths;
  }

  async generate_and_save_image(opts: GenerateImageOptions & { outputPath: string; downloadAll?: boolean }): Promise<string[]> {
    return this.generate_and_save(opts);
  }

  async generate_and_save_video(opts: GenerateOptions & { outputPath: string; downloadAll?: boolean }): Promise<string[]> {
    return this.generate_and_save({ ...opts, mediaType: 'VIDEO' });
  }
}
