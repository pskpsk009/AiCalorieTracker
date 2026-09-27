import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { Meal } from "../lib/app-state";
import { styles } from "../styles";

type ProgressPage = "today" | "week" | "previous";

type ProgressProps = {
  meals: Meal[];
  savedBurned: number;
  onHome: () => void;
  onProfile: () => void;
};

function ProgressNav({
  page,
  onNavigate,
}: {
  page: ProgressPage;
  onNavigate: (page: ProgressPage) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(["today", "week", "previous"] as ProgressPage[]).map((item) => (
        <Pressable
          key={item}
          onPress={() => onNavigate(item)}
          style={page === item ? styles.activeTab : styles.tab}
        >
          <Text style={page === item ? styles.activeTabText : styles.tabText}>
            {item === "today" ? "Today" : item === "week" ? "This Week" : "Previous"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function BottomNav({ onHome, onProfile }: Pick<ProgressProps, "onHome" | "onProfile">) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={styles.navItemButton} onPress={onHome}>
        <Text style={styles.navItemText}>⌂ Home</Text>
      </Pressable>
      <View style={styles.navActive}>
        <Text style={styles.navActiveText}>▥ Progress</Text>
      </View>
      <Pressable style={styles.navItemButton} onPress={onProfile}>
        <Text style={styles.navItemText}>◉ Profile</Text>
      </Pressable>
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

function TodayPage({
  consumed,
  savedBurned,
  onNavigate,
}: {
  consumed: number;
  savedBurned: number;
  onNavigate: (page: ProgressPage) => void;
}) {
  const net = consumed - savedBurned;
  const difference = net - 1800;
  return (
    <>
      <ProgressNav page="today" onNavigate={onNavigate} />
      <View style={styles.todayBalance}>
        <Text style={styles.todayBalanceTitle}>Today's balance</Text>
        <View style={styles.todayStats}>
          {[
            ["Consumed", consumed],
            ["Walking", savedBurned],
            ["Net", net],
          ].map(([label, value]) => (
            <View style={styles.todayStat} key={String(label)}>
              <Text style={styles.muted}>{label}</Text>
              <Text style={styles.todayStatValue}>{Number(value).toLocaleString()} kcal</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.progressCalorieCard}>
        <View style={styles.calorieHeading}>
          <Text style={styles.fire}>♨</Text>
          <Text style={styles.calorieTitle}>Calorie Summary</Text>
        </View>
        <View style={styles.calorieLine}>
          <Text style={styles.muted}>Consumed</Text>
          <Text style={styles.calorieValue}>{consumed.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.calorieLine}>
          <Text style={styles.muted}>Burned walking</Text>
          <Text style={styles.burnedValue}>- {savedBurned} kcal</Text>
        </View>
        <View style={styles.calorieDivider} />
        <View style={styles.calorieLine}>
          <Text style={styles.netLabel}>Net Calories</Text>
          <Text style={styles.netValue}>{net.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.deficit}>
          <Text style={styles.deficitLabel}>COMPARED WITH YOUR 1,800 KCAL REFERENCE</Text>
          <Text style={styles.deficitValue}>
            {Math.abs(difference).toLocaleString()} kcal{" "}
            {difference > 0 ? "surplus" : difference < 0 ? "deficit" : "balanced"}
          </Text>
        </View>
      </View>
    </>
  );
}

function WeekPage({
  meals,
  savedBurned,
  onNavigate,
}: {
  meals: Meal[];
  savedBurned: number;
  onNavigate: (page: ProgressPage) => void;
}) {
  const todayCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const weekly = [1850, 2050, 1720, 1940, todayCalories, 2100, 1650];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <>
      <ProgressNav page="week" onNavigate={onNavigate} />
      <View style={styles.chartCard}>
        <View style={styles.chartHeading}>
          <View>
            <Text style={styles.muted}>Weekly overview</Text>
            <Text style={styles.chartTitle}>Intake comparison</Text>
          </View>
          <Text style={styles.chartIcon}>▥</Text>
        </View>
        <View style={styles.chart}>
          {weekly.map((value, index) => (
            <View style={styles.barColumn} key={days[index]}>
              <Text style={styles.barValue}>{value}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(40, (value / 2300) * 140),
                    backgroundColor: index === 4 ? "#f16d59" : "#16b65b",
                  },
                ]}
              />
              <Text style={styles.day}>{days[index]}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.smallSummary}>
            <Text style={styles.muted}>Today's walking</Text>
            <Text style={styles.smallSummaryValue}>{savedBurned} kcal</Text>
          </View>
          <View style={styles.smallSummary}>
            <Text style={styles.muted}>Today's net</Text>
            <Text style={styles.smallSummaryValue}>{todayCalories - savedBurned} kcal</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function PreviousPage({ onNavigate }: { onNavigate: (page: ProgressPage) => void }) {
  const days = [
    { day: "Mon", intake: 1850, walking: 210 },
    { day: "Tue", intake: 2050, walking: 280 },
    { day: "Wed", intake: 1720, walking: 175 },
    { day: "Thu", intake: 1940, walking: 240 },
    { day: "Sat", intake: 2100, walking: 320 },
    { day: "Sun", intake: 1650, walking: 190 },
  ];
  return (
    <>
      <ProgressNav page="previous" onNavigate={onNavigate} />
      <View style={styles.previousHeading}>
        <Text style={styles.previousTitle}>Previous days</Text>
        <Text style={styles.muted}>Intake · walking · net</Text>
      </View>
      {days.map((item) => (
        <View style={styles.previousCard} key={item.day}>
          <View style={styles.previousTop}>
            <Text style={styles.previousDay}>{item.day}</Text>
            <Text style={styles.previousIntake}>{item.intake.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.previousTop}>
            <Text style={styles.previousMeta}>Walking -{item.walking} kcal</Text>
            <Text style={styles.previousMeta}>Net {item.intake - item.walking} kcal</Text>
          </View>
          <View style={styles.previousBar}>
            <View
              style={[
                styles.previousBarFill,
                { width: `${Math.min(100, (item.intake / 2200) * 100)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </>
  );
}

export function ProgressScreen({ meals, savedBurned, onHome, onProfile }: ProgressProps) {
  const [page, setPage] = useState<ProgressPage>("today");
  const consumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView contentContainerStyle={styles.progressContent}>
        {page === "today" && (
          <TodayPage consumed={consumed} savedBurned={savedBurned} onNavigate={setPage} />
        )}
        {page === "week" && (
          <WeekPage meals={meals} savedBurned={savedBurned} onNavigate={setPage} />
        )}
        {page === "previous" && <PreviousPage onNavigate={setPage} />}
      </ScrollView>
      <BottomNav onHome={onHome} onProfile={onProfile} />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
