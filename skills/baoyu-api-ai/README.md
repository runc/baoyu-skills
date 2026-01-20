# API AI

AI content generation using third-party APIs.

- **Text**: Xiaomi MiMo (OpenAI-compatible) (https://platform.xiaomimimo.com/#/docs/api/text-generation/openai-api)
- **Image**: ModelScope Z-Image (https://modelscope.cn/models/Tongyi-MAI/Z-Image-Turbo)

## Setup

```bash
export MIMO_API_KEY="your-mimo-key"
export MODELSCOPE_API_KEY="your-modelscope-key"
```

## Usage

```bash
# Text generation
npx -y bun skills/api-ai/scripts/main.ts "Hello"

# Image generation
npx -y bun skills/api-ai/scripts/main.ts "A cat" --image cat.png

# From files
npx -y bun skills/api-ai/scripts/main.ts --promptfiles system.md content.md

# JSON output
npx -y bun skills/api-ai/scripts/main.ts "Hello" --json
```

## Structure

```
scripts/
├── main.ts          # CLI entry
├── text-client.ts   # MiMo API
├── image-client.ts  # ModelScope API
├── types.ts         # Type definitions
└── index.ts         # Exports
```
