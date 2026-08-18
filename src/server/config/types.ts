export interface LlmKeyStatus {
  configured: boolean;
  maskedKey: string | null;   // e.g. "sk-ant-api0...****" or null if not configured
  updatedAt: string | null;   // ISO timestamp of last save or null
}
