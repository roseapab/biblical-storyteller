import React, { useState, useMemo, useCallback } from 'react';
import Card from './ui/Card';
import Select from './ui/Select';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';
import { bibleData } from '../data/bibleData';
import { analyzeVerse } from '../services/geminiService';
import Tooltip from './ui/Tooltip';
import type { Idea, NarrationStyleKey } from '../types';
import { NARRATION_STYLES } from '../constants';

interface VerseExplorerProps {
    onSelectIdea: (idea: Idea) => void;
    setIsLoading: (loading: boolean) => void;
    onError: (error: unknown) => void;
}


const VerseExplorer: React.FC<VerseExplorerProps> = ({ onSelectIdea, setIsLoading, onError }) => {
    const [testament, setTestament] = useState<'old' | 'new'>('old');
    const [selectedBook, setSelectedBook] = useState<string>('');
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [startVerse, setStartVerse] = useState<number>(1);
    const [endVerse, setEndVerse] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);
    const [narrationStyle, setNarrationStyle] = useState<NarrationStyleKey>('DOCUMENTARY');

    const { lang } = useLanguage();
    const t = useTranslations();

    const bookList = testament === 'old' ? bibleData.oldTestament : bibleData.newTestament;
    
    const currentBookData = useMemo(() => {
        return bookList.find(b => (lang.startsWith('en') ? b.name_en : b.name_es) === selectedBook);
    }, [selectedBook, bookList, lang]);

    const handleTestamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTestament = e.target.value as 'old' | 'new';
        setTestament(newTestament);
        setSelectedBook('');
        setSelectedChapter(1);
        setStartVerse(1);
        setEndVerse('');
    };

    const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBook(e.target.value);
        setSelectedChapter(1);
        setStartVerse(1);
        setEndVerse('');
    };
    
    const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedChapter(parseInt(e.target.value, 10));
        setStartVerse(1);
        setEndVerse('');
    };

    const handleAnalyze = useCallback(async () => {
        if (!selectedBook || !selectedChapter || !startVerse) {
            onError(new Error("Please select a book, chapter, and starting verse."));
            return;
        }
        setIsFetching(true);
        setIsLoading(true);
        setAnalysis('');
        try {
            const endVerseNum = endVerse ? parseInt(endVerse, 10) : null;
            const result = await analyzeVerse(selectedBook, selectedChapter, startVerse, endVerseNum, lang);
            setAnalysis(result);
        } catch(err) {
            onError(err);
        } finally {
            setIsFetching(false);
            setIsLoading(false);
        }

    }, [selectedBook, selectedChapter, startVerse, endVerse, lang, setIsLoading, onError]);

    const handleCreateRandomVerseIdea = () => {
        const styleInfo = NARRATION_STYLES.find(s => s.id === narrationStyle);
        const styleLabel = styleInfo ? t(styleInfo.translationKey as any) : narrationStyle;
        const idea: Idea = {
            title: t('randomVerseIdeaTitle'),
            description: t('randomVerseIdeaDescription', { style: styleLabel }),
            source: 'random-verse',
            meta: {
                narrationStyle: narrationStyle
            }
        };
        onSelectIdea(idea);
    };

    const testamentOptions = [
        { value: 'old', label: t('oldTestament') },
        { value: 'new', label: t('newTestament') },
    ];
    
    const narrationStyleOptions = NARRATION_STYLES.map(style => ({ value: style.id, label: t(style.translationKey as any) }));

    const bookOptions = bookList.map(book => ({
        value: lang.startsWith('en') ? book.name_en : book.name_es,
        label: lang.startsWith('en') ? book.name_en : book.name_es,
    }));
    
    const chapterOptions = currentBookData 
        ? Array.from({ length: currentBookData.chapters }, (_, i) => ({
            value: (i + 1).toString(),
            label: `${t('selectChapter')} ${i + 1}`
          }))
        : [];
        
    const verseOptions = Array.from({ length: 176 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `${i + 1}`
    }));


    return (
        <Card>
            <div className="p-6 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('verseExplorerTitle')}</h2>
                    <p className="text-gray-400">
                        {t('verseExplorerDescription')}
                    </p>
                </div>
                {/* Verse Analyzer */}
                <div className="space-y-4 pt-4 border-t border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Select 
                            label={t('selectTestament')}
                            value={testament}
                            onChange={handleTestamentChange}
                            options={testamentOptions}
                        />
                         <Select 
                            label={t('selectBook')}
                            value={selectedBook}
                            onChange={handleBookChange}
                            options={[{ value: '', label: `--- ${t('selectBook')} ---` }, ...bookOptions]}
                            disabled={!testament}
                        />
                         <Select 
                            label={t('selectChapter')}
                            value={selectedChapter.toString()}
                            onChange={handleChapterChange}
                            options={chapterOptions}
                            disabled={!selectedBook}
                        />
                        <Select 
                            label={t('startVerse')}
                            value={startVerse.toString()}
                            onChange={(e) => setStartVerse(parseInt(e.target.value, 10))}
                            options={verseOptions}
                            disabled={!selectedBook}
                        />
                        <Select 
                            label={t('endVerse')}
                            value={endVerse}
                            onChange={(e) => setEndVerse(e.target.value)}
                            options={[{value: '', label: '---'}, ...verseOptions]}
                            disabled={!selectedBook}
                        />
                    </div>
                     <Button onClick={handleAnalyze} disabled={isFetching || !selectedBook}>
                        {isFetching && !analysis ? <Spinner/> : t('analyzeVerse')}
                    </Button>
                </div>
                
                {/* Random Verse Script Generator */}
                <div className="space-y-4 pt-6 border-t border-gray-600">
                     <h3 className="text-xl font-bold text-amber-400">{t('randomVerseScriptButton')}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label={t('narrationStyle')}
                            value={narrationStyle}
                            onChange={(e) => setNarrationStyle(e.target.value as NarrationStyleKey)}
                            options={narrationStyleOptions}
                        />
                        <div className="flex items-end">
                            <Tooltip text={t('tooltipRandomVerse')}>
                                <Button onClick={handleCreateRandomVerseIdea} disabled={isFetching} variant="secondary" className="w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5zm2 2a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-3 4a1 1 0 112 0 1 1 0 01-2 0zm-3 1a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">{t('createScript')}</span>
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {isFetching && !analysis && (
                    <div className="text-center py-10">
                        <Spinner />
                        <p className="mt-4 text-gray-400">{t('generatingAnalysis')}</p>
                    </div>
                )}
                
                {analysis && !isFetching && (
                    <div className="pt-6 border-t border-gray-700">
                        <h3 className="text-xl font-bold text-amber-300 mb-4">{t('analysisResult')}</h3>
                        <div className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap text-gray-300 max-h-96 overflow-y-auto">
                            {analysis}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default VerseExplorer;