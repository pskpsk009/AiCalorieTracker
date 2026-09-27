import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  Flame,
  Footprints,
  Home,
  ImagePlus,
  LockKeyhole,
  Mail,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  ScanLine,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  Utensils,
} from "lucide-react";

import avatarImage from "@/assets/getfit-avatar.jpg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type AppView = "login" | "register" | "home" | "progress" | "add" | "analysis";
type TimerStatus = "idle" | "running" | "paused" | "complete";
type ProgressRange = "today" | "week" | "previous";

type NutritionTotals = { calories: number; protein: number; carbs: number; fat: number };
type Food = NutritionTotals & { id: number; emoji: string; name: string; grams: number };
type Meal = NutritionTotals & { id: number; type: string; emoji: string; name: string };
type WalkingSession = { id: number; durationSeconds: number; burned: number };

const initialMeals: Meal[] = [
  { id: 1, type: "Breakfast", emoji: "🥚", name: "Eggs + Toast", calories: 420, protein: 24, carbs: 28, fat: 14 },
  { id: 2, type: "Lunch", emoji: "🍚", name: "Chicken Rice", calories: 580, protein: 57, carbs: 58, fat: 11 },
  { id: 3, type: "Snack", emoji: "🍌", name: "Banana + Yogurt", calories: 250, protein: 12, carbs: 32, fat: 6 },
];

const detectedFoods: Food[] = [
  { id: 1, emoji: "🍚", name: "White Rice", grams: 200, calories: 260, protein: 5, carbs: 57, fat: 1 },
  { id: 2, emoji: "🍗", name: "Chicken Breast", grams: 150, calories: 248, protein: 46, carbs: 0, fat: 5 },
  { id: 3, emoji: "🍳", name: "Fried Egg", grams: 50, calories: 72, protein: 6, carbs: 1, fat: 5 },
];

const week = [
  { day: "Mon", value: 1850, burned: 210 },
  { day: "Tue", value: 2050, burned: 280 },
  { day: "Wed", value: 1720, burned: 175 },
  { day: "Thu", value: 1940, burned: 240 },
  { day: "Fri", value: 1870, burned: 225 },
  { day: "Sat", value: 2100, burned: 320 },
  { day: "Sun", value: 1650, burned: 190 },
];

const emptyTotals: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const sumMeals = (meals: Meal[]) => meals.reduce((total, meal) => ({
  calories: total.calories + meal.calories,
  protein: total.protein + meal.protein,
  carbs: total.carbs + meal.carbs,
  fat: total.fat + meal.fat,
}), emptyTotals);
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
};
const estimatedBurn = (seconds: number) => seconds > 0 ? Math.max(1, Math.round((seconds / 60) * 5)) : 0;

function Logo() {
  return <div className="font-display flex items-baseline text-[28px] font-bold leading-none"><span className="text-primary">Get</span><span className="text-accent">Fit</span></div>;
}

function PhoneShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <main className="min-h-screen bg-canvas lg:grid lg:place-items-center lg:px-6 lg:py-8"><div className={`mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-phone lg:h-[860px] lg:min-h-0 lg:rounded-[32px] ${compact ? "justify-center" : ""}`}>{children}</div></main>;
}

function AuthScreen({ mode, onMode, onSuccess }: { mode: "login" | "register"; onMode: () => void; onSuccess: () => void }) {
  const isLogin = mode === "login";
  return <PhoneShell compact><div className="px-6 py-10"><div className="mb-10 flex items-center justify-between"><Logo /><div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand"><Flame className="size-6" /></div></div><p className="font-display text-4xl font-semibold leading-tight">{isLogin ? "Welcome back" : "Create your account"}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isLogin ? "Track your meals and keep today in view." : "Start building healthier habits, one meal at a time."}</p><form className="mt-8 space-y-4" onSubmit={(event) => { event.preventDefault(); onSuccess(); }}>{!isLogin && <Field icon={UserRound} label="Name" type="text" placeholder="Your name" />}<Field icon={Mail} label="Email" type="email" placeholder="you@example.com" /><Field icon={LockKeyhole} label="Password" type="password" placeholder="At least 8 characters" />{!isLogin && <Field icon={LockKeyhole} label="Confirm password" type="password" placeholder="Repeat your password" />}<Button variant="fitness" size="xl" className="mt-2 w-full" type="submit">{isLogin ? "Login" : "Register"}<ChevronRight className="size-5" /></Button></form><p className="mt-6 text-center text-sm text-muted-foreground">{isLogin ? "New to GetFit?" : "Already have an account?"}{" "}<button className="font-semibold text-primary" onClick={onMode} type="button">{isLogin ? "Register" : "Login"}</button></p></div></PhoneShell>;
}

