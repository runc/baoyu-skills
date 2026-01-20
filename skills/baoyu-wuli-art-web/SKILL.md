---
name: baoyu-wuli-art-web
description: Image and video generation skill using Wuli.Art API. Supports text-to-image, text-to-video, and image-to-video generation with multiple models including Qwen, Tongyi Wanxiang, and Seedream.
---
# Wuli.Art Client

AI-powered image and video generation using Wuli.Art platform (wuli.art).

## Features

- **Text-to-Image**: Generate images from text prompts
- **Text-to-Video**: Generate videos from text descriptions
- **Image-to-Video**: Animate static images into videos
- **Reference Images**: Use reference images for editing and variations
- **Multiple Models**: Qwen Image, Tongyi Wanxiang, Seedream (Doubao)
- **Batch Download**: Download all generated results (Qwen models generate 4 images)

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:

1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`
3. Replace all `${SKILL_DIR}` in this document with the actual path

**Script Reference**:

| Script                | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `scripts/main.ts`   | CLI entry point for image/video generation              |
| `scripts/client.ts` | WuliArtClient class for API interaction                 |
| `scripts/models.ts` | Model definitions and aliases                           |
| `scripts/utils/*`   | Utility functions (cookie loading, image upload, paths) |

## Quick Start

```bash
# Image generation
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A cute cat" --image cat.png
npx -y bun ${SKILL_DIR}/scripts/main.ts "A sunset over mountains" --image sunset.png

# Video generation
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A cat walking" --video cat.mp4
npx -y bun ${SKILL_DIR}/scripts/main.ts "Ocean waves at sunset" --video ocean.mp4 --video-seconds 5
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Dancing" --video dance.mp4 --model keling

# Image-to-video (animate an image)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Animate this" --reference image.png --video output.mp4

# From prompt files
npx -y bun ${SKILL_DIR}/scripts/main.ts --promptfiles system.md content.md --image out.png
```

## Commands

### Image Generation

```bash
# Simple prompt (positional)
npx -y bun ${SKILL_DIR}/scripts/main.ts "A photorealistic cat" --image cat.png

# Explicit prompt flag
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A cute robot" --image robot.png
npx -y bun ${SKILL_DIR}/scripts/main.ts -p "A dragon" --image dragon.png

# With model selection
npx -y bun ${SKILL_DIR}/scripts/main.ts -p "A sunset" -m qwen --image sunset.png

# Download all images (Qwen models generate 4 images)
npx -y bun ${SKILL_DIR}/scripts/main.ts -p "A cat" -m qwen --image cat.png --download-all
# Output: cat-1.png, cat-2.png, cat-3.png, cat-4.png

# With reference images (editing/variation)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Make it blue" --reference original.png --image edited.png
```

### Video Generation

```bash
# Text-to-video (default: 5 seconds)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A cat walking in the garden" --video cat.mp4

# Custom duration
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Ocean waves" --video ocean.mp4 --video-seconds 10

# Image-to-video (animate an image)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Animate this portrait" --reference photo.png --video animated.mp4

# Explicit prediction type
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A flying bird" --video bird.mp4 --predict-type FF_2_VIDEO

# Video with custom resolution
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A sunset timelapse" --video sunset.mp4 --resolution 1080P
```

### Other Commands

```bash
# Pipe from stdin
echo "A beautiful landscape" | npx -y bun ${SKILL_DIR}/scripts/main.ts --image landscape.png

# Read prompt from multiple files
npx -y bun ${SKILL_DIR}/scripts/main.ts --promptfiles system.md style.md content.md --image output.png

# List available models
npx -y bun ${SKILL_DIR}/scripts/main.ts --list-models

# Refresh authentication cookies
npx -y bun ${SKILL_DIR}/scripts/main.ts --login
```

## Options

| Option                                                 | Description                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `-p, --prompt <text>`                                | Prompt text                                                                  |
| `--promptfiles <files...>`                           | Read prompt from one or more files (concatenated in order)                   |
| `-m, --model <name>`                                 | Model name or alias (default: Seedream 4.5)                                  |
| `--image <path>`                                     | Output image path (for image generation)                                     |
| `--video <path>`                                     | Output video path (for video generation)                                     |
| `--reference <files...>`, `--ref <files...>`       | Reference images for editing/variation (supports multiple)                   |
| `--reference-url <urls...>`, `--ref-url <urls...>` | Reference image URLs (OSS URLs, alternative to --reference)                  |
| `--aspect-ratio <ratio>`                             | Aspect ratio: auto, 1:1, 3:4, 4:3, 16:9, 9:16 (default: auto)                |
| `--resolution <res>`                                 | Resolution: 1K, 2K, 4K for images; 720P, 1080P for videos (default: 2K/720P) |
| `--video-seconds <num>`                              | Video duration in seconds (default: 5)                                       |
| `--predict-type <type>`                              | Prediction type: TEXT_2_VIDEO, FF_2_VIDEO (default: FF_2_VIDEO)              |
| `--no-optimize-prompt`                               | Disable prompt optimization (default: enabled)                               |
| `--download-all`                                     | Download all generated images (default: first one only)                      |
| `--list-models`                                      | List all available models and exit                                           |
| `--login`                                            | Refresh cookies only, then exit                                              |
| `--cookie-path <path>`                               | Custom cookie file path                                                      |
| `--profile-dir <path>`                               | Chrome profile directory                                                     |
| `-h, --help`                                         | Show help                                                                    |

**Note**: Cannot specify both `--image` and `--video` in the same command.

## Models

### Image Generation Models

| Model            | Outputs  | Notes                                           |
| ---------------- | -------- | ----------------------------------------------- |
| Qwen Image 25.08 | 4 images | Low quality                                     |
| Qwen Image Turbo | 4 images | Fast generation                                 |
| 通义万相 2.6     | 1 image  | Chinese AI model, supports both image and video |
| Seedream 4.5     | 1 image  | Default, Doubao (ByteDance), High quality      |
| Seedream 4.0     | 1 image  | Doubao (ByteDance)                              |

### Video Generation Models

| Model              | Supports      | Notes                         |
| ------------------ | ------------- | ----------------------------- |
| 通义万相 2.2 Turbo | Video + Image | Default video model, Alibaba  |
| 通义万相 2.6       | Video + Image | Alibaba, latest version       |
| 可灵 O1            | Video + Image | Kuaishou (快手), OpenAI-style |
| 可灵 2.6           | Video + Image | Kuaishou (快手)               |
| 可灵 2.5 Turbo     | Video + Image | Kuaishou (快手), fast         |
| Seedance 1.5 Pro   | Video + Image | ByteDance (字节跳动)          |
| Seedance 1.0 Pro   | Video + Image | ByteDance (字节跳动)          |

**Aliases**:

*Image Models:*

- `qwen`, `qwen-image`, `qwen-image-25.08` → Qwen Image 25.08
- `turbo`, `qwen-turbo`, `qwen-image-turbo` → Qwen Image Turbo
- `tongyi`, `tongyi-wanxiang`, `wanxiang`, `tongyi-2.6` → 通义万相 2.6
- `seedream`, `seedream-4.5`, `doubao`, `doubao-4.5` → Seedream 4.5
- `seedream-4.0`, `doubao-4.0` → Seedream 4.0

*Video Models:*

- `tongyi-2.2`, `tongyi-2.2-turbo`, `tongyi-turbo`, `video` → 通义万相 2.2 Turbo (default video model)
- `keling`, `keling-o1` → 可灵 O1
- `keling-2.6` → 可灵 2.6
- `keling-2.5`, `keling-2.5-turbo`, `keling-turbo` → 可灵 2.5 Turbo
- `seedance`, `seedance-1.5`, `seedance-1.5-pro` → Seedance 1.5 Pro
- `seedance-1.0`, `seedance-1.0-pro` → Seedance 1.0 Pro

## Authentication

First run opens Chrome to authenticate with Wuli.Art using your browser cookies. Cookies are cached for subsequent runs.

**Supported browsers** (auto-detected in order):

- Google Chrome
- Google Chrome Canary / Beta
- Chromium
- Microsoft Edge

**Manual cookie refresh**:

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts --login
```

**Custom browser path**:

```bash
WULI_ART_CHROME_PATH=/path/to/chrome npx -y bun ${SKILL_DIR}/scripts/main.ts --login
```

## Environment Variables

| Variable                        | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `WULI_ART_DATA_DIR`           | Data directory (default: platform-specific) |
| `WULI_ART_COOKIE_PATH`        | Cookie file path                            |
| `WULI_ART_CHROME_PROFILE_DIR` | Chrome profile directory                    |
| `WULI_ART_CHROME_PATH`        | Chrome executable path                      |

## Examples

### Generate high-quality images

```bash
# Single image with Tongyi Wanxiang
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A serene Japanese garden with koi pond" --model tongyi --image garden.png

# Multiple variations with Qwen (generates 4 images)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A futuristic cityscape at night" --model qwen --image city.png --download-all
# Output: city-1.png, city-2.png, city-3.png, city-4.png
```

### Generate videos

```bash
# Text-to-video (default: 通义万相 2.2 Turbo)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A cat playing with a ball of yarn" --video cat-playing.mp4

# Use different video models
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A person walking" --video walk.mp4 --model keling
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Ocean waves" --video ocean.mp4 --model seedance

# Image-to-video (animate a portrait)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "A person smiling and waving" --reference portrait.jpg --video portrait-animated.mp4

# Longer video with high resolution
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Sunset over ocean waves" --video sunset.mp4 --video-seconds 10 --resolution 1080P
```

### Edit images with reference

```bash
# Style transfer
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Make it look like a watercolor painting" --reference photo.jpg --image watercolor.png

# Color adjustment
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "Change the sky to sunset colors" --reference landscape.jpg --image sunset-landscape.png
```

### Use prompt files

```bash
# Combine system prompt + content
cat > system.md << 'EOF'
Generate a photorealistic image with high detail and vibrant colors.
EOF

cat > content.md << 'EOF'
A golden retriever puppy playing in a flower field.
EOF

npx -y bun ${SKILL_DIR}/scripts/main.ts --promptfiles system.md content.md --image puppy.png
```

## Troubleshooting

### Authentication Issues

If you see authentication errors:

1. Run `npx -y bun ${SKILL_DIR}/scripts/main.ts --login` to refresh cookies
2. Make sure you're logged in to wuli.art in your browser
3. Try using a different browser (Chrome recommended)

### Model Not Available

If a model returns an error:

- Check available models with `--list-models`
- Try a different model (default: Qwen Image 25.08)
- Some models may require specific subscription levels

### Video Generation Fails

If video generation fails:

- Use a video-capable model: `video` (通义万相 2.2 Turbo), `keling`, `seedance`
- Ensure video duration is 5-10 seconds
- Check if reference image (for FF_2_VIDEO) is valid
- Try different video models if one fails

## Extension Support

Custom configurations via EXTEND.md.

**Check paths** (priority order):

1. `.baoyu-skills/baoyu-wuli-art-web/EXTEND.md` (project)
2. `~/.baoyu-skills/baoyu-wuli-art-web/EXTEND.md` (user)

If found, load before workflow. Extension content overrides defaults.
