import axios from "axios";

import { type ModelsConfig } from "types/config";
import { absoluteBackendUrl } from "../utils/absolute-backend-url";

interface GenerateImageParams {
  prompt: string;
  model: string;
  height: number;
  width: number;
  guidance_scale: number;
  num_inference_steps: number;
  negative_prompt: string;
  output_dir: string;
}

interface GenerateImageResponse {
  filename: string;
  model_used: string;
  model_name: string;
  params_used: GenerateImageParams;
}

interface RecommendedParams {
  guidance_scale: number;
  num_inference_steps: number;
  width: number;
  height: number;
}

interface SupportedResolution {
  width: number;
  height: number;
  label: string;
  aspect_ratio: string;
}

interface ModelsResponse {
  models: Array<ModelsConfig["models"][0]>;
  total: number;
}

export async function generateImage(params: GenerateImageParams) {
  const backendUrl = await absoluteBackendUrl("/generate");

  const response = await axios.post<GenerateImageResponse>(backendUrl, params);

  return response.data;
}

export async function openModelDownloadTerminal(
  modelId: string
): Promise<{ success: boolean }> {
  if (typeof window !== "undefined" && window.electron) {
    return await window.electron.openModelDownloadTerminal(modelId);
  }
  throw new Error("Electron API not available");
}

// Check if model is cached
export const checkModelCacheStatus = async (
  modelId: string
): Promise<{ model_id: string; is_cached: boolean; cache_status: string }> => {
  const backendUrl = await absoluteBackendUrl(
    `/api/models/${modelId}/cache-status`
  );
  const response = await fetch(backendUrl);

  if (!response.ok) {
    throw new Error(`Failed to check cache status: ${response.statusText}`);
  }

  return response.json();
};

export async function getModels() {
  const backendUrl = await absoluteBackendUrl("/models");

  const response = await axios.get<ModelsResponse>(backendUrl);

  return response.data;
}

export async function getResolutions() {
  const backendUrl = await absoluteBackendUrl("/resolutions");

  const response = await axios.get<ModelsConfig["supported_resolutions"]>(
    backendUrl
  );

  return response.data;
}

export type {
  GenerateImageParams,
  GenerateImageResponse,
  ModelsResponse,
  RecommendedParams,
  SupportedResolution,
};
