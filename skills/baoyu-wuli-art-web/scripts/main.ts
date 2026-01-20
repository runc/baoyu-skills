import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { readFile } from 'node:fs/promises';

import { WuliArtClient } from './client.js';
import { resolveWuliArtCookiePath, resolveWuliArtChromeProfileDir } from './utils/paths.js';
import { resolveModelName, formatModelList, listAvailableModels, DEFAULT_MODEL } from './models.js';

type CliArgs = {
  prompt: string | null;
  promptFiles: string[];
  modelId: string;
  imagePath: string;
  videoPath: string;
  aspectRatio: string;
  resolution: string;
  optimizePrompt: boolean;
  downloadAll: boolean;
  referenceImages: string[];
  referenceUrls: string[];
  videoSeconds: number;
  predictType: string;
  login: boolean;
  listModels: boolean;
  cookiePath: string | null;
  profileDir: string | null;
  help: boolean;
};

function printUsage(cookiePath: string, profileDir: string): void {
  console.log(`Usage:
  # Image generation
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts --prompt "A cute cat" --image cat.png
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts "A cute cat" --image cat.png
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts --promptfiles system.md content.md --image out.png

  # Video generation
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts --prompt "A cat walking" --video cat.mp4
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts --prompt "A cat walking" --video cat.mp4 --video-seconds 5
  npx -y bun skills/baoyu-wuli-art-web/scripts/main.ts --prompt "Animate this" --reference image.png --video output.mp4

Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from one or more files (concatenated in order)
  -m, --model <name>        Model name or alias (default: ${DEFAULT_MODEL})
                            Available models:
${formatModelList()}
                            Image model aliases: qwen, turbo, tongyi, seedream, doubao
                            Video model aliases: video, keling, seedance
  --image <path>            Output image path (for image generation)
  --video <path>            Output video path (for video generation)
  --reference <files...>    Reference images for editing/variation (supports multiple)
  --ref <files...>          Alias for --reference
  --reference-url <urls...> Reference image URLs (OSS URLs, alternative to --reference)
  --ref-url <urls...>       Alias for --reference-url
  --aspect-ratio <ratio>    Aspect ratio: auto, 1:1, 3:4, 4:3, 16:9, 9:16 (default: auto)
  --resolution <res>        Resolution: 1K, 2K, 4K for images; 720P, 1080P for videos (default: 2K/720P)
  --video-seconds <num>     Video duration in seconds (default: 5)
  --predict-type <type>     Prediction type: TEXT_2_VIDEO, FF_2_VIDEO (auto-detected if not specified)
  --no-optimize-prompt      Disable prompt optimization (default: enabled)
  --download-all            Download all generated images (default: first one only)
                            Note: Qwen models generate 4 images,
                                  other models generate 1 image
  --list-models             List all available models and exit
  --login                   Only refresh cookies, then exit
  --cookie-path <path>      Cookie file path (default: ${cookiePath})
  --profile-dir <path>      Chrome profile dir (default: ${profileDir})
  -h, --help                Show help

Env overrides:
  WULI_ART_DATA_DIR, WULI_ART_COOKIE_PATH, WULI_ART_CHROME_PROFILE_DIR, WULI_ART_CHROME_PATH`);
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    prompt: null,
    promptFiles: [],
    modelId: DEFAULT_MODEL,
    imagePath: '',
    videoPath: '',
    aspectRatio: 'auto',
    resolution: '2K',
    optimizePrompt: true,
    downloadAll: false,
    referenceImages: [],
    referenceUrls: [],
    videoSeconds: 5,
    predictType: '',
    login: false,
    listModels: false,
    cookiePath: null,
    profileDir: null,
    help: false,
  };

  const positional: string[] = [];

  const takeMany = (i: number): { items: string[]; next: number } => {
    const items: string[] = [];
    let j = i + 1;
    while (j < argv.length) {
      const v = argv[j]!;
      if (v.startsWith('-')) break;
      items.push(v);
      j++;
    }
    return { items, next: j - 1 };
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === '--help' || a === '-h') {
      out.help = true;
      continue;
    }

    if (a === '--login') {
      out.login = true;
      continue;
    }

    if (a === '--no-optimize-prompt') {
      out.optimizePrompt = false;
      continue;
    }

    if (a === '--download-all') {
      out.downloadAll = true;
      continue;
    }

    if (a === '--list-models') {
      out.listModels = true;
      continue;
    }

    if (a === '--prompt' || a === '-p') {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
      continue;
    }

    if (a === '--promptfiles') {
      const { items, next } = takeMany(i);
      if (items.length === 0) throw new Error('Missing files for --promptfiles');
      out.promptFiles.push(...items);
      i = next;
      continue;
    }

    if (a === '--model' || a === '-m') {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.modelId = v;
      continue;
    }

    if (a === '--image') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --image');
      out.imagePath = v;
      continue;
    }

    if (a === '--video') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --video');
      out.videoPath = v;
      continue;
    }

    if (a === '--aspect-ratio') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --aspect-ratio');
      out.aspectRatio = v;
      continue;
    }

    if (a === '--resolution') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --resolution');
      out.resolution = v;
      continue;
    }

    if (a === '--video-seconds') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --video-seconds');
      out.videoSeconds = parseInt(v, 10);
      if (isNaN(out.videoSeconds) || out.videoSeconds <= 0) {
        throw new Error('--video-seconds must be a positive number');
      }
      continue;
    }

    if (a === '--predict-type') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --predict-type');
      out.predictType = v;
      continue;
    }

    if (a === '--reference' || a === '--ref') {
      const { items, next } = takeMany(i);
      if (items.length === 0) throw new Error(`Missing files for ${a}`);
      out.referenceImages.push(...items);
      i = next;
      continue;
    }

    if (a === '--reference-url' || a === '--ref-url') {
      const { items, next } = takeMany(i);
      if (items.length === 0) throw new Error(`Missing URLs for ${a}`);
      out.referenceUrls.push(...items);
      i = next;
      continue;
    }

    if (a === '--cookie-path') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --cookie-path');
      out.cookiePath = v;
      continue;
    }

    if (a === '--profile-dir') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --profile-dir');
      out.profileDir = v;
      continue;
    }

    if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    }

    positional.push(a);
  }

  if (!out.prompt && out.promptFiles.length === 0 && positional.length > 0) {
    out.prompt = positional.join(' ');
  }

  return out;
}

