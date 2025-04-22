import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: string | Date): string {
  if (!date) return "N/A";
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function formatDate(date: string | Date, formatString: string = "MMM dd, yyyy"): string {
  if (!date) return "N/A";
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatString);
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + "...";
}

export function getUrgencyClass(urgency: string): string {
  switch (urgency?.toLowerCase()) {
    case 'high':
      return 'urgent-high';
    case 'medium':
      return 'urgent-medium';
    case 'low':
      return 'urgent-low';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPropertyTypeClass(type: string): string {
  if (!type) return 'bg-gray-100 text-gray-800';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('beach') || lowerType.includes('ocean')) {
    return 'property-type-beach';
  } else if (lowerType.includes('cabin') || lowerType.includes('mountain')) {
    return 'property-type-cabin';
  } else if (lowerType.includes('apartment') || lowerType.includes('loft')) {
    return 'property-type-apartment';
  }
  
  return 'bg-gray-100 text-gray-800';
}

export function getInventoryStatusClass(currentStock: number, threshold: number): string {
  if (currentStock < threshold / 2) {
    return 'inventory-critical';
  } else if (currentStock < threshold) {
    return 'inventory-low';
  } else {
    return 'inventory-good';
  }
}

export function getInventoryStatusText(currentStock: number, threshold: number): string {
  if (currentStock < threshold / 2) {
    return 'Critical';
  } else if (currentStock < threshold) {
    return 'Low';
  } else {
    return 'Good';
  }
}

export function generateColorFromString(input: string): string {
  if (!input) return '#0f766e'; // Default primary color
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}