function Field({ icon: Icon, label, ...props }: React.ComponentProps<typeof Input> & { icon: typeof Mail; label: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-foreground">{label}</span><span className="relative block"><Icon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input required className="h-13 rounded-2xl bg-card pl-11 shadow-field" {...props} /></span></label>;
}

function AppHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  return <header className="flex items-center justify-between px-5 pb-4 pt-6">{onBack ? <Button variant="iconSoft" size="icon" onClick={onBack} aria-label="Go back"><ArrowLeft /></Button> : <Logo />}{title && <h1 className="font-display text-lg font-semibold">{title}</h1>}{onBack ? <div className="size-10" /> : <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Good morning</span><img src={avatarImage} alt="Your profile" width={816} height={816} className="size-11 rounded-full object-cover ring-2 ring-card" /></div>}</header>;
}

function NutritionSummary({ totals }: { totals: NutritionTotals }) {
  return <section className="px-5"><div className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-brand"><div className="nutrition-orbit nutrition-orbit-one" /><div className="nutrition-orbit nutrition-orbit-two" /><div className="relative"><p className="text-xs font-medium opacity-75">Today's Calories</p><div className="mt-2 flex items-end gap-2"><span className="font-display text-[50px] font-bold leading-none">{totals.calories.toLocaleString()}</span><span className="mb-1.5 text-sm opacity-75">kcal</span></div><div className="mt-6 grid grid-cols-3 gap-2.5"><MacroTile label="Protein" value={totals.protein} /><MacroTile label="Carbs" value={totals.carbs} /><MacroTile label="Fat" value={totals.fat} /></div></div></div></section>;
}

