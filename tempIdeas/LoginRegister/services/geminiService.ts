import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFantasyAnalysis = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();
    
    // Using gemini-3-pro-preview with thinking budget as requested
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768 // Maximum budget for deep reasoning on fantasy stats
        },
        // Do not set maxOutputTokens when using thinking budget unless necessary, 
        // but here we want full analysis capabilities.
      }
    });

    return response.text || "Analysis complete, but no textual output was generated.";
  } catch (error) {
    console.error("Error generating fantasy analysis:", error);
    return "System Error: Neural link unstable. Unable to process fantasy data at this time.";
  }
};