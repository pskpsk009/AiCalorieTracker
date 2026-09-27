import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AnalyzedMealItem } from "./meal-analysis";

export type Meal = {
  id: number;
  type: string;
  emoji: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items?: MealItem[];
};

export type MealItem = {
  id?: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type AppState = {
  meals: Meal[];
  setMeals: Dispatch<SetStateAction<Meal[]>>;
  savedBurned: number;
  setSavedBurned: Dispatch<SetStateAction<number>>;
  analyzedItems: AnalyzedMealItem[];
  setAnalyzedItems: Dispatch<SetStateAction<AnalyzedMealItem[]>>;
  weightKg: number | null;
  setWeightKg: Dispatch<SetStateAction<number | null>>;
  heightCm: number | null;
  setHeightCm: Dispatch<SetStateAction<number | null>>;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedBurned, setSavedBurned] = useState(0);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedMealItem[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);

  return (
    <AppStateContext.Provider
      value={{
        meals,
        setMeals,
        savedBurned,
        setSavedBurned,
        analyzedItems,
        setAnalyzedItems,
        weightKg,
        setWeightKg,
        heightCm,
        setHeightCm,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}
