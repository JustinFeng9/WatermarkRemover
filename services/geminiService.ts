import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "./utils";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const removeWatermarkFromImage = async (file: File): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }

  try {
    const base64Data = await fileToBase64(file);
    
    // We use gemini-2.5-flash-image for general image editing tasks as per guidelines.
    // It is efficient and capable of following instructions to modify images.
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: "Remove all watermarks, logos, and text overlays from this image. Reconstruct the background behind the removed elements seamlessly to look natural. Maintain the original image quality and resolution as much as possible. Output only the processed image.",
          },
        ],
      },
    });

    // Extract the image from the response
    let processedImageUrl = '';
    
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                processedImageUrl = `data:image/png;base64,${base64EncodeString}`;
                break; 
            }
        }
    }

    if (!processedImageUrl) {
      throw new Error("No image data received from the model.");
    }

    return processedImageUrl;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image.");
  }
};