import React, { useState, useCallback } from 'react';
import type { Idea } from '../types';
import { generateIdeas } from '../services/geminiService';
import { KEY_BIBLICAL_FIGURES } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';

interface KeyFiguresExplorerProps {
    onSelectIdea: (idea: Idea) => void;
    setIsLoading: (loading: boolean) => void;
    onError: (error: unknown) => void;
}

const KeyFiguresExplorer: React.FC<KeyFiguresExplorerProps> = ({ onSelectIdea, setIsLoading, onError }) => {
    const [selectedFigure, setSelectedFigure] = useState<string | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { lang } = useLanguage();
    const t = useTranslations();

    const fetchIdeasForFigure = useCallback(async (figureId: string) => {
        const figureInfo = KEY_BIBLICAL_FIGURES.find(f => f.id === figureId);
        if (!figureInfo) return;

        setSelectedFigure(figureId);
        setIsFetching(true);
        setIsLoading(true);
        try {
            const newIdeas = await generateIdeas(lang, undefined, 'BIBLICAL_FIGURE_EXPLORER', t(figureInfo.translationKey as any));
            setIdeas(newIdeas);
        } catch (err) {
            onError(err);
        } finally {
            setIsFetching(false);
            setIsLoading(false);
        }
    }, [setIsLoading, onError, lang, t]);

    const handleBack = () => {
        setSelectedFigure(null);
        setIdeas([]);
    };

    const filteredFigures = KEY_BIBLICAL_FIGURES.filter(figure => 
        t(figure.translationKey as any).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedFigure) {
        return (
            <div className="space-y-6">
                <div className="flex justify-start">
                    <Button onClick={handleBack} variant="secondary">
                        &larr; {t('backToTopics')}
                    </Button>
                </div>
                {isFetching ? (
                    <div className="flex justify-center items-center py-10">
                        <Spinner />
                        <span className="ml-4 text-lg">{t('generatingIdeas')}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ideas.map((idea) => (
                            <Card key={idea.title} className="flex flex-col h-full hover:border-amber-500 transition-all duration-300">
                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold text-amber-300">{idea.title}</h3>
                                    <p className="mt-2 text-gray-400">{idea.description}</p>
                                </div>
                                <div className="p-4 bg-gray-800/50 flex justify-end items-center">
                                    <Button onClick={() => onSelectIdea(idea)} size="sm">{t('createScript')}</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-4">{t('keyFiguresExplorerTitle')}</h2>
                <p className="mb-2 text-gray-400">
                    {t('keyFiguresExplorerDescription')}
                </p>
                <div className="mb-6 sticky top-0 bg-gray-800 py-2">
                     <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('searchFigurePlaceholder')}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredFigures.map(figure => (
                            <button
                                key={figure.id}
                                onClick={() => fetchIdeasForFigure(figure.id)}
                                className="p-3 bg-gray-700 rounded-lg text-center hover:bg-amber-800/50 hover:border-amber-600 border border-transparent transition-all duration-300 flex items-center justify-center h-20"
                            >
                                <span className="font-semibold text-white text-sm">{t(figure.translationKey as any)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default KeyFiguresExplorer;