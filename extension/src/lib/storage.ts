export interface ExtConfig {
  baseUrl: string
  token: string
  keepDomainOnly: boolean
}

const DEFAULTS: ExtConfig = {
  baseUrl: "http://localhost:3000",
  token: "",
  keepDomainOnly: false,
}

export async function getExtConfig(): Promise<ExtConfig> {
  const result = await chrome.storage.sync.get(DEFAULTS)
  return {
    baseUrl: String(result.baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, ""),
    token: String(result.token || ""),
    keepDomainOnly: Boolean(result.keepDomainOnly),
  }
}

export async function setExtConfig(patch: Partial<ExtConfig>): Promise<void> {
  const normalized = { ...patch }
  if (typeof normalized.baseUrl === "string") {
    normalized.baseUrl = normalized.baseUrl.replace(/\/+$/, "")
  }
  await chrome.storage.sync.set(normalized)
}
