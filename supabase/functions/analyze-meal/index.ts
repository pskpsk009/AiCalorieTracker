import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) throw new Error("Auth: missing authorization header.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user)
      throw new Error(`Auth: ${userError?.message ?? "you must be signed in."}`);

    const { imageBase64, mimeType = "image/jpeg" } = await request.json();
    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      throw new Error("Analysis: image data is missing.");
    }
    if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      throw new Error("Analysis: invalid image type.");
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey)
      throw new Error("Gemini: GEMINI_API_KEY is not configured in Edge Function secrets.");

    const geminiRequest = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Identify the visible foods and estimate portions. Return only JSON matching {"items":[{"name":string,"grams":number,"calories":number,"protein":number,"carbs":number,"fat":number}]} . If uncertain, make a reasonable estimate.',
              },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    };
    const models = ["gemini-3.6-flash", "gemini-3.7-flash"];
    let geminiResponse = new Response(null, { status: 503 });
    for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          geminiRequest,
        );
        if (geminiResponse.ok) break;
        const canRetry = [404, 429, 503].includes(geminiResponse.status);
        if (!canRetry || attempt === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
      if (geminiResponse.ok) break;
      if (![404, 429, 503].includes(geminiResponse.status)) break;
    }
    if (!geminiResponse.ok)
      throw new Error(`Gemini (${geminiResponse.status}): ${await geminiResponse.text()}`);

    const geminiJson = await geminiResponse.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini: returned no analysis.");
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const analysis = JSON.parse(cleanedText);
    if (!analysis || !Array.isArray(analysis.items)) {
      throw new Error("Gemini: response did not contain an items array.");
    }
    return new Response(JSON.stringify({ items: analysis.items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
