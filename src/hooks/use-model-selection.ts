'use client';

import { useState, useEffect, useCallback } from 'react';

const MODELS = ['googleai/gemini-1.5-flash-latest', 'googleai/gemini-1.5-pro-latest'];
const STORAGE_KEY = 'selectedGenkitModel';

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return MODELS[0];
    }
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item && MODELS.includes(item) ? item : MODELS[0];
    } catch (error) {
      console.error(error);
      return MODELS[0];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedModel);
    } catch (error) {
      console.error(error);
    }
  }, [selectedModel]);

  const handleSetSelectedModel = useCallback((model: string) => {
    if (MODELS.includes(model)) {
      setSelectedModel(model);
    } else {
      console.warn(`Attempted to set an unsupported model: ${model}`);
    }
  }, []);

  return {
    selectedModel,
    setSelectedModel: handleSetSelectedModel,
    models: MODELS,
  };
}
