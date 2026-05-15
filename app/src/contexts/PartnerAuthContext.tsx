import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/api';

interface PartnerConsultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  commissionPercent?: number;
  accessChannel?: string;
  status?: string;
}

interface PartnerAuthContextType {
  partnerToken: string | null;
  consultant: PartnerConsultant | null;
  isLoading: boolean;
  partnerLogin: (email: string, password: string) => Promise<void>;
  partnerLogout: () => void;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | null>(null);

const PARTNER_TOKEN_KEY = 'partner_token';
const PARTNER_USER_KEY = 'partner_user';

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [partnerToken, setPartnerToken] = useState<string | null>(
    () => localStorage.getItem(PARTNER_TOKEN_KEY),
  );
  const [consultant, setConsultant] = useState<PartnerConsultant | null>(() => {
    try {
      const stored = localStorage.getItem(PARTNER_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Re-fetch profile on mount if token exists
  useEffect(() => {
    if (partnerToken && !consultant) {
      api.getPartnerMe(partnerToken)
        .then((data) => {
          setConsultant(data);
          localStorage.setItem(PARTNER_USER_KEY, JSON.stringify(data));
        })
        .catch(() => {
          // Token inválido — limpar
          setPartnerToken(null);
          localStorage.removeItem(PARTNER_TOKEN_KEY);
          localStorage.removeItem(PARTNER_USER_KEY);
        });
    }
  }, [partnerToken, consultant]);

  const partnerLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.partnerLogin(email, password);
      const token = data.access_token;
      const consultantData = data.consultant;

      setPartnerToken(token);
      setConsultant(consultantData);
      localStorage.setItem(PARTNER_TOKEN_KEY, token);
      localStorage.setItem(PARTNER_USER_KEY, JSON.stringify(consultantData));
    } finally {
      setIsLoading(false);
    }
  };

  const partnerLogout = () => {
    setPartnerToken(null);
    setConsultant(null);
    localStorage.removeItem(PARTNER_TOKEN_KEY);
    localStorage.removeItem(PARTNER_USER_KEY);
  };

  return (
    <PartnerAuthContext.Provider value={{ partnerToken, consultant, isLoading, partnerLogin, partnerLogout }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx) throw new Error('usePartnerAuth must be used inside PartnerAuthProvider');
  return ctx;
}
