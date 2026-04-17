export function estimatePromptTokens(prompt: string) {
  return Math.max(1, Math.ceil(prompt.length / 4))
}

export function estimateConsumedTokens(
  prompt: string,
  maxOutputTokens: number
) {
  return estimatePromptTokens(prompt) + Math.max(1, maxOutputTokens)
}
