import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Pressable, Text, TextInput, View } from "react-native";
import { timeOfDay } from "../lib/date-range";
import {
  formatUtcOffset,
  getDeviceTimeZone,
  TIME_ZONE_REGIONS,
  timeZoneCity,
} from "../lib/timezone";
import { styles } from "../styles";

/** Current zone, a "use this device's zone" button, and a manual region → city picker. */
export function TimeZonePicker({
  timeZone,
  onChange,
}: {
  timeZone: string;
  onChange: (timeZone: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState(
    () => TIME_ZONE_REGIONS.find((item) => item.zones.includes(timeZone))?.region ?? "Asia",
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the "local time now" preview fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const choose = async (next: string, source: "device" | "manual") => {
    setMessage(null);
    if (next === timeZone) {
      setMessage({ text: `Already using ${timeZoneCity(next)}.`, error: false });
      return;
    }
    setSaving(next);
    try {
      await onChange(next);
      setMessage({
        text:
          source === "device"
            ? `Set to ${timeZoneCity(next)} from this phone. Not right? Choose your region below.`
            : `Time zone set to ${timeZoneCity(next)}.`,
        error: false,
      });
      if (source === "manual") toggle(false);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not change your time zone.",
        error: true,
      });
    } finally {
      setSaving(null);
    }
  };

  const useDevice = () => {
    const deviceZone = getDeviceTimeZone();
    if (!deviceZone) {
      setMessage({ text: "This phone didn't report a time zone. Choose one below.", error: true });
      toggle(true);
      return;
    }
    void choose(deviceZone, "device");
  };

  const toggle = (next = !open) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(next);
  };

  const query = search.trim().toLowerCase();
  const zones = useMemo(() => {
    if (!query) return TIME_ZONE_REGIONS.find((item) => item.region === region)?.zones ?? [];
    return TIME_ZONE_REGIONS.flatMap((item) => item.zones).filter(
      (zone) =>
        zone.toLowerCase().includes(query) || timeZoneCity(zone).toLowerCase().includes(query),
    );
  }, [query, region]);

  return (
    <View style={styles.weekCard}>
      <Text style={styles.eyebrow}>TIME ZONE</Text>
      <View style={styles.tzCurrent}>
        <View style={styles.tzCurrentText}>
          <Text style={styles.tzCity}>{timeZoneCity(timeZone)}</Text>
          <Text style={styles.muted}>
            {`${timeZone} · ${formatUtcOffset(timeZone, now.getTime())} · ${timeOfDay(now, timeZone)} now`}
          </Text>
        </View>
        <Pressable
          onPress={useDevice}
          disabled={saving !== null}
          accessibilityRole="button"
          accessibilityLabel="Use this phone's time zone"
          style={({ pressed }) => [styles.tzLocate, pressed && styles.pressed]}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.cardNote}>
        Tap the arrow to use this phone's time zone. Days, weeks and meal times follow it.
      </Text>

      <Pressable onPress={() => toggle()} style={styles.tzToggle} accessibilityRole="button">
        <Text style={styles.switchText}>
          {open ? "Hide regions" : "Not quite right? Choose region manually"}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#4da876" />
      </Pressable>

      {message && (
        <Text style={message.error ? styles.authError : styles.authSuccess}>{message.text}</Text>
      )}

      {open && (
        <View>
          <TextInput
            placeholder="Search city, e.g. Tokyo"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            style={styles.input}
          />
          {!query && (
            <View style={styles.tzRegions}>
              {TIME_ZONE_REGIONS.map((item) => (
                <Pressable
                  key={item.region}
                  onPress={() => setRegion(item.region)}
                  style={[styles.tzChip, item.region === region && styles.tzChipActive]}
                >
                  <Text
                    style={item.region === region ? styles.tzChipTextActive : styles.tzChipText}
                  >
                    {item.region}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {zones.length === 0 && <Text style={styles.cardNote}>No matching city.</Text>}
          {zones.map((zone) => {
            const selected = zone === timeZone;
            return (
              <Pressable
                key={zone}
                onPress={() => void choose(zone, "manual")}
                disabled={saving !== null}
                style={({ pressed }) => [styles.tzRow, pressed && styles.pressedRow]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={styles.tzCurrentText}>
                  <Text style={[styles.tzRowCity, selected && styles.tzRowCitySelected]}>
                    {timeZoneCity(zone)}
                  </Text>
                  <Text style={styles.muted}>{zone}</Text>
                </View>
                <Text style={styles.muted}>
                  {saving === zone ? "Saving..." : formatUtcOffset(zone, now.getTime())}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={18} color="#12a958" />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