async function readPromptFromFiles(files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const f of files) {
    parts.push(await readFile(f, 'utf8'));
  }
  return parts.join('\n\n');
}

async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  try {
    const t = await Bun.stdin.text();
    const v = t.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function normalizeOutputImagePath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.png`;
}

function normalizeOutputVideoPath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.mp4`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.cookiePath) process.env.WULI_ART_COOKIE_PATH = args.cookiePath;
  if (args.profileDir) process.env.WULI_ART_CHROME_PROFILE_DIR = args.profileDir;

  const cookiePath = resolveWuliArtCookiePath();
  const profileDir = resolveWuliArtChromeProfileDir();

  if (args.help) {
    printUsage(cookiePath, profileDir);
    return;
  }

  if (args.login) {
    process.env.WULI_ART_LOGIN = '1';
    const c = new WuliArtClient();
    await c.init(true);
    console.log(`Cookie refreshed: ${cookiePath}`);
    return;
  }

  if (args.listModels) {
    console.log('Available models:');
    for (const model of listAvailableModels()) {
      const isDefault = model === DEFAULT_MODEL;
      console.log(`  ${model}${isDefault ? ' (default)' : ''}`);
    }
    return;
  }

  let prompt: string | null = args.prompt;
  if (!prompt && args.promptFiles.length > 0) prompt = await readPromptFromFiles(args.promptFiles);
  if (!prompt) prompt = await readPromptFromStdin();

  if (!prompt) {
    printUsage(cookiePath, profileDir);
    process.exitCode = 1;
    return;
  }

  const isVideoGeneration = !!args.videoPath;
  const isImageGeneration = !!args.imagePath;

  if (!isVideoGeneration && !isImageGeneration) {
    console.error('Error: --image <path> or --video <path> is required');
    process.exitCode = 1;
    return;
  }

  if (isVideoGeneration && isImageGeneration) {
    console.error('Error: Cannot specify both --image and --video');
    process.exitCode = 1;
    return;
  }

  const client = new WuliArtClient();
  await client.init(false);

  const modelName = resolveModelName(args.modelId);

  let inputImageList;
  if (args.referenceImages.length > 0) {
    console.log(`Uploading ${args.referenceImages.length} reference image(s)...`);
    inputImageList = await client.upload_reference_images(args.referenceImages);
    console.log('Reference images uploaded successfully.');
  } else if (args.referenceUrls.length > 0) {
    console.log(`Using ${args.referenceUrls.length} reference URL(s)...`);
    inputImageList = args.referenceUrls.map((url) => ({
      url,
      width: 1024,
      height: 1024,
      imageUrl: url,
    }));
  }

  if (isVideoGeneration) {
    const videoPath = normalizeOutputVideoPath(args.videoPath);
    let predictType: 'TEXT_2_VIDEO' | 'FF_2_VIDEO' | undefined;

    if (args.predictType) {
      if (args.predictType !== 'TEXT_2_VIDEO' && args.predictType !== 'FF_2_VIDEO') {
        console.error('Error: --predict-type must be TEXT_2_VIDEO or FF_2_VIDEO');
        process.exitCode = 1;
        return;
      }
      predictType = args.predictType as 'TEXT_2_VIDEO' | 'FF_2_VIDEO';
    }

    const savedPaths = await client.generate_and_save_video({
      modelName,
      prompt,
      aspectRatio: args.aspectRatio,
      resolution: args.resolution === '2K' ? '720P' : args.resolution,
      optimizePrompt: args.optimizePrompt,
      inputImageList,
      videoTotalSeconds: args.videoSeconds,
      predictType,
      outputPath: videoPath,
      downloadAll: args.downloadAll,
    });

    for (const p of savedPaths) {
      console.log(p);
    }
  } else {
    const imagePath = normalizeOutputImagePath(args.imagePath);

    const savedPaths = await client.generate_and_save_image({
      modelName,
      prompt,
      aspectRatio: args.aspectRatio,
      resolution: args.resolution,
      optimizePrompt: args.optimizePrompt,
      inputImageList,
      outputPath: imagePath,
      downloadAll: args.downloadAll,
    });

    for (const p of savedPaths) {
      console.log(p);
    }
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
