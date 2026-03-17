import { analyzePitchDeckWithProvider } from "@/lib/ai/providers";

export async function analyzePitchDeckText(deckText: string, fileName = "deck"): Promise<{
  modelName: string;
  output: Awaited<ReturnType<typeof analyzePitchDeckWithProvider>>["output"];
  raw: unknown;
}> {
  return analyzePitchDeckWithProvider({
    extractedText: deckText,
    fileName,
  });
}
