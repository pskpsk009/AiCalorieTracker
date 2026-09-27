import { supabase } from "./supabase";
import { readImageData } from "./image-data";

export type AnalyzedMealItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function analyzeMeal(uri: string): Promise<AnalyzedMealItem[]> {
  const { base64: imageBase64, mimeType } = await readImageData(uri);
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { imageBase64, mimeType },
  });
  if (error) {
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const details = (await response.json()) as { error?: string };
        throw new Error(details.error ?? error.message);
      } catch (responseError) {
        if (responseError instanceof Error && responseError.message !== error.message)
          throw responseError;
      }
    }
    throw error;
  }
  if (!data?.items || !Array.isArray(data.items)) {
    throw new Error(`Meal analysis returned an invalid response: ${JSON.stringify(data)}`);
  }
  return data.items;
}
