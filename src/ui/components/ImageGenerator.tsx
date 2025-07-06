import { useState, FormEvent, useEffect, useMemo } from "react";
import axios from "axios";
import {
  CircleCheck,
  Loader2,
  FolderOpen,
  Wand2,
  ArrowLeft,
  Settings,
  Info,
  Sparkles,
  Server,
  HardDrive,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { generateImage, type GenerateImageParams } from "@/lib/api";

import { useModels, useResolutions } from "@/hooks/use-models";
import { useBackendStatus } from "@/hooks/use-backend-status";

const STORAGE_KEY = "stable-diffusion-last-params";

// Default parameters
const defaultParams: GenerateImageParams = {
  prompt: "",
  model: "dreamshaper_8",
  height: 512,
  width: 512,
  guidance_scale: 7.5,
  num_inference_steps: 20,
  negative_prompt: "",
  output_dir: "",
};

const ImageGenerator = () => {
  const backendStatus = useBackendStatus();

  const { data: modelsData, openDownloadTerminal } = useModels({
    retry: 10,
    retryDelay: 500,
    enabled: backendStatus.ready, // Only fetch models when backend is ready
  });

  const { data: resolutionsData } = useResolutions({
    retry: 10,
    retryDelay: 500,
    enabled: backendStatus.ready, // Only fetch resolutions when backend is ready
  });

  const [params, setParams] = useState<GenerateImageParams>(() =>
    loadFromStorage(STORAGE_KEY, defaultParams, {
      excludeKeys: ["output_dir"],
      validator: (data) => {
        // Basic validation to ensure the data structure is correct
        return typeof data === "object" && data !== null;
      },
    })
  );
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastUsedParams, setLastUsedParams] =
    useState<GenerateImageParams | null>(null);
  const [useRecommendedParams, setUseRecommendedParams] = useState(true);

  const models = useMemo(() => modelsData?.models || [], [modelsData]);
  const selectedModel = useMemo(
    () => models.find((model) => model.id === params.model),
    [models, params.model]
  );
  const supportedResolutions = useMemo(
    () => resolutionsData || [],
    [resolutionsData]
  );

  // Update parameters when model changes
  useEffect(() => {
    if (selectedModel && useRecommendedParams) {
      const recommendedParams = selectedModel.recommended_params;

      // Find best matching resolution or use first one
      const currentResolution = supportedResolutions.find(
        (res) => res.width === params.width && res.height === params.height
      );

      const targetResolution = currentResolution || supportedResolutions[0];

      setParams((prev) => ({
        ...prev,
        guidance_scale:
          recommendedParams?.guidance_scale || prev.guidance_scale,
        num_inference_steps:
          recommendedParams?.num_inference_steps || prev.num_inference_steps,
        width:
          targetResolution?.width || recommendedParams?.width || prev.width,
        height:
          targetResolution?.height || recommendedParams?.height || prev.height,
        negative_prompt:
          prev.negative_prompt || selectedModel.suggested_negative_prompt || "",
      }));
    }
  }, [
    params.model,
    params.height,
    params.width,
    selectedModel,
    useRecommendedParams,
    supportedResolutions,
  ]);

  // Save parameters whenever they change (except for output_dir)
  useEffect(() => {
    if (
      params.prompt ||
      params.model !== defaultParams.model ||
      params.guidance_scale !== defaultParams.guidance_scale
    ) {
      saveToStorage(STORAGE_KEY, params, {
        excludeKeys: ["output_dir"],
      });
    }
  }, [params]);

  const sdlxModels = useMemo(
    () => models.filter((model) => model.group === "sdxl"),
    [models]
  );
  const standardModels = useMemo(
    () => models.filter((model) => model.group === "standard"),
    [models]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save complete parameters before generation
      saveToStorage(STORAGE_KEY, params, {
        excludeKeys: ["output_dir"],
      });

      await openDownloadTerminal(params.model);

      const response = await generateImage(params);

      const base64 = await window.electron.getImageAsBase64(
        params.output_dir + "\\" + response.filename
      );

      if (response.filename) {
        setGeneratedImage(base64);
        setLastUsedParams({ ...params });
        setShowResult(true);
        // Scroll to top after successful generation
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error: any) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        alert("Error: " + (error.response?.data?.error || error.message));
      } else {
        alert("Error: " + (error?.message || error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDirectory = async () => {
    const path = await window.electron.selectDirectory();

    if (path) {
      setParams((prev) => ({ ...prev, output_dir: path }));
    }
  };

  const handleBackToForm = () => {
    setShowResult(false);
  };

  const handleGenerateAnother = () => {
    setShowResult(false);
    setGeneratedImage(null);
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model ? model.name : modelId;
  };

  const isRecommendedValue = (paramName: string, value: number) => {
    if (!selectedModel?.recommended_params) return false;
    return (
      selectedModel.recommended_params[
        paramName as keyof typeof selectedModel.recommended_params
      ] === value
    );
  };

  // Show backend connecting screen
  if (!backendStatus.ready) {
    return (
      <div className="w-full space-y-6">
        <Card className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50"></div>
          <div className="relative">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg animate-pulse">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl gradient-text dark:gradient-text-dark">
                  Connecting to Backend
                </CardTitle>
              </div>
              <p className="text-gray-600 dark:text-slate-400 max-w-lg mx-auto">
                Starting AI model services and checking connection...
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Checking Flask server status...
                </div>
              </div>

              {backendStatus.modelsLoaded !== undefined &&
                backendStatus.modelsLoaded > 0 && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <HardDrive className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-sm text-emerald-800 dark:text-emerald-200">
                      {backendStatus.modelsLoaded} models loaded
                    </div>
                  </div>
                )}

              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }

  // Show result view after successful generation
  if (showResult && generatedImage && lastUsedParams) {
    return (
      <div className="w-full space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToForm}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Generator
          </Button>
        </div>

        {/* Result Display */}
        <div className="grid grid-cols-1 gap-6">
          {/* Generated Image */}
          <Card className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-900/50"></div>

            <div className="relative">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl gradient-text dark:gradient-text-dark">
                  <CircleCheck className="h-6 w-6 text-emerald-500" />
                  Your Masterpiece
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-[1.02] object-contain"
                    style={{ maxHeight: "70vh" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button onClick={handleGenerateAnother} className="flex-1">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Another
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Generation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Generation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">
                  Prompt
                </Label>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border">
                  <p className="text-sm text-gray-900 dark:text-slate-200 leading-relaxed">
                    {lastUsedParams.prompt}
                  </p>
                </div>
              </div>

              {/* Technical Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                    Model
                  </Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200 mt-1">
                    {getModelName(lastUsedParams.model)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                    Size
                  </Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200 mt-1">
                    {lastUsedParams.width}×{lastUsedParams.height}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                    Guidance Scale
                  </Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200 mt-1">
                    {lastUsedParams.guidance_scale}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                    Steps
                  </Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-200 mt-1">
                    {lastUsedParams.num_inference_steps}
                  </p>
                </div>
              </div>

              {/* Negative Prompt */}
              {lastUsedParams.negative_prompt && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">
                    Negative Prompt
                  </Label>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {lastUsedParams.negative_prompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Output Directory */}
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                  Saved Location
                </Label>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-200 mt-1 break-all">
                  {lastUsedParams.output_dir}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!modelsData) {
    return (
      <div className="w-full space-y-6">
        <Card className="relative">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl shadow-lg animate-pulse">
                <div className="h-6 w-6 bg-white/20 rounded" />
              </div>
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show form view (default)
  return (
    <div className="w-full space-y-6">
      {/* Main Generator Card */}
      <Card className="relative">
        <div className="relative z-10">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl gradient-text dark:gradient-text-dark">
                AI Image Generator
              </CardTitle>
            </div>
            <p className="text-gray-600 dark:text-slate-400 max-w-lg mx-auto">
              Describe your vision and watch AI bring it to life with stunning
              detail and creativity.
            </p>
            {/* Show indicator if settings are loaded from previous session */}
            {params.prompt && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Last settings restored
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prompt Section */}
              <div className="space-y-3">
                <Label
                  htmlFor="prompt"
                  className="text-lg flex items-center gap-2"
                >
                  <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
                    ✦
                  </span>
                  Your Creative Vision
                </Label>
                <Textarea
                  id="prompt"
                  value={params.prompt}
                  onChange={(e) =>
                    setParams({ ...params, prompt: e.target.value })
                  }
                  placeholder="A majestic mountain landscape at sunset, digital art style..."
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              {/* Model Selection with Description */}
              <div className="space-y-3">
                <Label htmlFor="model" className="flex items-center gap-2">
                  AI Model
                  {selectedModel && (
                    <Badge variant="outline" className="ml-1">
                      {selectedModel.group.toUpperCase()}
                    </Badge>
                  )}
                </Label>
                <Select
                  value={params.model}
                  onValueChange={(value) =>
                    setParams({ ...params, model: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="font-bold">
                        Standard Models
                      </SelectLabel>
                      {standardModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-left">{model.name}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[500px]">
                              {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="font-bold">
                        SDXL Models (High Quality)
                      </SelectLabel>
                      {sdlxModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[500px]">
                              {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Model Description */}
                {selectedModel && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {selectedModel.description}
                        </p>
                        {supportedResolutions.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Supports {supportedResolutions.length} resolution
                            formats
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Use Recommended Settings Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Use Recommended Settings
                  </Label>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Automatically apply model-specific optimal parameters
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useRecommendedParams}
                  onChange={(e) => setUseRecommendedParams(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 rounded border-emerald-300"
                />
              </div>

              {/* Advanced Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resolution - Dynamic based on selected model */}
                <div className="space-y-3">
                  <Label
                    htmlFor="resolution"
                    className="flex items-center gap-2"
                  >
                    Image Size
                    {supportedResolutions.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {supportedResolutions.length} options
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={`${params.width}x${params.height}`}
                    onValueChange={(value) => {
                      const [width, height] = value.split("x").map(Number);
                      setParams({ ...params, width, height });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedResolutions.map((resolution) => (
                        <SelectItem
                          key={`${resolution.width}x${resolution.height}`}
                          value={`${resolution.width}x${resolution.height}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {resolution.width}×{resolution.height}
                            </span>
                            <span className="text-gray-500">
                              ({resolution.label})
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {resolution.aspect_ratio}
                            </Badge>
                          </div>
                        </SelectItem>
                      )) || [
                        <SelectItem key="512x512" value="512x512">
                          512×512 (Square)
                        </SelectItem>,
                        <SelectItem key="512x768" value="512x768">
                          512×768 (Portrait)
                        </SelectItem>,
                        <SelectItem key="768x512" value="768x512">
                          768×512 (Landscape)
                        </SelectItem>,
                        <SelectItem key="1024x1024" value="1024x1024">
                          1024×1024 (Large)
                        </SelectItem>,
                      ]}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedModel
                      ? `Optimized resolutions for ${selectedModel.name}`
                      : "Standard resolution options"}
                  </p>
                </div>

                {/* Guidance Scale with Recommended Indicator */}
                <div className="space-y-3">
                  <Label
                    htmlFor="guidance_scale"
                    className="flex items-center gap-2"
                  >
                    Creativity Level
                    {isRecommendedValue(
                      "guidance_scale",
                      params.guidance_scale
                    ) && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="guidance_scale"
                    type="number"
                    value={params.guidance_scale}
                    onChange={(e) =>
                      setParams({
                        ...params,
                        guidance_scale: parseFloat(e.target.value),
                      })
                    }
                    min="1"
                    max="20"
                    step="0.5"
                    className={
                      isRecommendedValue(
                        "guidance_scale",
                        params.guidance_scale
                      )
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                        : ""
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedModel?.recommended_params && (
                      <span className="text-emerald-600 dark:text-emerald-400 mr-1">
                        Recommended:{" "}
                        {selectedModel.recommended_params.guidance_scale} •
                      </span>
                    )}
                    Higher values follow the prompt more closely (1-20)
                  </p>
                </div>

                {/* Inference Steps with Recommended Indicator */}
                <div className="space-y-3">
                  <Label
                    htmlFor="num_inference_steps"
                    className="flex items-center gap-2"
                  >
                    Quality Steps
                    {isRecommendedValue(
                      "num_inference_steps",
                      params.num_inference_steps
                    ) && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="num_inference_steps"
                    type="number"
                    value={params.num_inference_steps}
                    onChange={(e) =>
                      setParams({
                        ...params,
                        num_inference_steps: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                    step="1"
                    className={
                      isRecommendedValue(
                        "num_inference_steps",
                        params.num_inference_steps
                      )
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                        : ""
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedModel?.recommended_params && (
                      <span className="text-emerald-600 dark:text-emerald-400 mr-1">
                        Recommended:{" "}
                        {selectedModel.recommended_params.num_inference_steps} •
                      </span>
                    )}
                    More steps = higher quality but slower generation (1-100)
                  </p>
                </div>
              </div>

              {/* Negative Prompt with Suggested */}
              <div className="space-y-3">
                <Label
                  htmlFor="negative_prompt"
                  className="flex items-center gap-2"
                >
                  What to Avoid (Optional)
                  {selectedModel?.suggested_negative_prompt &&
                    !params.negative_prompt && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setParams({
                            ...params,
                            negative_prompt:
                              selectedModel.suggested_negative_prompt,
                          })
                        }
                        className="text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Use Suggested
                      </Button>
                    )}
                </Label>
                <Textarea
                  id="negative_prompt"
                  value={params.negative_prompt}
                  onChange={(e) =>
                    setParams({ ...params, negative_prompt: e.target.value })
                  }
                  placeholder={
                    selectedModel?.suggested_negative_prompt ||
                    "blurry, low quality, distorted, text..."
                  }
                />
                {selectedModel?.suggested_negative_prompt && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Suggested for {selectedModel.name}:
                    </span>
                    {" " + selectedModel.suggested_negative_prompt}
                  </p>
                )}
              </div>

              {/* Output Directory */}
              <div className="space-y-3">
                <Label>Save Location</Label>
                <div className="flex gap-3">
                  <Input
                    value={params.output_dir}
                    placeholder="Choose where to save your masterpiece..."
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSelectDirectory}
                    variant="outline"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                type="submit"
                disabled={!params.prompt || !params.output_dir || isLoading}
                className="w-full"
                size="xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Stunning Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default ImageGenerator;
