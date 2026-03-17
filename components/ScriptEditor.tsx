import React, { useState, useEffect } from 'react';
import type { Character, Idea, ScriptSegment, AspectRatio, VisualStyle, ProjectData, NarrationStyleKey, SEOMetadata } from '../types';
import { NARRATION_STYLES, PROMPT_COLORS, ASPECT_RATIOS, VISUAL_STYLES } from '../constants';
import { generateScript, generatePromptsForScript, generateImage, summarizeScript, findBiblicalQuote, generateScriptFromChapter, generateSEOMetadata, generateRandomVerseScript, expandPrompt } from '../services/geminiService';
import { exportProjectAsTxt, exportProjectAsPdf, exportScriptAsTxt, exportScriptAsPdf, exportSeoAsTxt } from '../utils/fileUtils';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import Select from './ui/Select';
import Modal from './ui/Modal';
import ImageEditor from './ui/ImageEditor';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';
import CharacterHub from './CharacterHub';
import StoryboardViewer from './StoryboardViewer';
import Tooltip from './ui/Tooltip';


interface ScriptEditorProps {
    projectData: ProjectData;
    onUpdateScript: (script: ScriptSegment[]) => void;
    onUpdateCharacters: (characters: Character[]) => void;
    onUpdateMasterVisualStyle: (style: VisualStyle) => void;
    onUpdateSEOMetadata: (metadata: SEOMetadata) => void;
    onBack: () => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    onError: (error: unknown) => void;
}

type ImageFilterState = {
    base: string;
    brightness: number;
    contrast: number;
    saturate: number;
};

