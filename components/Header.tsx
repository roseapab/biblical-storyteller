
import React from 'react';
import Button from './ui/Button';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';
import type { Lang } from '../types';

interface HeaderProps {
    onSave: () => void;
    onLoad: () => void;
    onNew: () => void;
    onTutorial: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSave, onLoad, onNew, onTutorial }) => {
    const { lang, setLang } = useLanguage();
    const t = useTranslations();

    const handleLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLang(event.target.value as Lang);
    };

    const langOptions = [
        { value: 'en-US', label: t('langAmericanEnglish') },
        { value: 'en-GB', label: t('langBritishEnglish') },
        { value: 'es-ES', label: t('langSpanishSpain') },
        { value: 'es-SA', label: t('langSpanishSouthAmerica') },
    ];

    return (
        <header className="bg-gray-800 shadow-lg">
            <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">{t('appTitle')}</h1>
                    <Button onClick={onTutorial} variant="secondary" size="sm">{t('tutorialButton')}</Button>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                     <div className="flex-shrink-0">
                        <label htmlFor="language-select" className="sr-only">{t('langSelectLabel')}</label>
                        <select
                            id="language-select"
                            value={lang}
                            onChange={handleLangChange}
                            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            {langOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={onNew} variant="secondary" size="sm">{t('newProject')}</Button>
                    <Button onClick={onSave} variant="secondary" size="sm">{t('saveProject')}</Button>
                    <Button onClick={onLoad} variant="secondary" size="sm">{t('loadProject')}</Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
