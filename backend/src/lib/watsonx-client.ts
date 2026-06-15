const watsonxApiKey =
  process.env.WATSONX_API_KEY ||
  process.env.AI_INTEGRATIONS_IBM_WATSONX_API_KEY;

const watsonxProjectId =
  process.env.WATSONX_PROJECT_ID ||
  process.env.AI_INTEGRATIONS_IBM_WATSONX_PROJECT_ID;

const watsonxApiUrl =
  process.env.WATSONX_API_URL ||
  process.env.AI_INTEGRATIONS_IBM_WATSONX_URL ||
  "https://us-south.ml.cloud.ibm.com";

const watsonxVersion = process.env.WATSONX_API_VERSION || "2023-05-29";

if (!watsonxApiKey) {
  throw new Error(
    "WATSONX_API_KEY or AI_INTEGRATIONS_IBM_WATSONX_API_KEY must be set. Get your API key from: https://cloud.ibm.com/iam/apikeys"
  );
}

if (!watsonxProjectId) {
  throw new Error(
    "WATSONX_PROJECT_ID or AI_INTEGRATIONS_IBM_WATSONX_PROJECT_ID must be set. Get your Project ID from your watsonx.ai project."
  );
}

const resolvedWatsonxApiKey = watsonxApiKey;
export const projectId = watsonxProjectId;

type GenerateOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
};

type WatsonxGenerateResponse = {
  model_id?: string;
  results?: Array<{
    generated_text?: string;
  }>;
};

let cachedIamToken: string | null = null;
let cachedIamTokenExpiresAt = 0;

async function getIamToken(): Promise<string> {
  const now = Date.now();

  if (cachedIamToken && now < cachedIamTokenExpiresAt - 60_000) {
    return cachedIamToken;
  }

  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(
      resolvedWatsonxApiKey
    )}`,
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    errorMessage?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Failed to obtain IBM IAM token (${response.status}): ${JSON.stringify(data)}`
    );
  }

  cachedIamToken = data.access_token;
  cachedIamTokenExpiresAt = now + (data.expires_in ?? 3600) * 1000;

  return cachedIamToken;
}

async function requestTextGeneration(
  prompt: string,
  options?: GenerateOptions
): Promise<WatsonxGenerateResponse> {
  const token = await getIamToken();

  const response = await fetch(
    `${watsonxApiUrl}/ml/v1/text/generation?version=${encodeURIComponent(
      watsonxVersion
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input: prompt,
        model_id: options?.model || "ibm/granite-13b-chat-v2",
        project_id: projectId,
        parameters: {
          max_new_tokens: options?.maxTokens || 8192,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 1,
          repetition_penalty: 1.1,
        },
      }),
    }
  );

  const data = (await response.json()) as WatsonxGenerateResponse & {
    errors?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      `watsonx generation failed (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function* generateTextStream(
  prompt: string,
  options?: GenerateOptions
) {
  try {
    const response = await requestTextGeneration(prompt, options);
    const text = response.results?.[0]?.generated_text ?? "";

    if (text) {
      yield text;
    }
  } catch (error) {
    console.error("watsonx streaming error:", error);
    throw error;
  }
}

export async function generateText(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  try {
    const response = await requestTextGeneration(prompt, options);
    return response.results?.[0]?.generated_text ?? "";
  } catch (error) {
    console.error("watsonx generation error:", error);
    throw error;
  }
}

// Made with Bob