
import React, { createContext, useState, useMemo } from 'react';
import type { Lang } from '../types';

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Lang>('en-US');

    const value = useMemo(() => ({ lang, setLang }), [lang]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
