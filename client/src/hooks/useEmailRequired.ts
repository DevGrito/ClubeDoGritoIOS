import { useState, useEffect, useCallback } from 'react';

interface UseEmailRequiredResult {
  needsEmail: boolean;
  userId: number | null;
  userName: string | null;
  checkEmail: () => void;
  markEmailSaved: () => void;
}

export function useEmailRequired(): UseEmailRequiredResult {
  const [needsEmail, setNeedsEmail] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const checkEmail = useCallback(() => {
    const userData = localStorage.getItem('userData');
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const userPapel = localStorage.getItem('userPapel');
    
    if (userPapel !== 'doador') {
      setNeedsEmail(false);
      return;
    }

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserId(parsed.id || (storedUserId ? parseInt(storedUserId) : null));
        setUserName(parsed.nome || storedUserName || null);
        
        const hasEmail = parsed.email && parsed.email.trim() !== '';
        setNeedsEmail(!hasEmail);
      } catch {
        setNeedsEmail(false);
      }
    } else if (storedUserId) {
      setUserId(parseInt(storedUserId));
      setUserName(storedUserName);
      setNeedsEmail(true);
    } else {
      setNeedsEmail(false);
    }
  }, []);

  const markEmailSaved = useCallback(() => {
    setNeedsEmail(false);
  }, []);

  useEffect(() => {
    checkEmail();
  }, [checkEmail]);

  return {
    needsEmail,
    userId,
    userName,
    checkEmail,
    markEmailSaved,
  };
}
