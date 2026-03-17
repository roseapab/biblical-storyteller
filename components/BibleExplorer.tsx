import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Select from './ui/Select';
import Button from './ui/Button';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';
import type { Idea } from '../types';
import { bibleData } from '../data/bibleData';

interface BibleExplorerProps {
    onSelectIdea: (idea: Idea) => void;
}

const BibleExplorer: React.FC<BibleExplorerProps> = ({ onSelectIdea }) => {
    const [testament, setTestament] = useState<'old' | 'new'>('old');
    const [selectedBook, setSelectedBook] = useState<string>('');
    const [selectedChapter, setSelectedChapter] = useState<number>(1);

    const { lang } = useLanguage();
    const t = useTranslations();

    const bookList = testament === 'old' ? bibleData.oldTestament : bibleData.newTestament;
    
    const currentBookData = useMemo(() => {
        return bookList.find(b => (lang.startsWith('en') ? b.name_en : b.name_es) === selectedBook);
    }, [selectedBook, bookList, lang]);

    const handleTestamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTestament = e.target.value as 'old' | 'new';
        setTestament(newTestament);
        // Reset book and chapter when testament changes
        setSelectedBook('');
        setSelectedChapter(1);
    };

    const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBook(e.target.value);
        setSelectedChapter(1); // Reset chapter when book changes
    };

    const handleCreateScript = () => {
        if (!selectedBook || !selectedChapter) {
            alert('Please select a book and chapter.');
            return;
        }
        const idea: Idea = {
            title: `${selectedBook} ${selectedChapter}`,
            description: t('bibleExplorerScriptDescription', { book: selectedBook, chapter: selectedChapter }),
            source: 'bible-explorer',
        };
        onSelectIdea(idea);
    };

    const testamentOptions = [
        { value: 'old', label: t('oldTestament') },
        { value: 'new', label: t('newTestament') },
    ];

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


    return (
        <Card>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-4">{t('bibleExplorerTitle')}</h2>
                <p className="mb-6 text-gray-400">
                    {t('bibleExplorerDescription')}
                </p>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            onChange={(e) => setSelectedChapter(parseInt(e.target.value, 10))}
                            options={chapterOptions}
                            disabled={!selectedBook}
                        />
                    </div>
                    <Button onClick={handleCreateScript} disabled={!selectedBook || !currentBookData}>
                        {t('createScript')}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default BibleExplorer;