import { apiRequest } from './queryClient';

/**
 * Request AI-powered scheduling suggestions for maintenance tasks
 */
export async function getAiScheduleSuggestions(params: {
  propertyId: number;
  taskTitle: string;
  taskDescription: string;
  urgency: string;
  availabilityWindows: Array<{ start: string; end: string }>;
}) {
  try {
    const response = await apiRequest('POST', '/api/schedule', params);
    return await response.json();
  } catch (error) {
    console.error('Error getting AI schedule suggestions:', error);
    throw error;
  }
}

/**
 * Create a maintenance task with AI-suggested scheduling
 */
export async function createScheduledTask(params: {
  title: string;
  description: string;
  propertyId: number;
  assignedTo?: number;
  urgency: string;
  suggestedSlot: { start: string; end: string };
}) {
  try {
    const response = await apiRequest('POST', '/api/schedule/task', params);
    return await response.json();
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    throw error;
  }
}

/**
 * Generate a maintenance checklist for a property type
 */
export async function generateMaintenanceChecklist(propertyType: string) {
  // In a real implementation, this would call the backend API
  // For now, we'll simulate a response that would normally come from OpenAI
  const checklists = {
    'Beach House': [
      { task: 'Check HVAC system', frequency: 'Monthly', importance: 'High' },
      { task: 'Inspect for salt corrosion', frequency: 'Monthly', importance: 'High' },
      { task: 'Clean sand from outdoor areas', frequency: 'Weekly', importance: 'Medium' },
      { task: 'Test water quality', frequency: 'Monthly', importance: 'High' },
      { task: 'Check for humidity damage', frequency: 'Bi-weekly', importance: 'Medium' }
    ],
    'Cabin': [
      { task: 'Inspect fireplace and chimney', frequency: 'Quarterly', importance: 'High' },
      { task: 'Check for pest intrusion', frequency: 'Monthly', importance: 'Medium' },
      { task: 'Inspect roof for snow damage', frequency: 'Seasonally', importance: 'High' },
      { task: 'Test smoke and CO detectors', frequency: 'Monthly', importance: 'High' },
      { task: 'Check plumbing for freezing issues', frequency: 'Seasonally', importance: 'High' }
    ],
    'Apartment': [
      { task: 'Test smoke detectors', frequency: 'Monthly', importance: 'High' },
      { task: 'Check appliances', frequency: 'Quarterly', importance: 'Medium' },
      { task: 'Inspect plumbing fixtures', frequency: 'Quarterly', importance: 'Medium' },
      { task: 'Clean air vents', frequency: 'Bi-annually', importance: 'Medium' },
      { task: 'Check locks and security systems', frequency: 'Quarterly', importance: 'High' }
    ],
    'default': [
      { task: 'General cleaning', frequency: 'Bi-weekly', importance: 'Medium' },
      { task: 'Check smoke detectors', frequency: 'Monthly', importance: 'High' },
      { task: 'Inspect HVAC system', frequency: 'Quarterly', importance: 'Medium' },
      { task: 'Check plumbing fixtures', frequency: 'Monthly', importance: 'Medium' },
      { task: 'Inspect electrical outlets', frequency: 'Quarterly', importance: 'Medium' }
    ]
  };
  
  // Match the property type to a checklist or use default
  const matchedChecklist = checklists[propertyType] || checklists['default'];
  
  return { items: matchedChecklist };
}
