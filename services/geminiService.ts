
import { GoogleGenAI, Type } from "@google/genai";
import { TimelineData, TimelineItem, WBSItem } from "../types";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseGanttImage = async (base64Image: string): Promise<TimelineData> => {
  const ai = getAiClient();

  const prompt = `
    Analyze this project schedule / Gantt chart image.
    Extract the timeline data into a structured JSON format.
    
    Identified Rows usually include things like "Milestones", "Development Plan", "Sample Plan", "Verification Plan".
    Extract the specific dates for each item.
    
    If an item is a single point (diamond icon), treat it as a 'milestone'.
    If an item is a bar spanning a duration, treat it as a 'range'.
    
    For the start and end date of the whole timeline, look at the header months/years.
    
    Format dates as YYYY-MM-DD.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            startDate: { type: Type.STRING, description: "Timeline start YYYY-MM-DD" },
            endDate: { type: Type.STRING, description: "Timeline end YYYY-MM-DD" },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  height: { type: Type.NUMBER, description: "Estimated height in pixels, default 100" }
                },
                required: ["id", "label"]
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  rowId: { type: Type.STRING, description: "Must match one of the row ids" },
                  label: { type: Type.STRING },
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  endDate: { type: Type.STRING, description: "YYYY-MM-DD, only for ranges" },
                  type: { type: Type.STRING, enum: ["milestone", "range", "task"] },
                  isCritical: { type: Type.BOOLEAN, description: "True if it has a red star or important marker" }
                },
                required: ["id", "rowId", "label", "date", "type"]
              }
            }
          },
          required: ["title", "rows", "items", "startDate", "endDate"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    return JSON.parse(text) as TimelineData;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateWBS = async (rowLabel: string, existingItems: TimelineItem[]): Promise<WBSItem[]> => {
  const ai = getAiClient();
  
  const itemsContext = existingItems.map(i => `${i.label} (${i.date}${i.endDate ? ' to ' + i.endDate : ''})`).join(", ");

  const prompt = `
    Create a detailed Work Breakdown Structure (WBS) for the project phase: "${rowLabel}".
    
    Context - Current High Level Items in this phase: 
    ${itemsContext}
    
    Requirements:
    1. Generate specific, actionable sub-tasks (Level 1).
    2. Where appropriate, break Level 1 tasks into Level 2 sub-tasks.
    3. Assign realistic Start Dates and End Dates for each task. These dates MUST align roughly with the high-level items in the context.
    4. Format dates as YYYY-MM-DD.
  `;

  // Helper to define the recursive schema structure
  const wbsItemSchemaProperties = {
    id: { type: Type.STRING },
    taskName: { type: Type.STRING },
    startDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    endDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    duration: { type: Type.STRING, description: "e.g., '5 days'" },
    owner: { type: Type.STRING, description: "Role" },
    status: { type: Type.STRING, enum: ["Pending", "In Progress", "Done"] },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ...wbsItemSchemaProperties,
              subTasks: {
                type: Type.ARRAY,
                items: {
                   type: Type.OBJECT,
                   properties: wbsItemSchemaProperties,
                   required: ["id", "taskName", "startDate", "endDate", "status"]
                }
              }
            },
            required: ["id", "taskName", "startDate", "endDate", "duration", "owner", "status"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as WBSItem[];
  } catch (error) {
    console.error("Gemini WBS Error:", error);
    return [];
  }
};
