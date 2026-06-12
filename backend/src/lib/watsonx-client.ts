import { WatsonXAI } from '@ibm-cloud/watsonx-ai';

// IBM watsonx.ai configuration
if (!process.env.WATSONX_API_KEY) {
  throw new Error(
    "WATSONX_API_KEY must be set. Get your API key from: https://cloud.ibm.com/iam/apikeys"
  );
}

if (!process.env.WATSONX_PROJECT_ID) {
  throw new Error(
    "WATSONX_PROJECT_ID must be set. Get your Project ID from your watsonx.ai project."
  );
}

// Initialize watsonx client
export const watsonxClient = WatsonXAI.newInstance({
  version: '2024-05-31',
  serviceUrl: process.env.WATSONX_API_URL || 'https://us-south.ml.cloud.ibm.com',
});

export const projectId = process.env.WATSONX_PROJECT_ID;

// Helper function to generate text with streaming support
export async function* generateTextStream(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}) {
  const params = {
    input: prompt,
    modelId: options?.model || 'ibm/granite-13b-chat-v2',
    projectId: projectId,
    parameters: {
      max_new_tokens: options?.maxTokens || 8192,
      temperature: options?.temperature || 0.7,
      top_p: options?.topP || 1,
      repetition_penalty: 1.1,
    },
  };

  try {
    const stream = await watsonxClient.generateTextStream(params);
    
    for await (const chunk of stream) {
      // The chunk is the generated text directly
      if (typeof chunk === 'string') {
        yield chunk;
      } else if ((chunk as any).results && (chunk as any).results[0]?.generated_text) {
        yield (chunk as any).results[0].generated_text;
      }
    }
  } catch (error) {
    console.error("watsonx streaming error:", error);
    throw error;
  }
}

// Helper function for non-streaming generation
export async function generateText(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}): Promise<string> {
  const params = {
    input: prompt,
    modelId: options?.model || 'ibm/granite-13b-chat-v2',
    projectId: projectId,
    parameters: {
      max_new_tokens: options?.maxTokens || 8192,
      temperature: options?.temperature || 0.7,
      top_p: options?.topP || 1,
      repetition_penalty: 1.1,
    },
  };

  try {
    const response = await watsonxClient.generateText(params);
    
    if (response.result?.results && response.result.results.length > 0) {
      return response.result.results[0].generated_text || "";
    }
    
    return "";
  } catch (error) {
    console.error("watsonx generation error:", error);
    throw error;
  }
}

// Made with Bob