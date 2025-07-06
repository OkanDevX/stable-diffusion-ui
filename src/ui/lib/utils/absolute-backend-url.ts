import { loadAppConfig } from "./config-loader";

export async function absoluteBackendUrl(path: string) {
  const appConfig = await loadAppConfig();

  if (!appConfig) {
    throw new Error("App configuration not found");
  }

  return `http://${appConfig.api.host}:${appConfig.api.port}${path}`;
}
