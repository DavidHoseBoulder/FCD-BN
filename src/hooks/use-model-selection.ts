'use client';

import { useState, useEffect, useCallback } from 'react';

const MODELS = ['googleai/gemini-1.5-flash-latest', 'googleai/gemini-1.5-pro-latest'];
const STORAGE_KEY = 'selectedGenkitModel';

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item && MODELS.includes(item)) {
          setSelectedModel(item);
        }
      } catch (error) {
        console.error('Failed to read from localStorage', error);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem(STORAGE_KEY, selectedModel);
      } catch (error) {
        console.error('Failed to write to localStorage', error);
      }
    }
  }, [selectedModel, isMounted]);

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
