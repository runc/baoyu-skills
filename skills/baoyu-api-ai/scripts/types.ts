export type TextModelId = 'mimo-v2-flash';
export type ImageModelId = 'z-image-turbo' | 'doubao-seedream-4.5' | 'nano-banana-pro' | 'glm-image';

export interface TextGenerationInput {
  prompt: string;
  model: TextModelId;
  signal?: AbortSignal;
}

export interface TextGenerationOutput {
  text: string;
  model: TextModelId;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  errorMessage?: string;
}

export interface ImageGenerationInput {
  prompt: string;
  model: ImageModelId;
  outputPath: string;
  size?: string;
  signal?: AbortSignal;
}

export interface ImageGenerationOutput {
  saved: boolean;
  imagePath: string;
  errorMessage?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
