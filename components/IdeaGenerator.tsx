
import React, { useState, useEffect, useCallback } from 'react';
import type { Idea } from '../types';
import { generateIdeas } from '../services/geminiService';
import { CONTENT_CATEGORIES } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import Select from './ui/Select';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';
import BibleExplorer from './BibleExplorer';
import JesusLifeExplorer from './JesusLifeExplorer';
import Tooltip from './ui/Tooltip';
import KeyFiguresExplorer from './KeyFiguresExplorer';
import VerseExplorer from './VerseExplorer';

interface IdeaGeneratorProps {
    ideas: Idea[];
    hiddenIdeas: string[];
    favoriteIdeas: string[];
    onUpdateIdeas: (ideas: Idea[]) => void;
    onUpdateHiddenIdeas: (hiddenIdeas: string[]) => void;
    onUpdateFavoriteIdeas: (favoriteIdeas: string[]) => void;
    onSelectIdea: (idea: Idea) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    onError: (error: unknown) => void;
}

const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ ideas, hiddenIdeas, favoriteIdeas, onUpdateIdeas, onUpdateHiddenIdeas, onUpdateFavoriteIdeas, onSelectIdea, setIsLoading, setError, onError }) => {
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('All');
    const [isFetching, setIsFetching] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [activeTab, setActiveTab] = useState<'generator' | 'explorer' | 'jesus' | 'figures' | 'verse'>('generator');
    const { lang } = useLanguage();
    const t = useTranslations();

    const fetchIdeas = useCallback(async (searchKeyword?: string, searchCategory?: string) => {
        setIsFetching(true);
        setIsLoading(true);
        setError(null);
        try {
            const newIdeas = await generateIdeas(lang, searchKeyword, searchCategory);
            onUpdateIdeas(newIdeas);
        } catch (err) {
            onError(err);
        } finally {
            setIsFetching(false);
            setIsLoading(false);
        }
    }, [setIsLoading, setError, onUpdateIdeas, lang, onError]);

    useEffect(() => {
        if (ideas.length === 0 && activeTab === 'generator') {
            fetchIdeas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchIdeas(keyword, category);
    };

    const handleHideIdea = (ideaTitle: string) => {
        onUpdateHiddenIdeas([...hiddenIdeas, ideaTitle]);
    };

    const handleToggleFavorite = (ideaTitle: string) => {
        const isFavorite = favoriteIdeas.includes(ideaTitle);
        if (isFavorite) {
            onUpdateFavoriteIdeas(favoriteIdeas.filter(title => title !== ideaTitle));
        } else {
            onUpdateFavoriteIdeas([...favoriteIdeas, ideaTitle]);
        }
    };
    
    const visibleIdeas = ideas
        .filter(idea => !hiddenIdeas.includes(idea.title))
        .filter(idea => !showFavorites || favoriteIdeas.includes(idea.title));
        
    const categoryOptions = CONTENT_CATEGORIES.map(c => ({ value: c.id, label: t(c.translationKey as any) }));
    
    const TabButton: React.FC<{tabId: 'generator' | 'explorer' | 'jesus' | 'figures' | 'verse', title: string}> = ({ tabId, title }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-lg font-semibold border-b-4 transition-colors ${activeTab === tabId ? 'text-amber-400 border-amber-400' : 'text-gray-400 border-transparent hover:text-amber-300 hover:border-amber-300'}`}
        >
            {title}
        </button>
    );

    return (
        <div className="space-y-8">
            <div className="flex space-x-4 border-b border-gray-700 flex-wrap">
                <TabButton tabId="generator" title={t('ideaGeneratorTab')} />
                <TabButton tabId="explorer" title={t('bibleExplorerTab')} />
                <TabButton tabId="jesus" title={t('jesusLifeExplorerTab')} />
                <TabButton tabId="figures" title={t('keyFiguresExplorerTab')} />
                <TabButton tabId="verse" title={t('verseExplorerTab')} />
            </div>

            {activeTab === 'generator' && (
                <>
                    <Card>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-amber-400 mb-4">{t('generateIdeasTitle')}</h2>
                            <p className="mb-6 text-gray-400">
                                {t('generateIdeasDescription')}
                            </p>
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder={t('keywordPlaceholder')}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <Tooltip text={t('tooltipCategory')}>
                                        <Select 
                                            label={t('contentCategory')}
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            options={categoryOptions}
                                        />
                                    </Tooltip>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                <Button type="submit" disabled={isFetching}>{t('searchIdeas')}</Button>
                                <Tooltip text={t('tooltipRandomIdeas')}>
                                  <Button onClick={() => fetchIdeas()} disabled={isFetching} variant="secondary">{t('getRandomIdeas')}</Button>
                                </Tooltip>
                                </div>
                            </form>
                        </div>
                    </Card>

                    <div className="mt-8">
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => setShowFavorites(!showFavorites)} variant="secondary">
                                {showFavorites ? `${t('showAll')} (${ideas.length - hiddenIdeas.length})` : `${t('showFavorites')} (${favoriteIdeas.length})`}
                            </Button>
                        </div>
                        {isFetching ? (
                            <div className="flex justify-center items-center py-10">
                                <Spinner />
                                <span className="ml-4 text-lg">{t('generatingIdeas')}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {visibleIdeas.map((idea) => {
                                    const isFavorite = favoriteIdeas.includes(idea.title);
                                    return (
                                    <Card key={idea.title} className="flex flex-col h-full hover:border-amber-500 transition-all duration-300">
                                        <div className="p-6 flex-grow">
                                            <h3 className="text-xl font-bold text-amber-300">{idea.title}</h3>
                                            <p className="mt-2 text-gray-400">{idea.description}</p>
                                        </div>
                                        <div className="p-4 bg-gray-800/50 flex justify-between items-center gap-2">
                                            <Button onClick={() => onSelectIdea(idea)} size="sm">{t('createScript')}</Button>
                                            <div className="flex items-center gap-2">
                                                <Tooltip text={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}>
                                                    <Button onClick={() => handleToggleFavorite(idea.title)} variant="secondary" size="sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFavorite ? 'text-yellow-400' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip text={t('hideIdea')}>
                                                    <Button onClick={() => handleHideIdea(idea.title)} variant="danger" size="sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </Card>
                                )})}
                            </div>
                        )}
                        { !isFetching && visibleIdeas.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-500">{showFavorites ? t('noFavorites') : t('allIdeasHidden')}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {activeTab === 'explorer' && (
                <BibleExplorer onSelectIdea={onSelectIdea} />
            )}
            
            {activeTab === 'jesus' && (
                <JesusLifeExplorer
                    onSelectIdea={onSelectIdea}
                    setIsLoading={setIsLoading}
                    onError={onError}
                />
            )}

            {activeTab === 'figures' && (
                 <KeyFiguresExplorer
                    onSelectIdea={onSelectIdea}
                    setIsLoading={setIsLoading}
                    onError={onError}
                />
            )}

            {activeTab === 'verse' && (
                <VerseExplorer onError={onError} setIsLoading={setIsLoading} onSelectIdea={onSelectIdea} />
            )}
        </div>
    );
};

export default IdeaGenerator;