/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a label from a type string (e.g., "high-meat" → "High Meat")
 */
export function formatLabel(value: string): string {
  if (!value) return "";
  if (value === "high-meat") return "High Meat";
  return capitalize(value.replace(/-/g, " "));
}