const ScriptEditor: React.FC<ScriptEditorProps> = ({ projectData, onUpdateScript, onUpdateCharacters, onUpdateMasterVisualStyle, onUpdateSEOMetadata, onBack, setIsLoading, setError, onError }) => {
    const { selectedIdea: idea, script: initialScript, characters: initialCharacters, masterVisualStyle, seoMetadata: initialSeoMetadata } = projectData;

    const [mode, setMode] = useState<'script' | 'characters' | 'visuals' | 'storyboard'>('script');
    const [scriptText, setScriptText] = useState<string>('');
    const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>(initialScript);
    const [narrationStyle, setNarrationStyle] = useState<NarrationStyleKey>('DOCUMENTARY');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aspectRatios, setAspectRatios] = useState<{ [key: string]: AspectRatio }>({});
    const [copied, setCopied] = useState(false);
    const [docsMessage, setDocsMessage] = useState<string | null>(null);
    const [promptCopied, setPromptCopied] = useState<string | null>(null);
    const [isEditingImage, setIsEditingImage] = useState<ScriptSegment | null>(null);
    const [imageFilters, setImageFilters] = useState<{ [key: string]: ImageFilterState }>({});
    const [seoMetadata, setSeoMetadata] = useState<SEOMetadata | null>(initialSeoMetadata || null);
    const [showSEOModal, setShowSEOModal] = useState(false);

    const { lang } = useLanguage();
    const t = useTranslations();
    
    useEffect(() => {
        if (initialScript.length > 0) {
            setScriptText(initialScript.map(s => s.segment).join('\n\n'));
            setMode('visuals'); // If script segments exist, start in visual mode
        }
    }, [initialScript]);

    useEffect(() => {
        if (idea?.source === 'random-verse' && idea.meta?.narrationStyle) {
            setNarrationStyle(idea.meta.narrationStyle);
        }
    }, [idea]);

    const handleGenerateScript = async (extend = false) => {
        if (!idea) return;
        setIsGenerating(true);
        setIsLoading(true);
        setError(null);
        try {
            const styleInfo = NARRATION_STYLES.find(s => s.id === narrationStyle);
            if (!styleInfo) throw new Error("Selected narration style is invalid.");

            const existingScriptToExtend = extend ? scriptText : undefined;
            
            let newScriptPart;
            if (idea.source === 'random-verse' && !extend) {
                 newScriptPart = await generateRandomVerseScript(styleInfo.aiPromptValue, lang);
            } else if (idea.source === 'bible-explorer' && !extend) {
                 const [book, chapter] = idea.title.split(/ (\d+)$/);
                 newScriptPart = await generateScriptFromChapter(book, parseInt(chapter, 10), styleInfo.aiPromptValue, lang);
            } else {
                newScriptPart = await generateScript(idea, styleInfo.aiPromptValue, lang, existingScriptToExtend);
            }

            const newText = extend ? `${scriptText}\n\n${newScriptPart}` : newScriptPart;
            setScriptText(newText);
            
            setScriptSegments([]);
            onUpdateScript([]);

        } catch (err) {
            onError(err);
        } finally {
            setIsGenerating(false);
            setIsLoading(false);
        }
    };

    const handleGenerateVisuals = async () => {
        if (!scriptText) {
            setError(t('errorScriptRequired'));
            return;
        }
        setIsGenerating(true);
        setIsLoading(true);
        setError(null);
        try {
            const promptData = await generatePromptsForScript(scriptText, lang, projectData.characters, masterVisualStyle);
            const newSegments = promptData.map(p => ({
                id: crypto.randomUUID(),
                segment: p.segment,
                prompt: p.prompt,
                visualStyle: masterVisualStyle,
            }));
            setScriptSegments(newSegments);
            onUpdateScript(newSegments);
            setMode('visuals');
        } catch (err) {
             onError(err);
        } finally {
            setIsGenerating(false);
            setIsLoading(false);
        }
    };

    const handleGenerateMorePrompts = async () => {
        if (!scriptText) return;
        const existingScriptText = scriptSegments.map(s => s.segment).join('\n\n');
        
        if (!scriptText.startsWith(existingScriptText)) {
            handleGenerateVisuals();
            return;
        }
    
        const newText = scriptText.substring(existingScriptText.length).trim();
        if (!newText) {
            setError("No new text to generate prompts for.");
            return;
        }
    
        setIsGenerating(true);
        setIsLoading(true);
        setError(null);
        try {
            const promptData = await generatePromptsForScript(newText, lang, projectData.characters, masterVisualStyle);
            const newSegments = promptData.map(p => ({
                id: crypto.randomUUID(),
                segment: p.segment,
                prompt: p.prompt,
                visualStyle: masterVisualStyle,
            }));
            const combinedSegments = [...scriptSegments, ...newSegments];
            setScriptSegments(combinedSegments);
            onUpdateScript(combinedSegments);
        } catch (err) {
             onError(err);
        } finally {
            setIsGenerating(false);
            setIsLoading(false);
        }
    };
    
    const handleSummarize = async () => {
        if (!scriptText) {
            setError("There is no script to summarize.");
            return;
        }
        setIsGenerating(true);
        setIsLoading(true);
        setError(null);
        try {
            const summary = await summarizeScript(scriptText, lang);
            setScriptText(summary);
            setScriptSegments([]);
            onUpdateScript([]);
        } catch (err) {
            onError(err);
        } finally {
            setIsGenerating(false);
            setIsLoading(false);
        }
    }
    
    const handleSuggestQuote = async () => {
        if (!scriptText) {
            setError("There is no script to find a quote for.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const quote = await findBiblicalQuote(scriptText, lang);
            alert(`${t('suggestedQuoteTitle')}:\n\n${quote}`);
        } catch (err) {
            onError(err);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGenerateSEO = async () => {
        if (!scriptText) {
            setError("There is no script to generate SEO content for.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const metadata = await generateSEOMetadata(scriptText, lang);
            setSeoMetadata(metadata);
            onUpdateSEOMetadata(metadata);
            setShowSEOModal(true);
        } catch (err) {
            onError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateImage = async (segmentId: string) => {
        const segmentIndex = scriptSegments.findIndex(s => s.id === segmentId);
        if (segmentIndex === -1) return;

        setScriptSegments(prev => prev.map(s => s.id === segmentId ? { ...s, isGeneratingImage: true } : s));
        setError(null);

        try {
            const segment = scriptSegments[segmentIndex];
            const aspectRatio = aspectRatios[segmentId] || '16:9';
            const visualStyle = segment.visualStyle || masterVisualStyle;
            const imageUrl = await generateImage(segment.prompt, aspectRatio, visualStyle);
            
            setScriptSegments(prev => {
                const updated = prev.map(s => s.id === segmentId ? { ...s, image: imageUrl, isGeneratingImage: false } : s);
                onUpdateScript(updated);
                return updated;
            });
        } catch (err) {
            onError(err);
            setScriptSegments(prev => prev.map(s => s.id === segmentId ? { ...s, isGeneratingImage: false } : s));
        }
    };

    const handleExpandPrompt = async (segmentId: string) => {
        const segmentIndex = scriptSegments.findIndex(s => s.id === segmentId);
        if (segmentIndex === -1) return;

        const originalPrompt = scriptSegments[segmentIndex].prompt;

        setScriptSegments(prev => prev.map(s => s.id === segmentId ? { ...s, isExpandingPrompt: true } : s));
        setError(null);

        try {
            const expandedPrompt = await expandPrompt(originalPrompt);
            setScriptSegments(prev => {
                const updated = prev.map(s => s.id === segmentId ? { ...s, prompt: expandedPrompt, isExpandingPrompt: false } : s);
                onUpdateScript(updated);
                return updated;
            });
        } catch (err) {
            onError(err);
            setScriptSegments(prev => prev.map(s => s.id === segmentId ? { ...s, isExpandingPrompt: false } : s));
        }
    };
    
    const handleSegmentStyleChange = (segmentId: string, style: VisualStyle) => {
        const newSegments = scriptSegments.map(s => s.id === segmentId ? { ...s, visualStyle: style } : s);
        setScriptSegments(newSegments);
        onUpdateScript(newSegments);
    };

    const handleSetRealistic = (segmentId: string) => {
        handleSegmentStyleChange(segmentId, 'Más Realista');
    };

    const handleCopyScript = () => {
        navigator.clipboard.writeText(scriptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendToGoogleDocs = () => {
        if (!scriptText) return;
        navigator.clipboard.writeText(scriptText);
        setDocsMessage(t('googleDocsCopySuccess'));
        window.open('https://docs.new', '_blank', 'noopener,noreferrer');
        setTimeout(() => {
            setDocsMessage(null);
        }, 4000);
    };

    const handleCopyPrompt = (prompt: string, segmentId: string) => {
        navigator.clipboard.writeText(prompt);
        setPromptCopied(segmentId);
        setTimeout(() => setPromptCopied(null), 2000);
    };

    const handleSaveImageEdits = (segmentId: string, newFilters: ImageFilterState) => {
        setImageFilters(prev => ({ ...prev, [segmentId]: newFilters }));
    };

    const handleDownloadImage = (imageUrl: string, title: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${title.replace(/\s/g, '_')}_image.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const narrationStyleOptions = NARRATION_STYLES.map(style => ({ value: style.id, label: t(style.translationKey as any) }));
    const visualStyleOptions = VISUAL_STYLES.map(style => ({ value: style.id, label: t(style.translationKey as any) }));

    const canGenerateMore = scriptSegments.length > 0 && scriptText.length > scriptSegments.map(s => s.segment).join('\n\n').length;

    if (!idea) return null;
    
    const TabButton: React.FC<{tabId: 'script' | 'characters' | 'visuals' | 'storyboard', title: string, tooltip: string}> = ({ tabId, title, tooltip }) => (
        <Tooltip text={tooltip}>
            <button
                onClick={() => setMode(tabId)}
                className={`px-3 md:px-4 py-2 text-base md:text-lg font-semibold border-b-4 transition-colors ${mode === tabId ? 'text-amber-400 border-amber-400' : 'text-gray-400 border-transparent hover:text-amber-300 hover:border-amber-300'}`}
            >
                {title}
            </button>
        </Tooltip>
    );

    const SEOModalContent: React.FC<{metadata: SEOMetadata}> = ({ metadata }) => {
        const [copiedField, setCopiedField] = useState<string | null>(null);

        const handleCopy = (field: string, text: string) => {
            navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        };

        const handleDownload = () => {
            if (idea) {
                exportSeoAsTxt(metadata, idea.title);
            }
        };

        return (
            <div className="space-y-4">
                <div>
                    <label className="font-bold text-amber-300">{t('title')}</label>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="w-full bg-gray-900 p-2 rounded-md border border-gray-700">{metadata.title}</p>
                        <Button size="sm" onClick={() => handleCopy('title', metadata.title)}>{copiedField === 'title' ? '✔' : t('copy')}</Button>
                    </div>
                </div>
                 <div>
                    <label className="font-bold text-amber-300">{t('description')}</label>
                    <div className="flex items-start gap-2 mt-1">
                        <textarea readOnly rows={4} className="w-full bg-gray-900 p-2 rounded-md border border-gray-700 resize-none">{metadata.description}</textarea>
                         <Button size="sm" onClick={() => handleCopy('desc', metadata.description)}>{copiedField === 'desc' ? '✔' : t('copy')}</Button>
                    </div>
                </div>
                 <div>
                    <label className="font-bold text-amber-300">{t('hashtags')}</label>
                     <div className="flex items-start gap-2 mt-1">
                        <p className="w-full bg-gray-900 p-2 rounded-md border border-gray-700 break-words">{metadata.hashtags.join(' ')}</p>
                         <Button size="sm" onClick={() => handleCopy('tags', metadata.hashtags.join(' '))}>{copiedField === 'tags' ? '✔' : t('copy')}</Button>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-700 mt-4">
                    <Tooltip text={t('tooltipDownloadSEO')}>
                        <Button variant="secondary" onClick={handleDownload}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t('downloadAsTxt')}
                        </Button>
                    </Tooltip>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <Button onClick={onBack} variant="secondary">
                    &larr; {t('backToIdeas')}
                </Button>
            </div>
            <Card>
                <div className="p-4 md:p-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-amber-400">{idea.title}</h2>
                    <p className="mt-2 text-gray-400">{idea.description}</p>
                </div>
            </Card>

            <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 flex-wrap">
                <TabButton tabId="script" title={t('scriptOnlyMode')} tooltip={t('tooltipScriptOnly')} />
                <TabButton tabId="characters" title={t('characterHub')} tooltip={t('tooltipCharacterHub')} />
                <TabButton tabId="visuals" title={t('visualEditorMode')} tooltip={t('tooltipVisualEditor')} />
                <TabButton tabId="storyboard" title={t('storyboard')} tooltip={t('tooltipStoryboard')} />
            </div>

            {mode === 'script' && (
                <Card>
                    <div className="p-4 md:p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">{t('scriptControls')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Tooltip text={t('tooltipNarrationStyle')}>
                                <Select
                                    label={t('narrationStyle')}
                                    value={narrationStyle}
                                    onChange={(e) => setNarrationStyle(e.target.value as NarrationStyleKey)}
                                    options={narrationStyleOptions}
                                />
                            </Tooltip>
                            <Tooltip text={t('tooltipMasterStyle')}>
                                <Select
                                    label={t('masterVisualStyle')}
                                    value={masterVisualStyle}
                                    onChange={(e) => onUpdateMasterVisualStyle(e.target.value as VisualStyle)}
                                    options={visualStyleOptions}
                                />
                            </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button onClick={() => handleGenerateScript(false)} disabled={isGenerating}>
                                {isGenerating && !scriptText ? <Spinner/> : t('generateScript')}
                            </Button>
                            {scriptText && (
                                <Tooltip text={t('tooltipExtendScript')}>
                                    <Button onClick={() => handleGenerateScript(true)} disabled={isGenerating} variant="secondary">
                                        {isGenerating && scriptText ? <Spinner/> : t('extendScript')}
                                    </Button>
                                </Tooltip>
                            )}
                        </div>

                        <div className="relative">
                            <textarea
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value)}
                                className="w-full h-96 bg-gray-900 border border-gray-700 rounded-md p-3 text-base text-gray-300 resize-y focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder={t('scriptPlaceholder')}
                            />
                             <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <Button onClick={handleCopyScript} variant="secondary" size="sm" title={t('copyScript')}>
                                    {copied ? '✔' : 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    }
                                </Button>
                                <Button onClick={() => exportScriptAsTxt(scriptText, idea.title)} variant="secondary" size="sm" title={t('downloadScriptAsTxt')}>
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </Button>
                                 <Button onClick={() => exportScriptAsPdf(scriptText, idea.title)} variant="secondary" size="sm" title={t('downloadPdf')}>
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4 space-y-3">
                            <div className="flex flex-wrap gap-4">
                                <Tooltip text={t('tooltipGenerateVisuals')}>
                                    <Button onClick={handleGenerateVisuals} disabled={isGenerating || !scriptText}>{t('generateVisualPrompts')}</Button>
                                </Tooltip>
                                <Tooltip text={t('googleDocsTooltip')}>
                                    <Button onClick={handleSendToGoogleDocs} disabled={isGenerating || !scriptText} variant="secondary">
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path fill="#4285F4" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z" />
                                            <path fill="#FFF" d="M13,3.5L18.5,9H13V3.5M17,11H7V13H17V11M17,15H7V17H17V15M11,19H7V21H11V19Z" />
                                        </svg>
                                        {t('googleDocsButton')}
                                    </Button>
                                </Tooltip>
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={handleSummarize} disabled={isGenerating || !scriptText} variant="secondary" size="sm">{t('summarizeScript')}</Button>
                                    <Button onClick={handleSuggestQuote} disabled={!scriptText} variant="secondary" size="sm">{t('suggestQuote')}</Button>
                                    <Button onClick={handleGenerateSEO} disabled={isGenerating || !scriptText} variant="secondary" size="sm">{t('generateSEOTitle')}</Button>
                                    <Button onClick={() => exportProjectAsTxt(projectData)} variant="secondary" size="sm">{t('exportTxt')}</Button>
                                    <Button onClick={() => exportProjectAsPdf(projectData)} variant="secondary" size="sm">{t('exportPdf')}</Button>
                                </div>
                            </div>
                            {docsMessage && <p className="text-blue-400 text-sm">{docsMessage}</p>}
                        </div>
                         {copied && <div className="text-green-400 text-sm">{t('copySuccess')}</div>}
                    </div>
                </Card>
            )}
            
            {mode === 'characters' && (
                <CharacterHub
                    characters={initialCharacters}
                    onUpdateCharacters={onUpdateCharacters}
                />
            )}

            {mode === 'visuals' && (
                 <>
                    {isGenerating && scriptSegments.length === 0 &&
                        <div className="text-center py-10">
                            <Spinner />
                            <p className="mt-4 text-gray-400">{t('craftingScript')}</p>
                        </div>
                    }
                    {scriptSegments.length === 0 && !isGenerating && (
                         <Card>
                            <div className="p-6 text-center">
                                <p className="text-gray-400">{t('noVisualsGenerated')}</p>
                                <Button onClick={() => setMode('script')} className="mt-4">{t('backToScriptEditor')}</Button>
                            </div>
                        </Card>
                    )}
                    <div className="space-y-6">
                        {scriptSegments.map((item, index) => {
                             const currentFilters = imageFilters[item.id] || { base: 'filter-none', brightness: 100, contrast: 100, saturate: 100 };
                             
                             const baseFilterValues: { [key: string]: string } = {
                                'filter-sepia': 'sepia(80%)',
                                'filter-grayscale': 'grayscale(100%)',
                                'filter-vintage': 'sepia(60%) contrast(1.1) brightness(0.9) saturate(1.5)',
                                'filter-contrast': 'contrast(150%)',
                             };
                             
                             let combinedFilter = baseFilterValues[currentFilters.base] || '';
                             if (currentFilters.base !== 'filter-vintage') {
                                 combinedFilter += ` brightness(${currentFilters.brightness}%) contrast(${currentFilters.contrast}%) saturate(${currentFilters.saturate}%)`;
                             }
                             const imageStyle = { filter: combinedFilter.trim() };

                             return (
                            <Card key={item.id} className={`border-l-4 ${PROMPT_COLORS[index % PROMPT_COLORS.length]}`}>
                                <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-lg text-amber-300">{t('scriptSegment')} #{index + 1}</h4>
                                        <p className="w-full h-48 bg-gray-800/50 border border-gray-700 rounded-md p-3 text-sm text-gray-300 overflow-y-auto">
                                            {item.segment}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-lg text-rose-300">{t('visualPrompt')}</h4>
                                            <div className="flex items-center gap-2">
                                                <Tooltip text={t('tooltipExpandPrompt')}>
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary" 
                                                        onClick={() => handleExpandPrompt(item.id)}
                                                        disabled={item.isExpandingPrompt}
                                                        aria-label={t('expandPrompt')}
                                                    >
                                                        {item.isExpandingPrompt ? <Spinner /> : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                                                            </svg>
                                                        )}
                                                    </Button>
                                                </Tooltip>
                                                <Button size="sm" variant="secondary" onClick={() => handleCopyPrompt(item.prompt, item.id)}>
                                                    {promptCopied === item.id ? t('promptCopied') : t('copyPrompt')}
                                                </Button>
                                            </div>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={item.prompt}
                                            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-gray-400 resize-none focus:outline-none"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label={t('visualStyle')}
                                                value={item.visualStyle || masterVisualStyle}
                                                onChange={(e) => handleSegmentStyleChange(item.id, e.target.value as VisualStyle)}
                                                options={visualStyleOptions}
                                            />
                                            <Select
                                                label={t('aspectRatio')}
                                                value={aspectRatios[item.id] || '16:9'}
                                                onChange={(e) => setAspectRatios(prev => ({ ...prev, [item.id]: e.target.value as AspectRatio }))}
                                                options={ASPECT_RATIOS.map(r => ({ value: r, label: r }))}
                                            />
                                        </div>
                                        <div className="flex items-stretch gap-2">
                                            <Tooltip text={item.image ? t('tooltipRegenerateImage') : t('generateImage')}>
                                                <Button onClick={() => handleGenerateImage(item.id)} disabled={item.isGeneratingImage} className="flex-grow">
                                                    {item.isGeneratingImage ? <Spinner /> : (item.image ? t('regenerateImage') : t('generateImage'))}
                                                </Button>
                                            </Tooltip>
                                            <Tooltip text={t('tooltipMakeRealistic')}>
                                                <Button 
                                                    onClick={() => handleSetRealistic(item.id)} 
                                                    variant="secondary"
                                                    size="md"
                                                    className={`px-3 ${(item.visualStyle || masterVisualStyle) === 'Más Realista' ? 'bg-sky-600 hover:bg-sky-700 ring-2 ring-sky-400' : ''}`}
                                                    aria-label={t('tooltipMakeRealistic')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        {item.isGeneratingImage && <p className="text-sm text-sky-400 text-center">{t('generatingImage')}</p>}
                                        {item.image && (
                                            <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden relative">
                                                <div className="relative">
                                                    <img 
                                                        src={item.image} 
                                                        alt={`Generated for segment ${index+1}`} 
                                                        className="w-full object-contain"
                                                        style={imageStyle}
                                                    />
                                                    {currentFilters.base === 'filter-vignette' && <div className="absolute inset-0 w-full h-full pointer-events-none rounded-md shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]"></div>}
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <Tooltip text={t('downloadImage')}>
                                                        <Button size="sm" variant="secondary" onClick={() => handleDownloadImage(item.image!, `${idea.title}_scene_${index+1}`)}>
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                          </svg>
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip text={t('tooltipEditImage')}>
                                                        <Button size="sm" variant="secondary" onClick={() => setIsEditingImage(item)}>{t('editImage')}</Button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )})}
                         {canGenerateMore && !isGenerating && (
                            <div className="my-4 text-center">
                                <Button onClick={handleGenerateMorePrompts} disabled={isGenerating}>
                                    {isGenerating ? <Spinner /> : t('generateMorePrompts')}
                                </Button>
                            </div>
                        )}
                        {isGenerating && canGenerateMore && (
                            <div className="text-center py-6">
                                <Spinner />
                                <p className="mt-4 text-gray-400">{t('generatingMorePrompts')}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {mode === 'storyboard' && (
                <StoryboardViewer scriptSegments={scriptSegments} />
            )}

            <Modal isOpen={!!isEditingImage} onClose={() => setIsEditingImage(null)} title={t('imageEditorTitle')}>
                {isEditingImage && (
                    <ImageEditor
                        imageUrl={isEditingImage.image!}
                        initialFilters={imageFilters[isEditingImage.id] || { base: 'filter-none', brightness: 100, contrast: 100, saturate: 100 }}
                        onClose={() => setIsEditingImage(null)}
                        onSave={(newFilters) => handleSaveImageEdits(isEditingImage.id, newFilters)}
                    />
                )}
            </Modal>
            
            <Modal isOpen={showSEOModal} onClose={() => setShowSEOModal(false)} title={t('seoModalTitle')}>
                {seoMetadata && <SEOModalContent metadata={seoMetadata} />}
            </Modal>
        </div>
    );
};

export default ScriptEditor;