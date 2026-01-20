---
name: api-ai
description: AI content generation using third-party APIs. Text generation via Xiaomi MiMo (OpenAI-compatible), image generation via ModelScope Z-Image or Doubao Seedream.
---

# API AI Client

## Quick start

```bash
npx -y bun scripts/main.ts "Hello, AI"
npx -y bun scripts/main.ts --prompt "Explain quantum computing"
npx -y bun scripts/main.ts --prompt "A cute cat" --image cat.png
npx -y bun scripts/main.ts --promptfiles system.md content.md
```

## Commands

### Text generation

```bash
# Simple prompt (positional)
npx -y bun scripts/main.ts "Your prompt here"

# Explicit prompt flag
npx -y bun scripts/main.ts --prompt "Your prompt here"
npx -y bun scripts/main.ts -p "Your prompt here"

# With model selection
npx -y bun scripts/main.ts -p "Hello" -m mimo-v2-flash

# Pipe from stdin
echo "Summarize this" | npx -y bun scripts/main.ts
```

### Image generation

```bash
# Generate image with default path (./generated.png)
npx -y bun scripts/main.ts --prompt "A sunset over mountains" --image

# Generate image with custom path
npx -y bun scripts/main.ts --prompt "A cute robot" --image robot.png

# High quality image with Doubao Seedream
npx -y bun scripts/main.ts --prompt "A dragon" --image dragon.png --image-model doubao-seedream-4.5 --size 2048x2048

# Shorthand
npx -y bun scripts/main.ts "A dragon" --image=dragon.png
```

### Output formats

```bash
# Plain text (default)
npx -y bun scripts/main.ts "Hello"

# JSON output
npx -y bun scripts/main.ts "Hello" --json
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--prompt <text>` | `-p` | Prompt text |
| `--promptfiles <files...>` | | Read prompt from files (concatenated in order) |
| `--model <id>` | `-m` | Text model: mimo-v2-flash (default) |
| `--image-model <id>` | | Image model: z-image-turbo (default), doubao-seedream-4.5, nano-banana-pro, glm-image |
| `--size <WxH>` | | Image size for Doubao (e.g., 2048x2048, 1440x2560) |
| `--image [path]` | | Generate image, save to path (default: generated.png) |
| `--json` | | Output as JSON |
| `--help` | `-h` | Show help |

## Image Model Selection Guide

Choose image model based on your requirements:

| Scenario | Model | Rationale |
|----------|-------|-----------|
| Batch generation (5+ images) | `z-image-turbo` | Fast, cost-effective |
| Prototyping / drafts | `z-image-turbo` | Quick iteration |
| Illustrations for articles | `z-image-turbo` | Good enough quality, fast |
| Cover images / hero images | `doubao-seedream-4.5` | High quality, detailed |
| Marketing / social media | `doubao-seedream-4.5` | Professional finish |
| Print / publication | `doubao-seedream-4.5` | Best quality, large size |
| Fine art / detailed scenes | `doubao-seedream-4.5` | Superior detail rendering |

### Summary
- **z-image-turbo**: Fast, high volume, acceptable quality → DEFAULT
- **doubao-seedream-4.5**: Slower, premium quality, detailed output

## Models

### Text Models (Xiaomi MiMo)
- `mimo-v2-flash` - Default, fast and capable

### Image Models

| Model | Provider | Speed | Quality | Best For |
|-------|----------|-------|---------|----------|
| `z-image-turbo` | ModelScope | ⚡ Fast | Good | Batch, drafts, illustrations |
| `doubao-seedream-4.5` | Doubao | 🐢 Slower | Excellent | Covers, marketing, print |
| `nano-banana-pro` | Nano Banana | ⚡ Fast | Excellent | High-quality with retry |
| `glm-image` | 智谱 BigModel | ⚡ Fast | Good | Chinese prompts, 1280x1280 |

#### Doubao Seedream Recommended Sizes

| Aspect Ratio | Size |
|--------------|------|
| 1:1 | 2048x2048 |
| 4:3 | 2304x1728 |
| 3:4 | 1728x2304 |
| 16:9 | 2560x1440 |
| 9:16 | 1440x2560 |
| 3:2 | 2496x1664 |
| 2:3 | 1664x2496 |
| 21:9 | 3024x1296 |

## Environment variables

| Variable | Description |
|----------|-------------|
| `MIMO_API_KEY` | Xiaomi MiMo API key |
| `MODELSCOPE_API_KEY` | ModelScope API key (for z-image-turbo) |
| `DOUBAO_API_KEY` | Doubao API key (for doubao-seedream-4.5) |
| `NANO_BANANA_API_KEY` | Nano Banana API key (for nano-banana-pro) |
| `GLM_API_KEY` | 智谱 BigModel API key (for glm-image) |

### Auto-load from .env

Before running the script, load environment variables:

```bash
source /Users/timus/Dev/github/baoyu-skills/.env && npx -y bun scripts/main.ts "Hello"
```

## Examples

### Generate text response
```bash
npx -y bun scripts/main.ts "What is the capital of France?"
```

### Generate image (fast, default)
```bash
npx -y bun scripts/main.ts "A photorealistic image of a golden retriever puppy" --image puppy.png
```

### Generate high-quality cover image
```bash
npx -y bun scripts/main.ts "Elegant minimalist book cover with abstract geometric shapes" --image cover.png --image-model doubao-seedream-4.5 --size 1664x2496
```

### Get JSON output for parsing
```bash
npx -y bun scripts/main.ts "Hello" --json | jq '.text'
```

### Generate with prompt files
```bash
npx -y bun scripts/main.ts --promptfiles system.md content.md
```
