import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { generateText } from './text-client.js';
import { generateImage } from './image-client.js';
import { generateDoubaoImage } from './doubao-image-client.js';
import { generateNanoBananaImage } from './nano-banana-image-client.js';
import { generateGlmImage } from './glm-image-client.js';
import type { TextModelId, ImageModelId } from './types.js';

function printUsage(exitCode = 0): never {
  console.log(`Usage:
  npx -y bun skills/api-ai/scripts/main.ts --prompt "Hello"
  npx -y bun skills/api-ai/scripts/main.ts "Hello"
  npx -y bun skills/api-ai/scripts/main.ts --prompt "A cute cat" --image generated.png
  npx -y bun skills/api-ai/scripts/main.ts --promptfiles system.md content.md

Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from one or more files (concatenated in order)
  -m, --model <id>          Text model: mimo-v2-flash (default)
  --image-model <id>        Image model: z-image-turbo, doubao-seedream-4.5, nano-banana-pro, glm-image
  --size <WxH>              Image size (e.g., 2048x2048, 1440x2560)
  --json                    Output JSON
  --image [path]            Generate an image and save it (default: ./generated.png)
  -h, --help                Show help

Environment variables:
  MIMO_API_KEY              Xiaomi MiMo API key (required for text generation)
  MODELSCOPE_API_KEY        ModelScope API key (required for z-image-turbo)
  DOUBAO_API_KEY            Doubao API key (required for doubao-seedream-4.5)
  NANO_BANANA_API_KEY       Nano Banana API key (required for nano-banana-pro)
  GLM_API_KEY               GLM API key (required for glm-image)
`);

  process.exit(exitCode);
}

async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? text : null;
}

function readPromptFiles(filePaths: string[]): string {
  const contents: string[] = [];
  for (const filePath of filePaths) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Prompt file not found: ${resolved}`);
    }
    const content = fs.readFileSync(resolved, 'utf8').trim();
    contents.push(content);
  }
  return contents.join('\n\n');
}

function parseArgs(argv: string[]): {
  prompt?: string;
  promptFiles?: string[];
  model?: string;
  imageModel?: string;
  size?: string;
  json?: boolean;
  imagePath?: string;
} {
  const out: ReturnType<typeof parseArgs> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (arg === '--help' || arg === '-h') printUsage(0);
    if (arg === '--json') {
      out.json = true;
      continue;
    }
    if (arg === '--image' || arg === '--generate-image') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        out.imagePath = next;
        i += 1;
      } else {
        out.imagePath = 'generated.png';
      }
      continue;
    }
    if (arg.startsWith('--image=')) {
      out.imagePath = arg.slice('--image='.length);
      continue;
    }
    if (arg === '--prompt' || arg === '-p') {
      out.prompt = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (arg.startsWith('--prompt=')) {
      out.prompt = arg.slice('--prompt='.length);
      continue;
    }
    if (arg === '--promptfiles') {
      out.promptFiles = [];
      while (i + 1 < argv.length) {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          out.promptFiles.push(next);
          i += 1;
        } else {
          break;
        }
      }
      continue;
    }
    if (arg === '--model' || arg === '-m') {
      out.model = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (arg.startsWith('--model=')) {
      out.model = arg.slice('--model='.length);
      continue;
    }
    if (arg === '--image-model') {
      out.imageModel = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (arg.startsWith('--image-model=')) {
      out.imageModel = arg.slice('--image-model='.length);
      continue;
    }
    if (arg === '--size') {
      out.size = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (arg.startsWith('--size=')) {
      out.size = arg.slice('--size='.length);
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  if (!out.prompt && positional.length > 0) {
    out.prompt = positional.join(' ').trim();
  }

  if (out.prompt != null) out.prompt = out.prompt.trim();
  if (out.model != null) out.model = out.model.trim();
  if (out.imageModel != null) out.imageModel = out.imageModel.trim();
  if (out.size != null) out.size = out.size.trim();
  if (out.imagePath != null) out.imagePath = out.imagePath.trim();

  if (out.imagePath === '') delete out.imagePath;
  if (out.promptFiles?.length === 0) delete out.promptFiles;

  return out;
}

function resolveTextModel(value: string | undefined): TextModelId {
  const desired = (value ?? '').trim();
  if (!desired) return 'mimo-v2-flash';
  switch (desired) {
    case 'mimo-v2-flash':
      return 'mimo-v2-flash';
    default:
      console.error(`[api-ai] Unsupported text model "${desired}", falling back to mimo-v2-flash.`);
      return 'mimo-v2-flash';
  }
}

function resolveImageModel(value: string | undefined): ImageModelId {
  const desired = (value ?? '').trim();
  if (!desired) return 'z-image-turbo';
  switch (desired) {
    case 'z-image-turbo':
      return 'z-image-turbo';
    case 'doubao-seedream-4.5':
    case 'doubao-seedream-4-5':
    case 'seedream':
    case 'doubao':
      return 'doubao-seedream-4.5';
    case 'nano-banana-pro':
    case 'nano-banana':
    case 'banana':
      return 'nano-banana-pro';
    case 'glm-image':
    case 'glm':
      return 'glm-image';
    default:
      console.error(`[api-ai] Unsupported image model "${desired}", falling back to z-image-turbo.`);
      return 'z-image-turbo';
  }
}

function resolveImageOutputPath(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  const raw = trimmed || 'generated.png';
  const resolved = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);

  if (resolved.endsWith(path.sep)) return path.join(resolved, 'generated.png');
  try {
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return path.join(resolved, 'generated.png');
    }
  } catch {
    // ignore
  }
  return resolved;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const promptFromStdin = await readPromptFromStdin();
  const promptFromFiles = args.promptFiles ? readPromptFiles(args.promptFiles) : null;
  const prompt = promptFromFiles || args.prompt || promptFromStdin;
  if (!prompt) printUsage(1);

  const textModel = resolveTextModel(args.model);
  const imageModel = resolveImageModel(args.imageModel);
  const imagePath = resolveImageOutputPath(args.imagePath);

  if (imagePath) {
    let generateFn = generateImage;
    if (imageModel === 'doubao-seedream-4.5') {
      generateFn = generateDoubaoImage;
    } else if (imageModel === 'nano-banana-pro') {
      generateFn = generateNanoBananaImage;
    } else if (imageModel === 'glm-image') {
      generateFn = generateGlmImage;
    }
    const result = await generateFn({
      prompt,
      model: imageModel,
      outputPath: imagePath,
      size: args.size,
    });

    if (args.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.errorMessage) process.exit(1);
      return;
    }

    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }

    process.stdout.write(`Saved image to: ${result.imagePath}\n`);
    return;
  }

  const result = await generateText({
    prompt,
    model: textModel,
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.errorMessage) process.exit(1);
    return;
  }

  if (result.errorMessage) {
    throw new Error(result.errorMessage);
  }

  process.stdout.write(result.text);
  if (!result.text.endsWith('\n')) process.stdout.write('\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
