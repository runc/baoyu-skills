export const WULI_ART_IMAGE_MODELS = {
  QWEN_IMAGE_25_08: 'Qwen Image 25.08',
  QWEN_IMAGE_TURBO: 'Qwen Image Turbo',
  TONGYI_WANXIANG_2_6: '通义万相 2.6',
  SEEDREAM_4_5: 'Seedream 4.5',
  SEEDREAM_4_0: 'Seedream 4.0',
} as const;

export const WULI_ART_VIDEO_MODELS = {
  TONGYI_WANXIANG_2_2_TURBO: '通义万相 2.2 Turbo',
  TONGYI_WANXIANG_2_6: '通义万相 2.6',
  KELING_O1: '可灵 O1',
  KELING_2_6: '可灵 2.6',
  KELING_2_5_TURBO: '可灵 2.5 Turbo',
  SEEDANCE_1_5_PRO: 'Seedance 1.5 Pro',
  SEEDANCE_1_0_PRO: 'Seedance 1.0 Pro',
} as const;

export const WULI_ART_MODELS = {
  ...WULI_ART_IMAGE_MODELS,
  ...WULI_ART_VIDEO_MODELS,
} as const;

export type WuliArtModelName = (typeof WULI_ART_MODELS)[keyof typeof WULI_ART_MODELS];
export type WuliArtImageModelName = (typeof WULI_ART_IMAGE_MODELS)[keyof typeof WULI_ART_IMAGE_MODELS];
export type WuliArtVideoModelName = (typeof WULI_ART_VIDEO_MODELS)[keyof typeof WULI_ART_VIDEO_MODELS];

export const DEFAULT_MODEL: WuliArtModelName = WULI_ART_IMAGE_MODELS.QWEN_IMAGE_25_08;
export const DEFAULT_VIDEO_MODEL: WuliArtVideoModelName = WULI_ART_VIDEO_MODELS.TONGYI_WANXIANG_2_2_TURBO;

export const MODEL_ALIASES: Record<string, WuliArtModelName> = {
  'qwen': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_25_08,
  'qwen-image': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_25_08,
  'qwen-image-25.08': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_25_08,
  'qwen-turbo': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_TURBO,
  'turbo': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_TURBO,
  'qwen-image-turbo': WULI_ART_IMAGE_MODELS.QWEN_IMAGE_TURBO,
  'tongyi': WULI_ART_IMAGE_MODELS.TONGYI_WANXIANG_2_6,
  'tongyi-wanxiang': WULI_ART_IMAGE_MODELS.TONGYI_WANXIANG_2_6,
  'wanxiang': WULI_ART_IMAGE_MODELS.TONGYI_WANXIANG_2_6,
  'tongyi-2.6': WULI_ART_IMAGE_MODELS.TONGYI_WANXIANG_2_6,
  'seedream': WULI_ART_IMAGE_MODELS.SEEDREAM_4_5,
  'seedream-4.5': WULI_ART_IMAGE_MODELS.SEEDREAM_4_5,
  'seedream-4.0': WULI_ART_IMAGE_MODELS.SEEDREAM_4_0,
  'doubao': WULI_ART_IMAGE_MODELS.SEEDREAM_4_5,
  'doubao-4.5': WULI_ART_IMAGE_MODELS.SEEDREAM_4_5,
  'doubao-4.0': WULI_ART_IMAGE_MODELS.SEEDREAM_4_0,
  'tongyi-2.2': WULI_ART_VIDEO_MODELS.TONGYI_WANXIANG_2_2_TURBO,
  'tongyi-2.2-turbo': WULI_ART_VIDEO_MODELS.TONGYI_WANXIANG_2_2_TURBO,
  'tongyi-turbo': WULI_ART_VIDEO_MODELS.TONGYI_WANXIANG_2_2_TURBO,
  'video': WULI_ART_VIDEO_MODELS.TONGYI_WANXIANG_2_2_TURBO,
  'keling': WULI_ART_VIDEO_MODELS.KELING_O1,
  'keling-o1': WULI_ART_VIDEO_MODELS.KELING_O1,
  'keling-2.6': WULI_ART_VIDEO_MODELS.KELING_2_6,
  'keling-2.5': WULI_ART_VIDEO_MODELS.KELING_2_5_TURBO,
  'keling-2.5-turbo': WULI_ART_VIDEO_MODELS.KELING_2_5_TURBO,
  'keling-turbo': WULI_ART_VIDEO_MODELS.KELING_2_5_TURBO,
  'seedance': WULI_ART_VIDEO_MODELS.SEEDANCE_1_5_PRO,
  'seedance-1.5': WULI_ART_VIDEO_MODELS.SEEDANCE_1_5_PRO,
  'seedance-1.5-pro': WULI_ART_VIDEO_MODELS.SEEDANCE_1_5_PRO,
  'seedance-1.0': WULI_ART_VIDEO_MODELS.SEEDANCE_1_0_PRO,
  'seedance-1.0-pro': WULI_ART_VIDEO_MODELS.SEEDANCE_1_0_PRO,
};

export function resolveModelName(input: string): string {
  const normalized = input.trim();

  const exactMatch = Object.values(WULI_ART_MODELS).find(
    (m) => m.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  const alias = MODEL_ALIASES[normalized.toLowerCase()];
  if (alias) return alias;

  return normalized;
}

export function listAvailableModels(): string[] {
  return Object.values(WULI_ART_MODELS);
}

export function formatModelList(): string {
  const imageModels = Object.values(WULI_ART_IMAGE_MODELS)
    .map((m, i) => {
      const isQwen = m === WULI_ART_IMAGE_MODELS.QWEN_IMAGE_25_08 || m === WULI_ART_IMAGE_MODELS.QWEN_IMAGE_TURBO;
      const info = isQwen ? ' [4 images]' : ' [1 image]';
      return `  ${i === 0 ? '(default) ' : '          '}${m}${info}`;
    })
    .join('\n');

  const videoModels = Object.values(WULI_ART_VIDEO_MODELS)
    .map((m) => `            ${m} [video+image]`)
    .join('\n');

  return `${imageModels}\n          --- Video Models ---\n${videoModels}`;
}
