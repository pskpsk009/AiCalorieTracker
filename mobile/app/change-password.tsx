import { useLocalSearchParams } from "expo-router";
import { GetFitApp } from "../App";

export default function ChangePasswordRoute() {
  const { recovery } = useLocalSearchParams<{ recovery?: string }>();
  return <GetFitApp initialScreen="change-password" recovery={recovery === "1"} />;
}
