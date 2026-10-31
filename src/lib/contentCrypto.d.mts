export const DEFAULT_ITERATIONS: number
export function encryptJson(value: unknown, password: string, iterations?: number): Promise<Record<string, unknown>>
export function decryptJson(payload: unknown, password: string): Promise<unknown>
