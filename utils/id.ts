export const generateId = (): string => {
  // Simple implementation that creates a random string
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}; 