
import React, { useState, useCallback } from 'react';
import type { Idea } from '../types';
import { generateIdeas } from '../services/geminiService';
import { JESUS_LIFE_TOPICS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';

interface JesusLifeExplorerProps {
    onSelectIdea: (idea: Idea) => void;
    setIsLoading: (loading: boolean) => void;
    onError: (error: unknown) => void;
}

const JesusLifeExplorer: React.FC<JesusLifeExplorerProps> = ({ onSelectIdea, setIsLoading, onError }) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const { lang } = useLanguage();
    const t = useTranslations();

    const fetchIdeasForTopic = useCallback(async (topicId: string) => {
        const topicInfo = JESUS_LIFE_TOPICS.find(t => t.id === topicId);
        if (!topicInfo) return;

        setSelectedTopic(topicId);
        setIsFetching(true);
        setIsLoading(true);
        try {
            const newIdeas = await generateIdeas(lang, undefined, 'JESUS_LIFE_EXPLORER', t(topicInfo.translationKey as any));
            setIdeas(newIdeas);
        } catch (err) {
            onError(err);
        } finally {
            setIsFetching(false);
            setIsLoading(false);
        }
    }, [setIsLoading, onError, lang, t]);

    const handleBackToTopics = () => {
        setSelectedTopic(null);
        setIdeas([]);
    };

    if (selectedTopic) {
        return (
            <div className="space-y-6">
                <div className="flex justify-start">
                    <Button onClick={handleBackToTopics} variant="secondary">
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
                <h2 className="text-2xl font-bold text-amber-400 mb-4">{t('jesusLifeExplorerTitle')}</h2>
                <p className="mb-6 text-gray-400">
                    {t('jesusLifeExplorerDescription')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {JESUS_LIFE_TOPICS.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => fetchIdeasForTopic(topic.id)}
                            className="p-4 bg-gray-700 rounded-lg text-center hover:bg-amber-800/50 hover:border-amber-600 border border-transparent transition-all duration-300 flex flex-col items-center justify-center aspect-square"
                        >
                            <span className="text-4xl mb-2">{topic.icon}</span>
                            <span className="font-semibold text-white">{t(topic.translationKey as any)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default JesusLifeExplorer;
