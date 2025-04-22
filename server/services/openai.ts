import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development" });

// Function to suggest scheduling based on property availability and task urgency
export async function suggestSchedule(params: {
  propertyId: number;
  taskTitle: string;
  taskDescription: string;
  urgency: string;
  availabilityWindows: Array<{ start: string; end: string }>; // ISO date strings
  currentTasks: Array<{ title: string; scheduledTime: string; duration: number }>; // duration in minutes
}): Promise<{
  suggestedSlots: Array<{ start: string; end: string; confidence: number }>;
  explanation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI scheduling assistant for a vacation rental property management system. " +
            "Your task is to suggest optimal time slots for maintenance tasks based on the property's " +
            "availability, task urgency, and existing scheduled tasks. Provide JSON output with suggested " +
            "time slots and a brief explanation of your reasoning."
        },
        {
          role: "user",
          content: JSON.stringify(params)
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      suggestedSlots: result.suggestedSlots || [],
      explanation: result.explanation || "No explanation provided by AI"
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to generate AI scheduling suggestions: ${error.message}`);
  }
}

// Function to analyze maintenance request and assign priority
export async function analyzeMaintenanceRequest(taskDescription: string): Promise<{
  suggestedUrgency: "high" | "medium" | "low";
  reasoning: string;
  estimatedDuration: number; // duration in minutes
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant for a vacation rental maintenance system. " +
            "Analyze the maintenance task description and determine its urgency (high, medium, or low), " +
            "provide reasoning, and estimate the time required to complete the task in minutes. " +
            "Respond with a JSON object containing suggestedUrgency, reasoning, and estimatedDuration fields."
        },
        {
          role: "user",
          content: taskDescription
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      suggestedUrgency: result.suggestedUrgency || "medium",
      reasoning: result.reasoning || "No reasoning provided",
      estimatedDuration: result.estimatedDuration || 60
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      suggestedUrgency: "medium",
      reasoning: "Failed to analyze with AI. Defaulting to medium urgency.",
      estimatedDuration: 60
    };
  }
}

// Function to generate a maintenance checklist based on property type
export async function generateMaintenanceChecklist(propertyType: string): Promise<{
  items: Array<{ task: string; frequency: string; importance: string }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant for vacation rental maintenance. Generate a maintenance checklist " +
            "for a specific property type. Include regular maintenance tasks, their recommended frequency, " +
            "and importance level. Respond with a JSON object containing an array of items."
        },
        {
          role: "user",
          content: `Generate a maintenance checklist for a ${propertyType} property type.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      items: result.items || []
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to generate maintenance checklist: ${error.message}`);
  }
}
