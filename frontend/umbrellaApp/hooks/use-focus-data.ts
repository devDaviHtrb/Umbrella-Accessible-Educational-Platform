import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

export function useFocusData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const result = await loaderRef.current();
      if (!isActive()) return;
      setData(result);
      setError(false);
    } catch {
      if (!isActive()) return;
      setError(true);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  const reload = useCallback(() => load(), [load]);

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    return load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  return { data, loading, error, reload, retry };
}
