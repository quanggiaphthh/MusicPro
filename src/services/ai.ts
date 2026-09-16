import { settingsService } from './settings';

export const generateWithAI = async (prompt: string, systemInstruction?: string, temperature?: number, useFallbackModel?: boolean) => {
  const settings = settingsService.getSettings();
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompt, 
      systemInstruction, 
      temperature: temperature ?? settings.temperature,
      useFallbackModel
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate');
  }

  return data.text as string;
};