function MacroTile({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-primary-foreground/15 px-3 py-2.5"><p className="text-[10px] text-primary-foreground/70">{label}</p><p className="font-display text-xl font-semibold">{value}<span className="text-xs opacity-60">g</span></p></div>;
}

function MealCard({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  return <article className="flex items-center gap-3 rounded-[22px] bg-card p-3.5 shadow-card"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{meal.emoji}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase text-primary">{meal.type}</p><p className="font-display truncate text-base font-semibold">{meal.name}</p><p className="text-[11px] text-muted-foreground">P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</p></div><div className="flex shrink-0 items-center gap-1"><div className="text-right"><p className="font-display text-lg font-bold">{meal.calories}</p><p className="text-[10px] text-muted-foreground">kcal</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${meal.name}`}><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete this meal?</AlertDialogTitle><AlertDialogDescription>{meal.name} and its nutrition will be removed from today's totals.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep meal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></article>;
}

function WalkingTimer({ calories, status, elapsed, onStart, onPause, onResume, onStop, onSave, onDiscard }: { calories: number; status: TimerStatus; elapsed: number; onStart: () => void; onPause: () => void; onResume: () => void; onStop: () => void; onSave: () => void; onDiscard: () => void }) {
  const recommendedMinutes = Math.max(1, Math.round(calories * 0.15));
  const burned = estimatedBurn(elapsed);
  if (status === "complete") return <section className="mx-5 mt-6 rounded-[26px] bg-card p-5 shadow-card"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-success-soft text-primary"><Check /></div><div><h2 className="font-display text-xl font-semibold">Walking Complete</h2><p className="text-xs text-muted-foreground">Ready to add to today's activity</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><Stat label="Duration" value={elapsed < 60 ? `${elapsed} sec` : `${Math.round(elapsed / 60)} min`} /><Stat label="Calories Burned" value={`${burned} kcal`} /></div><div className="mt-4 grid grid-cols-[1fr_2fr] gap-3"><Button variant="soft" size="xl" onClick={onDiscard}><RotateCcw />Discard</Button><Button variant="fitness" size="xl" onClick={onSave}><Save />Save Session</Button></div></section>;
  return <section className="mx-5 mt-6 rounded-[26px] bg-foreground p-5 text-background shadow-card"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Footprints /></div><div><h2 className="font-display text-xl font-semibold">{status === "idle" ? "Walking Timer" : "Walking"}</h2><p className="text-xs opacity-60">{status === "idle" ? "Based on today's meals" : status === "paused" ? "Session paused" : "Session in progress"}</p></div></div>{status === "idle" ? <div className="mt-5 flex items-end justify-between"><div><p className="text-xs opacity-60">Estimated walking time</p><p className="font-display mt-1 text-3xl font-bold">~{recommendedMinutes} <span className="text-sm font-medium opacity-60">minutes</span></p></div><Button variant="fitness" size="xl" onClick={onStart}><Play />Start</Button></div> : <><div className="my-6 text-center"><p className="font-display text-5xl font-semibold tabular-nums">{formatTime(elapsed)}</p><p className="mt-3 text-xs opacity-60">Estimated Calories Burned</p><p className="font-display text-2xl font-semibold text-sun">{burned} kcal</p></div><div className="grid grid-cols-2 gap-3">{status === "running" ? <Button variant="soft" size="xl" onClick={onPause}><Pause />Pause</Button> : <Button variant="fitness" size="xl" onClick={onResume}><Play />Resume</Button>}<Button variant="destructive" size="xl" onClick={onStop}><Square />Stop</Button></div></>}</section>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-secondary p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="font-display mt-1 text-lg font-semibold">{value}</p></div>;
}

function CalorieSummary({ consumed, burned, target }: { consumed: number; burned: number; target: number }) {
  const net = consumed - burned;
  const difference = net - target;
  return <section className="mx-5 mt-6 rounded-[26px] bg-card p-5 shadow-card"><div className="mb-4 flex items-center gap-2"><Flame className="text-accent" /><h2 className="font-display text-xl font-semibold">Calorie Summary</h2></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Consumed</span><strong>{consumed.toLocaleString()} kcal</strong></div><div className="flex justify-between"><span className="text-muted-foreground">Burned walking</span><strong className="text-primary">− {burned.toLocaleString()} kcal</strong></div><div className="flex justify-between border-t border-border pt-3"><span className="font-semibold">Net Calories</span><strong className="font-display text-lg">{net.toLocaleString()} kcal</strong></div></div><div className={`mt-4 rounded-2xl p-3 text-center ${difference > 0 ? "bg-accent-soft text-accent" : "bg-success-soft text-primary"}`}><p className="text-[10px] font-semibold uppercase">Compared with your {target.toLocaleString()} kcal reference</p><p className="font-display mt-1 text-xl font-semibold">{Math.abs(difference).toLocaleString()} kcal {difference > 0 ? "surplus" : difference < 0 ? "deficit" : "balanced"}</p></div></section>;
}

function BottomNav({ active, onChange }: { active: "home" | "progress"; onChange: (view: "home" | "progress") => void }) {
  return <nav className="sticky bottom-0 mt-auto bg-background/90 px-5 pb-5 pt-4 backdrop-blur-md"><div className="flex rounded-full bg-foreground p-1.5 shadow-nav"><Button variant={active === "home" ? "navActive" : "nav"} className="flex-1" onClick={() => onChange("home")}><Home />Home</Button><Button variant={active === "progress" ? "navActive" : "nav"} className="flex-1" onClick={() => onChange("progress")}><BarChart3 />Progress</Button></div></nav>;
}

function HomeScreen({ meals, sessions, target, timerStatus, elapsed, onAdd, onDelete, onProgress, onTimerAction, onSaveSession }: { meals: Meal[]; sessions: WalkingSession[]; target: number; timerStatus: TimerStatus; elapsed: number; onAdd: () => void; onDelete: (id: number) => void; onProgress: () => void; onTimerAction: (action: "start" | "pause" | "resume" | "stop" | "discard") => void; onSaveSession: () => void }) {
  const totals = useMemo(() => sumMeals(meals), [meals]);
  const burned = sessions.reduce((sum, session) => sum + session.burned, 0);
  return <PhoneShell><AppHeader /><div className="flex-1 overflow-y-auto pb-3"><NutritionSummary totals={totals} /><section className="mt-5 px-5"><Button variant="meal" size="xl" className="w-full justify-between" onClick={onAdd}>Add Meal<span className="grid size-9 place-items-center rounded-full bg-accent-foreground/20"><Plus /></span></Button></section><section className="mt-6 px-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Today's Meals</h2><span className="text-xs text-muted-foreground">{meals.length} logged</span></div>{meals.length ? <div className="space-y-3">{meals.map((meal) => <MealCard key={meal.id} meal={meal} onDelete={() => onDelete(meal.id)} />)}</div> : <div className="rounded-[22px] border border-dashed border-border p-6 text-center"><Utensils className="mx-auto text-muted-foreground" /><p className="mt-2 text-sm font-semibold">No meals saved yet</p></div>}</section><WalkingTimer calories={totals.calories} status={timerStatus} elapsed={elapsed} onStart={() => onTimerAction("start")} onPause={() => onTimerAction("pause")} onResume={() => onTimerAction("resume")} onStop={() => onTimerAction("stop")} onDiscard={() => onTimerAction("discard")} onSave={onSaveSession} />{sessions.length > 0 && <CalorieSummary consumed={totals.calories} burned={burned} target={target} />}</div><BottomNav active="home" onChange={(view) => view === "progress" && onProgress()} /></PhoneShell>;
}

function AddMealScreen({ onBack, onAnalyze }: { onBack: () => void; onAnalyze: () => void }) {
  const [photoReady, setPhotoReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return <PhoneShell><AppHeader title="Add Your Meal" onBack={onBack} /><div className="flex flex-1 flex-col px-5 pb-6"><div className={`camera-stage ${photoReady ? "camera-stage-ready" : ""}`}>{photoReady ? <><div className="text-7xl">🍚</div><div className="mt-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-card"><Check className="size-4 text-primary" />Photo ready</div></> : <><div className="grid size-20 place-items-center rounded-full bg-card shadow-card"><Camera className="size-9 text-primary" /></div><h2 className="font-display mt-5 text-2xl font-semibold">Show us your plate</h2><p className="mt-2 max-w-[28ch] text-center text-sm text-muted-foreground">Use a clear, overhead photo for the best nutrition estimate.</p></>}</div><input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={() => setPhotoReady(true)} /><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="fitness" size="xl" onClick={() => setPhotoReady(true)}><Camera />Take Picture</Button><Button variant="soft" size="xl" onClick={() => fileRef.current?.click()}><ImagePlus />Gallery</Button></div><div className="mt-auto pt-8"><Button variant="meal" size="xl" className="w-full" disabled={!photoReady} onClick={onAnalyze}><ScanLine />Analyze Meal</Button></div></div></PhoneShell>;
}

function AnalysisScreen({ onBack, onSave }: { onBack: () => void; onSave: (meal: Meal) => void }) {
  const [foods, setFoods] = useState(detectedFoods);
  const [editing, setEditing] = useState(false);
  const total = foods.reduce((acc, food) => ({ calories: acc.calories + food.calories, protein: acc.protein + food.protein, carbs: acc.carbs + food.carbs, fat: acc.fat + food.fat }), emptyTotals);
  const updatePortion = (id: number, grams: number) => setFoods((items) => items.map((food) => { if (food.id !== id) return food; const base = detectedFoods.find((item) => item.id === id); if (!base) return food; const ratio = grams / base.grams; return { ...food, grams, calories: Math.round(base.calories * ratio), protein: Math.round(base.protein * ratio), carbs: Math.round(base.carbs * ratio), fat: Math.round(base.fat * ratio) }; }));
  return <PhoneShell><AppHeader title="Your Meal" onBack={onBack} /><div className="flex-1 overflow-y-auto px-5 pb-6"><div className="mb-5 flex items-center gap-3 rounded-2xl bg-success-soft p-3 text-sm text-primary"><span className="grid size-9 place-items-center rounded-full bg-card"><Sparkles className="size-4" /></span><span><strong>Analysis complete</strong><br /><span className="text-xs text-muted-foreground">3 foods detected</span></span></div><div className="space-y-3">{foods.map((food) => <FoodRow key={food.id} food={food} editing={editing} onChange={(grams) => updatePortion(food.id, grams)} />)}</div><div className="mt-5 rounded-[24px] bg-foreground p-5 text-background shadow-card"><div className="flex items-end justify-between"><div><p className="text-xs opacity-60">Meal total</p><p className="font-display mt-1 text-4xl font-bold">{total.calories}<span className="ml-1 text-sm opacity-60">kcal</span></p></div><Utensils className="size-7 text-sun" /></div><div className="mt-5 grid grid-cols-3 text-center text-xs"><div><strong className="block text-base">{total.protein}g</strong><span className="opacity-60">Protein</span></div><div><strong className="block text-base">{total.carbs}g</strong><span className="opacity-60">Carbs</span></div><div><strong className="block text-base">{total.fat}g</strong><span className="opacity-60">Fat</span></div></div></div><div className="mt-5 grid grid-cols-[1fr_2fr] gap-3"><Button variant="soft" size="xl" onClick={() => setEditing(!editing)}>{editing ? <Check /> : <Pencil />}{editing ? "Done" : "Edit"}</Button><Button variant="meal" size="xl" onClick={() => onSave({ id: Date.now(), type: "Dinner", emoji: "🍽️", name: "Chicken Rice Plate", ...total })}><Check />Save Meal</Button></div></div></PhoneShell>;
}

function FoodRow({ food, editing, onChange }: { food: Food; editing: boolean; onChange: (grams: number) => void }) {
  return <article className="rounded-[22px] bg-card p-4 shadow-card"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-secondary text-2xl">{food.emoji}</div><div className="min-w-0 flex-1"><p className="font-display font-semibold">{food.name}</p>{editing ? <div className="mt-1 flex items-center gap-2"><input aria-label={`${food.name} portion`} className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm" type="number" min="10" step="10" value={food.grams} onChange={(event) => onChange(Math.max(10, Number(event.target.value)))} /><span className="text-xs text-muted-foreground">grams</span></div> : <p className="text-xs text-muted-foreground">{food.grams}g portion</p>}</div><div className="text-right"><p className="font-display text-lg font-bold">{food.calories}</p><p className="text-[10px] text-muted-foreground">kcal</p></div></div><div className="mt-3 flex gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground"><span>P <strong className="text-foreground">{food.protein}g</strong></span><span>C <strong className="text-foreground">{food.carbs}g</strong></span><span>F <strong className="text-foreground">{food.fat}g</strong></span></div></article>;
}

function WeeklyChart({ todayCalories, target }: { todayCalories: number; target: number }) {
  const data = week.map((item, index) => index === 4 ? { ...item, value: todayCalories } : item);
  const max = Math.max(target, ...data.map((item) => item.value)) * 1.15;
  const targetBottom = Math.min(92, (target / max) * 100);
  return <div className="relative mt-6 flex h-52 items-end justify-between gap-2 border-b border-border px-1 pb-6"><div className="absolute inset-x-0 border-t border-dashed border-accent/60" style={{ bottom: `${targetBottom}%` }}><span className="absolute -top-5 right-0 text-[9px] font-semibold text-accent">Your {target.toLocaleString()} reference</span></div>{data.map((item, index) => <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[9px] font-semibold text-muted-foreground">{item.value}</span><div className={`w-full max-w-8 rounded-t-xl transition-all ${index === 4 ? "bg-accent" : "bg-primary"}`} style={{ height: `${Math.max(12, (item.value / max) * 82)}%` }} /><span className="text-[10px] font-semibold text-muted-foreground">{item.day}</span></div>)}</div>;
}

function ProgressScreen({ totals, sessions, target, onTarget, onHome }: { totals: NutritionTotals; sessions: WalkingSession[]; target: number; onTarget: (value: number) => void; onHome: () => void }) {
  const [range, setRange] = useState<ProgressRange>("week");
  const burned = sessions.reduce((sum, session) => sum + session.burned, 0);
  const net = totals.calories - burned;
  return <PhoneShell><AppHeader /><div className="flex-1 overflow-y-auto px-5 pb-4"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase text-primary">Progress</p><h1 className="font-display text-3xl font-semibold">Your Numbers</h1></div><label className="text-right text-[10px] font-semibold text-muted-foreground">Reference target<Input aria-label="Calorie reference target" type="number" min="500" step="50" value={target} onChange={(event) => onTarget(Math.max(500, Number(event.target.value)))} className="mt-1 h-9 w-24 rounded-xl bg-card text-right text-xs" /></label></div><div className="mt-5 grid grid-cols-3 rounded-2xl bg-secondary p-1">{(["today", "week", "previous"] as ProgressRange[]).map((item) => <Button key={item} variant={range === item ? "default" : "ghost"} size="sm" className="rounded-xl px-2 capitalize" onClick={() => setRange(item)}>{item === "week" ? "This Week" : item === "previous" ? "Previous" : "Today"}</Button>)}</div>{range === "today" && <><section className="mt-5 rounded-[26px] bg-card p-5 shadow-card"><h2 className="font-display text-xl font-semibold">Today's balance</h2><div className="mt-4 grid grid-cols-3 gap-2"><Stat label="Consumed" value={`${totals.calories} kcal`} /><Stat label="Walking" value={`${burned} kcal`} /><Stat label="Net" value={`${net} kcal`} /></div></section><CalorieSummary consumed={totals.calories} burned={burned} target={target} /></>}{range === "week" && <section className="mt-5 rounded-[26px] bg-card p-5 shadow-card"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Weekly overview</p><p className="font-display text-2xl font-bold">Intake comparison</p></div><BarChart3 className="text-primary" /></div><WeeklyChart todayCalories={totals.calories} target={target} /><div className="mt-5 grid grid-cols-2 gap-3"><Stat label="Today's walking" value={`${burned} kcal`} /><Stat label="Today's net" value={`${net} kcal`} /></div></section>}{range === "previous" && <section className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Previous days</h2><span className="text-xs text-muted-foreground">Intake · walking · net</span></div><div className="space-y-2">{week.filter((_, index) => index !== 4).map((item) => <div key={item.day} className="rounded-2xl bg-card px-4 py-3 shadow-field"><div className="flex items-center justify-between"><span className="font-semibold">{item.day}</span><strong>{item.value.toLocaleString()} kcal</strong></div><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Walking −{item.burned} kcal</span><span>Net {(item.value - item.burned).toLocaleString()} kcal</span></div><Progress value={Math.min(100, (item.value / Math.max(target, item.value)) * 100)} className="mt-2 h-1.5 bg-secondary" /></div>)}</div></section>}</div><BottomNav active="progress" onChange={(view) => view === "home" && onHome()} /></PhoneShell>;
}

export function GetFitApp() {
  const [view, setView] = useState<AppView>("login");
  const [meals, setMeals] = useState(initialMeals);
  const [sessions, setSessions] = useState<WalkingSession[]>([]);
  const [target, setTarget] = useState(1800);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const totals = useMemo(() => sumMeals(meals), [meals]);

  useEffect(() => {
    if (timerStatus !== "running") return;
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerStatus]);

  const timerAction = (action: "start" | "pause" | "resume" | "stop" | "discard") => {
    if (action === "start") { setElapsed(0); setTimerStatus("running"); }
    if (action === "pause") setTimerStatus("paused");
    if (action === "resume") setTimerStatus("running");
    if (action === "stop") setTimerStatus(elapsed > 0 ? "complete" : "idle");
    if (action === "discard") { setElapsed(0); setTimerStatus("idle"); }
  };
  const saveSession = () => {
    if (elapsed <= 0) return;
    setSessions((current) => [...current, { id: Date.now(), durationSeconds: elapsed, burned: estimatedBurn(elapsed) }]);
    setElapsed(0);
    setTimerStatus("idle");
  };

  if (view === "login" || view === "register") return <AuthScreen mode={view} onMode={() => setView(view === "login" ? "register" : "login")} onSuccess={() => setView("home")} />;
  if (view === "add") return <AddMealScreen onBack={() => setView("home")} onAnalyze={() => setView("analysis")} />;
  if (view === "analysis") return <AnalysisScreen onBack={() => setView("add")} onSave={(meal) => { setMeals((current) => [...current, meal]); setView("home"); }} />;
  if (view === "progress") return <ProgressScreen totals={totals} sessions={sessions} target={target} onTarget={setTarget} onHome={() => setView("home")} />;
  return <HomeScreen meals={meals} sessions={sessions} target={target} timerStatus={timerStatus} elapsed={elapsed} onAdd={() => setView("add")} onDelete={(id) => setMeals((current) => current.filter((meal) => meal.id !== id))} onProgress={() => setView("progress")} onTimerAction={timerAction} onSaveSession={saveSession} />;
}
