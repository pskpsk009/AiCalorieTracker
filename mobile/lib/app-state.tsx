import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AnalyzedMealItem } from "./meal-analysis";
import { getAppTimeZone, setAppTimeZone } from "./timezone";

export type Meal = {
  id: string;
  type: string;
  emoji: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items?: MealItem[];
  eatenAt?: string;
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
  /** IANA zone that defines "today" and the week. */
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedBurned, setSavedBurned] = useState(0);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedMealItem[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [timeZone, setTimeZoneState] = useState(getAppTimeZone);
  const setTimeZone = useCallback((next: string) => {
    setAppTimeZone(next); // throws on an unknown zone, so state never holds one
    setTimeZoneState(next);
  }, []);

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
        timeZone,
        setTimeZone,
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
