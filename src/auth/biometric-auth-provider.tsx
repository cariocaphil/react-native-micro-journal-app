import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  authenticateWithBiometrics,
  getBiometricCapability,
} from '@/auth/biometric-auth';

export type AuthStatus =
  | 'checking'
  | 'locked'
  | 'authenticating'
  | 'unlocked'
  | 'unavailable';

type BiometricAuthContextValue = {
  status: AuthStatus;
  errorMessage: string | null;
  unlock: () => Promise<void>;
  clearError: () => void;
};

const BiometricAuthContext = createContext<BiometricAuthContextValue | null>(null);

type BiometricAuthProviderProps = {
  children: ReactNode;
};

export function BiometricAuthProvider({ children }: BiometricAuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const generationRef = useRef(0);
  const authenticatingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkCapability() {
      const capability = await getBiometricCapability();
      if (cancelled) {
        return;
      }

      if (capability.status === 'unavailable') {
        setStatus('unavailable');
        return;
      }

      setStatus('locked');
    }

    void checkCapability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState !== 'background') {
        return;
      }

      generationRef.current += 1;
      authenticatingRef.current = false;
      setErrorMessage(null);
      setStatus((previous) => {
        if (previous === 'unavailable' || previous === 'checking') {
          return previous;
        }
        return 'locked';
      });
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const unlock = useCallback(async () => {
    if (authenticatingRef.current) {
      return;
    }

    if (status === 'unavailable' || status === 'checking' || status === 'unlocked') {
      return;
    }

    authenticatingRef.current = true;
    const requestGeneration = generationRef.current;
    setStatus('authenticating');
    setErrorMessage(null);

    const result = await authenticateWithBiometrics();

    authenticatingRef.current = false;

    if (requestGeneration !== generationRef.current) {
      return;
    }

    switch (result.type) {
      case 'success':
        setStatus('unlocked');
        setErrorMessage(null);
        break;
      case 'cancelled':
        setStatus('locked');
        setErrorMessage('Authentication was cancelled. Try again to unlock.');
        break;
      case 'failed':
        setStatus('locked');
        setErrorMessage('Authentication failed. Try again to unlock.');
        break;
      case 'unavailable':
        setStatus('unavailable');
        setErrorMessage(null);
        break;
      case 'error':
        setStatus('locked');
        setErrorMessage(result.message);
        break;
    }
  }, [status]);

  return (
    <BiometricAuthContext.Provider value={{ status, errorMessage, unlock, clearError }}>
      {children}
    </BiometricAuthContext.Provider>
  );
}

export function useBiometricAuth(): BiometricAuthContextValue {
  const value = useContext(BiometricAuthContext);
  if (!value) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return value;
}
