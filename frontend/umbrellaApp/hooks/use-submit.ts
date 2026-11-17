import { useCallback, useRef, useState } from 'react';

type UseSubmitOptions = {
  errorMessage?: string;
  resetOnSuccess?: boolean;
};

export function useSubmit<T>(
  action: (input: T) => Promise<unknown>,
  { errorMessage = 'Não foi possível salvar. Tente novamente.', resetOnSuccess = false }: UseSubmitOptions = {},
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const busy = useRef(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  const submit = useCallback(
    async (input: T) => {
      if (busy.current) return;
      busy.current = true;
      setSubmitting(true);
      setError(undefined);

      try {
        await actionRef.current(input);
        if (resetOnSuccess) {
          busy.current = false;
          setSubmitting(false);
        }
      } catch {
        busy.current = false;
        setSubmitting(false);
        setError(errorMessage);
      }
    },
    [errorMessage, resetOnSuccess],
  );

  const reset = useCallback(() => setError(undefined), []);

  return { submit, submitting, error, reset };
}
