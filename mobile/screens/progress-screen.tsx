import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Meal } from "../lib/app-state";
import Ionicons from "@expo/vector-icons/Ionicons";
import { timeOfDay, type DayKey } from "../lib/date-range";
import { bmiCategory, calculateBmi } from "../lib/profile";
import { useDayDetails } from "../lib/use-day-details";
import { useWeekSummary } from "../lib/use-week-summary";
import { useWeightHistory } from "../lib/use-weight-history";
import type { WeightEntry } from "../lib/weight-trend";
import {
  weeklyInsights,
  type DaySummary,
  type FoodDayStatus,
  type WeekSummary,
} from "../lib/weekly-summary";
import { styles } from "../styles";
import { BottomNav } from "./bottom-nav";
import { MealCard } from "./meal-card";
import { Button, FadeIn, PartialEnergyCard } from "./shared";

type ProgressPage = "today" | "week" | "days";

type ProgressProps = {
  meals: Meal[];
  savedBurned: number;
  weightKg: number | null;
  heightCm: number | null;
  onHome: () => void;
  onProfile: () => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS: Record<FoodDayStatus, string> = {
  complete: "#16b65b",
  partial: "#ef7444",
  "not-logged": "#d9d5c7",
  future: "#ece9df",
};
const STATUS_TEXT_COLORS: Record<FoodDayStatus, string> = {
  complete: "#12a958",
  partial: "#d0602f",
  "not-logged": "#718075",
  future: "#9aa69e",
};
const STATUS_LABELS: Record<FoodDayStatus, string> = {
  complete: "Complete",
  partial: "Not marked complete",
  "not-logged": "Not logged",
  future: "Upcoming",
};

function formatDay(day: DayKey, withWeekday = false) {
  const [year, month, date] = day.split("-").map(Number);
  const weekday = WEEKDAYS[(new Date(Date.UTC(year, month - 1, date)).getUTCDay() + 6) % 7];
  return `${withWeekday ? `${weekday} ` : ""}${date} ${MONTHS[month - 1]}`;
}

function formatWeekRange(days: DayKey[]) {
  const first = days[0];
  const last = days[6];
  const year = last.slice(0, 4);
  return first.slice(5, 7) === last.slice(5, 7)
    ? `${Number(first.slice(8))} – ${formatDay(last)} ${year}`
    : `${formatDay(first)} – ${formatDay(last)} ${year}`;
}

const minutes = (seconds: number) => Math.round(seconds / 60);

function ProgressNav({
  page,
  onNavigate,
}: {
  page: ProgressPage;
  onNavigate: (page: ProgressPage) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(["today", "week", "days"] as ProgressPage[]).map((item) => (
        <Pressable
          key={item}
          onPress={() => onNavigate(item)}
          style={page === item ? styles.activeTab : styles.tab}
        >
          <Text style={page === item ? styles.activeTabText : styles.tabText}>
            {item === "today" ? "Today" : item === "week" ? "Week" : "Days"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Header() {
  return (
    <View style={styles.progressHeader}>
      <Text style={styles.logo}>
        <Text style={styles.green}>Get</Text>Fit
      </Text>
      <View style={styles.greeting}>
        <Text style={styles.muted}>Good morning</Text>
        <Text style={styles.avatar}>👩🏻</Text>
      </View>
    </View>
  );
}

function WeekSelector({
  weekOffset,
  days,
  onChange,
}: {
  weekOffset: number;
  days: DayKey[] | null;
  onChange: (offset: number) => void;
}) {
  const atCurrentWeek = weekOffset === 0;
  return (
    <View style={styles.weekSelector}>
      <Pressable
        style={styles.weekArrow}
        onPress={() => onChange(weekOffset - 1)}
        accessibilityLabel="Previous week"
      >
        <Text style={styles.weekArrowText}>‹</Text>
      </Pressable>
      <View style={styles.weekLabel}>
        <Text style={styles.weekLabelTitle}>
          {weekOffset === 0
            ? "This week"
            : weekOffset === -1
              ? "Last week"
              : `${-weekOffset} weeks ago`}
        </Text>
        <Text style={styles.muted}>{days ? `${formatWeekRange(days)} · Mon–Sun` : " "}</Text>
      </View>
      <Pressable
        style={[styles.weekArrow, atCurrentWeek && styles.weekArrowDisabled]}
        onPress={() => !atCurrentWeek && onChange(weekOffset + 1)}
        disabled={atCurrentWeek}
        accessibilityLabel="Next week"
      >
        <Text style={styles.weekArrowText}>›</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.smallSummary}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.smallSummaryValue}>{value}</Text>
    </View>
  );
}

function DayBars({
  days,
  value,
  format,
  color,
}: {
  days: DaySummary[];
  value: (day: DaySummary) => number;
  format: (value: number) => string;
  color: (day: DaySummary) => string;
}) {
  const max = Math.max(1, ...days.map(value));
  return (
    <View style={styles.compactChart}>
      {days.map((day, index) => {
        const amount = value(day);
        const noData = day.status === "future" || (amount === 0 && day.status === "not-logged");
        return (
          <View style={styles.barColumn} key={day.day}>
            <Text style={styles.barValue}>{noData ? "–" : format(amount)}</Text>
            <View
              style={[
                styles.compactBar,
                {
                  height: amount > 0 ? Math.max(4, (amount / max) * 100) : 2,
                  backgroundColor: color(day),
                },
              ]}
            />
            <Text style={[styles.day, day.status === "future" && styles.dayFuture]}>
              {WEEKDAYS[index]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function NutritionCard({ summary }: { summary: WeekSummary }) {
  const { nutrition } = summary;
  const nothingLogged = nutrition.mealCount === 0 && nutrition.completeDays === 0;
  return (
    <View style={styles.weekCard}>
      <Text style={styles.muted}>Weekly nutrition</Text>
      <Text style={styles.chartTitle}>Food you logged</Text>
      {nothingLogged ? (
        <Text style={styles.emptyText}>No meals logged this week.</Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Stat label="Total intake" value={`${nutrition.totalCalories.toLocaleString()} kcal`} />
            <Stat
              label="Daily average"
              value={
                nutrition.averageDailyCalories === null
                  ? "—"
                  : `${nutrition.averageDailyCalories.toLocaleString()} kcal`
              }
            />
          </View>
          <Text style={styles.cardNote}>
            {nutrition.averageDailyCalories === null
              ? "The average uses complete days only. Mark days complete in the Days tab to see it."
              : `Average of ${nutrition.completeDays} complete day${nutrition.completeDays === 1 ? "" : "s"}.`}
          </Text>
          <View style={styles.summaryRow}>
            <Stat label="Protein" value={`${nutrition.protein} g`} />
            <Stat label="Carbs" value={`${nutrition.carbs} g`} />
            <Stat label="Fat" value={`${nutrition.fat} g`} />
          </View>
          <DayBars
            days={summary.days}
            value={(day) => day.calories}
            format={(value) => value.toLocaleString()}
            color={(day) => STATUS_COLORS[day.status]}
          />
          <View style={styles.legend}>
            <Text style={styles.legendItem}>
              <Text style={{ color: STATUS_COLORS.complete }}>●</Text> Complete
            </Text>
            <Text style={styles.legendItem}>
              <Text style={{ color: STATUS_COLORS.partial }}>●</Text> May be incomplete
            </Text>
            <Text style={styles.legendItem}>– Not logged</Text>
          </View>
        </>
      )}
    </View>
  );
}

function WalkingCard({ summary }: { summary: WeekSummary }) {
  const { walking } = summary;
  return (
    <View style={styles.weekCard}>
      <Text style={styles.muted}>Weekly walking</Text>
      <Text style={styles.chartTitle}>Your walks</Text>
      {walking.sessions === 0 ? (
        <Text style={styles.emptyText}>No walks recorded this week. Start one from Home.</Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Stat label="Time walked" value={`${minutes(walking.totalSeconds)} min`} />
            <Stat label="Sessions" value={String(walking.sessions)} />
            <Stat
              label="Est. burned"
              value={`~${walking.estimatedCalories.toLocaleString()} kcal`}
            />
          </View>
          <Text style={styles.cardNote}>
            {`Average ${minutes(walking.averageSecondsPerDay ?? 0)} min per day over ${summary.elapsedDays} day${summary.elapsedDays === 1 ? "" : "s"}. Burned calories are estimates (about 5 kcal per minute).`}
          </Text>
          <DayBars
            days={summary.days}
            value={(day) => minutes(day.walkingSeconds)}
            format={(value) => `${value}m`}
            color={() => "#234c39"}
          />
        </>
      )}
    </View>
  );
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const span = Math.max(...weights) - min;
  return (
    <View style={styles.weightChart}>
      {entries.map((entry) => {
        // Scaled to the recorded range so small changes are visible; values are labelled.
        const position = span === 0 ? 0.5 : (entry.weightKg - min) / span;
        const [, month, date] = entry.day.split("-").map(Number);
        return (
          <View key={entry.day} style={styles.weightColumn}>
            <View style={styles.weightPlot}>
              <View style={[styles.weightPoint, { bottom: `${position * 70}%` }]}>
                <Text style={styles.barValue}>{entry.weightKg}</Text>
                <View style={styles.weightDot} />
              </View>
            </View>
            <Text style={styles.day}>{`${date}/${month}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

function BodyCard({
  weightKg,
  heightCm,
  history,
}: {
  weightKg: number | null;
  heightCm: number | null;
  history: ReturnType<typeof useWeightHistory>;
}) {
  const bmi = calculateBmi(weightKg, heightCm);
  const trend = history.trend;
  return (
    <View style={styles.weekCard}>
      <Text style={styles.muted}>Body metrics</Text>
      <Text style={styles.chartTitle}>BMI and weight</Text>
      {bmi === null ? (
        <Text style={styles.emptyText}>Add your weight and height in Profile to see your BMI.</Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Stat label="BMI" value={bmi.toFixed(1)} />
            <Stat label="Weight" value={`${weightKg} kg`} />
            <Stat label="Height" value={`${heightCm} cm`} />
          </View>
          <Text style={styles.cardNote}>
            {`${bmiCategory(bmi)}. Based on your current profile. BMI is a general indicator: it doesn't measure body fat and isn't linked to the calories above.`}
          </Text>
        </>
      )}

      <Text style={styles.subheading}>Weight history</Text>
      {history.error ? (
        <>
          <Text style={styles.authError}>{history.error}</Text>
          <Button label="Retry" onPress={() => void history.reload()} secondary />
        </>
      ) : !trend ? (
        <Text style={styles.cardNote}>{history.loading ? "Loading weight history..." : " "}</Text>
      ) : trend.entries.length === 0 ? (
        <Text style={styles.cardNote}>
          No measurements yet. Each time you save your weight in Profile, it's added here with the
          date.
        </Text>
      ) : (
        <>
          {trend.changeKg !== null && trend.first && (
            <Text style={styles.weightChange}>
              {trend.changeKg === 0
                ? "No change"
                : `${trend.changeKg > 0 ? "+" : "−"}${Math.abs(trend.changeKg)} kg`}
              <Text style={styles.muted}>{` since ${formatDay(trend.first.day)}`}</Text>
            </Text>
          )}
          <WeightChart entries={trend.entries} />
          <Text style={styles.cardNote}>
            {trend.entries.length === 1
              ? "One measurement so far. Save your weight again on another day to see a trend."
              : `Your last ${trend.entries.length} saved measurements, as recorded. This shows past changes only, not a prediction.`}
          </Text>
        </>
      )}
    </View>
  );
}

function InsightsCard({ summary }: { summary: WeekSummary }) {
  return (
    <View style={styles.weekCard}>
      <Text style={styles.muted}>Weekly insights</Text>
      <Text style={styles.chartTitle}>What you recorded</Text>
      {weeklyInsights(summary).map((insight) => (
        <Text key={insight} style={styles.insight}>
          • {insight}
        </Text>
      ))}
    </View>
  );
}

function LoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (error)
    return (
      <View style={styles.weekCard}>
        <Text style={styles.authError}>{error}</Text>
        <Button label="Retry" onPress={onRetry} secondary />
      </View>
    );
  return <Text style={styles.emptyText}>{loading ? "Loading your week..." : " "}</Text>;
}

function TodayPage({
  consumed,
  savedBurned,
  onNavigate,
}: {
  consumed: number;
  savedBurned: number;
  onNavigate: (page: ProgressPage) => void;
}) {
  return (
    <>
      <ProgressNav page="today" onNavigate={onNavigate} />
      <View style={styles.todayBalance}>
        <Text style={styles.todayBalanceTitle}>Today so far</Text>
        <View style={styles.todayStats}>
          {[
            ["Food logged", `${consumed.toLocaleString()} kcal`],
            ["Walking (est.)", `${savedBurned.toLocaleString()} kcal`],
          ].map(([label, value]) => (
            <View style={styles.todayStat} key={label}>
              <Text style={styles.muted}>{label}</Text>
              <Text style={styles.todayStatValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <PartialEnergyCard
        title="Today's food and walking"
        food={consumed}
        walking={savedBurned}
        style={styles.progressCalorieCard}
      />
    </>
  );
}

function WeekPage({
  weekOffset,
  onChangeWeek,
  week,
  weightKg,
  heightCm,
  weightHistory,
  onNavigate,
}: {
  weekOffset: number;
  onChangeWeek: (offset: number) => void;
  week: ReturnType<typeof useWeekSummary>;
  weightKg: number | null;
  heightCm: number | null;
  weightHistory: ReturnType<typeof useWeightHistory>;
  onNavigate: (page: ProgressPage) => void;
}) {
  const { summary } = week;
  return (
    <>
      <ProgressNav page="week" onNavigate={onNavigate} />
      <WeekSelector
        weekOffset={weekOffset}
        days={summary?.week.days ?? null}
        onChange={onChangeWeek}
      />
      {!summary ? (
        <LoadState loading={week.loading} error={week.error} onRetry={week.reload} />
      ) : (
        <>
          <InsightsCard summary={summary} />
          <NutritionCard summary={summary} />
          <WalkingCard summary={summary} />
          <PartialEnergyCard
            title="This week's food and walking"
            food={summary.nutrition.totalCalories}
            walking={summary.walking.estimatedCalories}
            style={styles.weekCard}
          />
          <BodyCard weightKg={weightKg} heightCm={heightCm} history={weightHistory} />
        </>
      )}
    </>
  );
}

function DayDetailsPanel({ day }: { day: DaySummary }) {
  const { details, loading, error, reload } = useDayDetails(day.day, true);
  if (error)
    return (
      <View style={styles.dayDetails}>
        <Text style={styles.authError}>{error}</Text>
        <Button label="Retry" onPress={() => void reload()} secondary />
      </View>
    );
  if (!details)
    return (
      <View style={styles.dayDetails}>
        <Text style={styles.cardNote}>{loading ? "Loading this day..." : " "}</Text>
      </View>
    );
  return (
    <FadeIn style={styles.dayDetails}>
      <Text style={styles.subheading}>Meals</Text>
      {details.meals.length === 0 ? (
        <Text style={styles.cardNote}>
          {day.status === "complete" ? "No food this day (marked complete)." : "No meals logged."}
        </Text>
      ) : (
        details.meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
      )}
      <Text style={styles.subheading}>Walks</Text>
      {details.walks.length === 0 ? (
        <Text style={styles.cardNote}>No walks recorded.</Text>
      ) : (
        details.walks.map((walk) => (
          <View key={walk.id} style={styles.walkRow}>
            <Ionicons name="walk" size={18} color="#234c39" />
            <Text style={styles.walkRowText}>
              {`${minutes(walk.durationSeconds)} min · ~${walk.caloriesBurned} kcal`}
            </Text>
            <Text style={styles.muted}>{timeOfDay(walk.completedAt)}</Text>
          </View>
        ))
      )}
    </FadeIn>
  );
}

function DayRow({
  day,
  onSetConfirmed,
}: {
  day: DaySummary;
  onSetConfirmed: (day: DayKey, confirmed: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const future = day.status === "future";
  const complete = day.status === "complete";

  const toggle = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSetConfirmed(day.day, !complete);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update this day.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => !current);
  };

  return (
    <View style={[styles.previousCard, future && styles.dayCardFuture]}>
      <Pressable
        onPress={toggleExpanded}
        disabled={future}
        accessibilityRole="button"
        accessibilityState={{ expanded, disabled: future }}
        accessibilityHint="Shows the meals and walks logged this day"
        style={({ pressed }) => pressed && styles.pressedRow}
      >
        <View style={styles.previousTop}>
          <Text style={styles.previousDay}>{formatDay(day.day, true)}</Text>
          <View style={styles.dayHeaderRight}>
            <Text style={styles.previousIntake}>
              {future || day.status === "not-logged"
                ? "–"
                : `${day.calories.toLocaleString()} kcal`}
            </Text>
            {!future && (
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#718075" />
            )}
          </View>
        </View>
        <View style={styles.previousTop}>
          <Text style={[styles.previousMeta, { color: STATUS_TEXT_COLORS[day.status] }]}>
            {STATUS_LABELS[day.status]}
            {day.mealCount > 0 ? ` · ${day.mealCount} meal${day.mealCount === 1 ? "" : "s"}` : ""}
          </Text>
          <Text style={styles.previousMeta}>
            {day.walkingSessions > 0
              ? `${minutes(day.walkingSeconds)} min walked · ~${day.walkingCalories} kcal`
              : future
                ? ""
                : "No walks"}
          </Text>
        </View>
      </Pressable>
      {expanded && <DayDetailsPanel day={day} />}
      {!future && (
        <Pressable
          style={styles.dayToggle}
          onPress={() => void toggle()}
          disabled={saving}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: complete, busy: saving }}
        >
          <View
            style={[
              styles.dayCompleteBox,
              styles.dayToggleBox,
              complete && styles.dayCompleteBoxOn,
            ]}
          >
            {complete && <Text style={styles.dayCompleteCheck}>✓</Text>}
          </View>
          <Text style={styles.muted}>
            {saving
              ? "Saving..."
              : day.mealCount === 0 && !complete
                ? "I ate nothing this day (log complete)"
                : "Food log complete"}
          </Text>
        </Pressable>
      )}
      {error && <Text style={styles.authError}>{error}</Text>}
    </View>
  );
}

function DaysPage({
  weekOffset,
  onChangeWeek,
  week,
  onNavigate,
}: {
  weekOffset: number;
  onChangeWeek: (offset: number) => void;
  week: ReturnType<typeof useWeekSummary>;
  onNavigate: (page: ProgressPage) => void;
}) {
  const { summary } = week;
  return (
    <>
      <ProgressNav page="days" onNavigate={onNavigate} />
      <WeekSelector
        weekOffset={weekOffset}
        days={summary?.week.days ?? null}
        onChange={onChangeWeek}
      />
      {!summary ? (
        <LoadState loading={week.loading} error={week.error} onRetry={week.reload} />
      ) : (
        <>
          <Text style={styles.cardNote}>
            Mark a day complete once everything you ate is logged. Only complete days count toward
            your daily average.
          </Text>
          {summary.days.map((day) => (
            <DayRow key={day.day} day={day} onSetConfirmed={week.setConfirmed} />
          ))}
        </>
      )}
    </>
  );
}

export function ProgressScreen({
  meals,
  savedBurned,
  weightKg,
  heightCm,
  onHome,
  onProfile,
}: ProgressProps) {
  const [page, setPage] = useState<ProgressPage>("today");
  const [weekOffset, setWeekOffset] = useState(0);
  // Only fetch the week once a weekly tab is opened.
  const week = useWeekSummary(weekOffset, page !== "today");
  const weightHistory = useWeightHistory(page === "week");
  const consumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView contentContainerStyle={styles.progressContent}>
        <FadeIn key={`${page}:${weekOffset}`}>
          {page === "today" && (
            <TodayPage consumed={consumed} savedBurned={savedBurned} onNavigate={setPage} />
          )}
          {page === "week" && (
            <WeekPage
              weekOffset={weekOffset}
              onChangeWeek={setWeekOffset}
              week={week}
              weightKg={weightKg}
              heightCm={heightCm}
              weightHistory={weightHistory}
              onNavigate={setPage}
            />
          )}
          {page === "days" && (
            <DaysPage
              weekOffset={weekOffset}
              onChangeWeek={setWeekOffset}
              week={week}
              onNavigate={setPage}
            />
          )}
        </FadeIn>
      </ScrollView>
      <BottomNav
        active="progress"
        onNavigate={(tab) => (tab === "home" ? onHome() : onProfile())}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
