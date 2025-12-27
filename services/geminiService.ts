
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedText } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCaptionSuggestions = async (imageBuffer: string) => {
  try {
    const base64Data = imageBuffer.split(',')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: "Suggest 3 creative slogans for this image. Return as a JSON array of strings." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    return ["Inspire", "Create", "Design"];
  }
};

export const detectTextInImage = async (imageBuffer: string): Promise<DetectedText[]> => {
  try {
    const base64Data = imageBuffer.split(',')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { 
              text: "Find all text in this image. For each text element, provide the string and its bounding box in normalized coordinates [ymin, xmin, ymax, xmax] (0-1000). Return ONLY a JSON array of objects with keys 'text', 'ymin', 'xmin', 'ymax', 'xmax'." 
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
            },
            required: ["text", "ymin", "xmin", "ymax", "xmax"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Text detection failed:", error);
    return [];
  }
};
