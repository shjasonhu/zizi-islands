/// <reference types="vite/client" />

declare module './lib/contentCrypto.mjs' {
  export const DEFAULT_ITERATIONS: number
  export function encryptJson(value: unknown, password: string, iterations?: number): Promise<Record<string, unknown>>
  export function decryptJson(payload: unknown, password: string): Promise<unknown>
}

declare module 'hanzi-writer' {
  interface Writer {
    animateCharacter(options?: Record<string, unknown>): Promise<void>
    quiz(options?: Record<string, unknown>): Promise<void>
    cancelQuiz(): void
  }
  interface HanziWriterStatic {
    create(element: HTMLElement | string, character: string, options?: Record<string, unknown>): Writer
  }
  const HanziWriter: HanziWriterStatic
  export default HanziWriter
}
