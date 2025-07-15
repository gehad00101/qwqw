"use client";

import { useState, useEffect, useCallback } from 'react';

export interface SavedSnippet {
  id: string;
  name: string;
  description: string;
  code: string;
}

const STORAGE_KEY = 'codebooks-saved-snippets';

export function useSavedSnippets() {
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        setSavedSnippets(JSON.parse(item));
      }
    } catch (error) {
      console.warn('Error reading localStorage key “' + STORAGE_KEY + '”:', error);
    }
    setIsLoaded(true);
  }, []);

  const saveToLocalStorage = (snippets: SavedSnippet[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    } catch (error) {
      console.warn('Error setting localStorage key “' + STORAGE_KEY + '”:', error);
    }
  };

  const addSnippet = useCallback((snippet: SavedSnippet) => {
    setSavedSnippets(prevSnippets => {
      if (prevSnippets.find(s => s.id === snippet.id)) {
        return prevSnippets;
      }
      const newSnippets = [snippet, ...prevSnippets];
      saveToLocalStorage(newSnippets);
      return newSnippets;
    });
  }, []);

  const removeSnippet = useCallback((snippetId: string) => {
    setSavedSnippets(prevSnippets => {
      const newSnippets = prevSnippets.filter(s => s.id !== snippetId);
      saveToLocalStorage(newSnippets);
      return newSnippets;
    });
  }, []);
  
  const isSnippetSaved = useCallback((snippetId: string) => {
    return savedSnippets.some(s => s.id === snippetId);
  }, [savedSnippets]);


  return { savedSnippets, addSnippet, removeSnippet, isSnippetSaved, isLoaded };
}
