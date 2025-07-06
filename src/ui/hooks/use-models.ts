import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import {
  getModels,
  getResolutions,
  openModelDownloadTerminal,
  checkModelCacheStatus,
} from "../lib/api";

export const useModels = (
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getModels>>>,
    "queryKey" | "queryFn"
  > = {}
) => {
  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: getModels,
    ...options,
  });

  const openDownloadTerminal = async (modelId: string): Promise<void> => {
    try {
      // First check if model is already cached
      console.log(`Checking cache status for model: ${modelId}`);
      const cacheStatus = await checkModelCacheStatus(modelId);

      if (cacheStatus.is_cached) {
        console.log(
          `Model ${modelId} is already cached, skipping download terminal`
        );
        return;
      }

      // Model is not cached, open download terminal
      console.log(`Model ${modelId} is not cached, opening download terminal`);
      await openModelDownloadTerminal(modelId);
    } catch (error) {
      console.error(`Error checking cache status for ${modelId}:`, error);
      // If cache check fails, open terminal anyway as fallback
      console.log(`Falling back to opening terminal for ${modelId}`);
      await openModelDownloadTerminal(modelId);
    }
  };

  return {
    ...modelsQuery,
    openDownloadTerminal,
  };
};

export const useResolutions = (
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getResolutions>>>,
    "queryKey" | "queryFn"
  > = {}
) => {
  return useQuery({
    queryKey: ["resolutions"],
    queryFn: getResolutions,
    ...options,
  });
};
