import { supabase } from "./supabase";
import { imageMimeType } from "./image-data";

export async function uploadMealImage(uri: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Meal image upload: ${userError.message}`);
  if (!userData.user) {
    throw new Error("Meal image upload: Please sign in before uploading a meal photo.");
  }

  if (!/^(file|content|https?):/i.test(uri)) {
    throw new Error("Selected image has an invalid local path.");
  }

  const response = await fetch(uri);
  if (!response.ok) throw new Error("Meal image upload: Could not read the selected meal photo.");

  const fileBuffer = await response.arrayBuffer();
  const mimeType = imageMimeType(uri);
  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
  const filePath = `${userData.user.id}/${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("meal-images")
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) throw new Error(`Meal image upload: ${uploadError.message}`);

  const { data, error: signedUrlError } = await supabase.storage
    .from("meal-images")
    .createSignedUrl(filePath, 60 * 60);

  if (signedUrlError) throw new Error(`Meal image upload: ${signedUrlError.message}`);
  return { path: filePath, signedUrl: data.signedUrl };
}
