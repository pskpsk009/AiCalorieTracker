import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles";
import { Button, Header } from "./shared";

export function AddMealScreen({
  onBack,
  onAnalyze,
}: {
  onBack: () => void;
  onAnalyze: (photoUri: string) => Promise<void>;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!photoUri) return;
    setUploadError(null);
    setUploading(true);
    try {
      await onAnalyze(photoUri);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Add Your Meal" onBack={onBack} />
      <View style={styles.addContent}>
        <Pressable style={styles.camera} onPress={choosePhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.mealPhoto} />
          ) : (
            <Text style={styles.cameraEmoji}>📷</Text>
          )}
          <Text style={styles.cameraTitle}>{photoUri ? "Photo ready" : "Show us your plate"}</Text>
          <Text style={styles.muted}>
            {photoUri ? "Tap Analyze Meal to continue" : "Tap to choose a photo"}
          </Text>
        </Pressable>
        <Button label="Take Picture" onPress={takePhoto} />
        <Button label="Choose From Gallery" onPress={choosePhoto} secondary />
        <View style={styles.bottom}>
          <Button
            label={uploading ? "Uploading..." : "Analyze Meal"}
            onPress={handleAnalyze}
            secondary={!photoUri || uploading}
          />
          {uploadError && <Text style={styles.uploadError}>{uploadError}</Text>}
        </View>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
