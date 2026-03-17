import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import Card from './ui/Card';
import Button from './ui/Button';
import { en } from '../locales/en';

interface TutorialPageProps {
    onBack: () => void;
}

const TutorialPage: React.FC<TutorialPageProps> = ({ onBack }) => {
    const t = useTranslations();

    const Section: React.FC<{titleKey: keyof typeof en, children: React.ReactNode}> = ({ titleKey, children }) => (
        <Card className="p-6">
            <h2 className="text-2xl font-bold text-amber-400 mb-3">{t(titleKey)}</h2>
            <div className="space-y-2 text-gray-300">{children}</div>
        </Card>
    );

    return (
        <div className="space-y-8 animate-fade-in">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">{t('tutorialTitle')}</h1>
                <Button onClick={onBack} variant="secondary">&larr; {t('backToApp')}</Button>
            </div>
            <p className="text-lg text-gray-400">{t('tutorialIntro')}</p>
            
            <Section titleKey="tutorialStep1Title">
                <p>{t('tutorialStep1Content')}</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>{t('ideaGeneratorTab')}:</strong> {t('tutorialStep1Generator')}</li>
                    <li><strong>{t('bibleExplorerTab')}:</strong> {t('tutorialStep1Explorer')}</li>
                    <li><strong>{t('jesusLifeExplorerTab')}:</strong> {t('tutorialStep1Jesus')}</li>
                    <li><strong>{t('keyFiguresExplorerTab')}:</strong> {t('tutorialStep1Figures')}</li>
                    <li><strong>{t('verseExplorerTab')}:</strong> {t('tutorialStep1Verse')}</li>
                </ul>
            </Section>
            
            <Section titleKey="tutorialStep2Title">
                <p>{t('tutorialStep2Content')}</p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>{t('scriptOnlyMode')}:</strong> {t('tutorialStep2Script')}</li>
                    <li><strong>{t('characterHub')}:</strong> {t('tutorialStep2Characters')}</li>
                </ul>
            </Section>

            <Section titleKey="tutorialStep3Title">
                <p>{t('tutorialStep3Content')}</p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>{t('generateVisualPrompts')}:</strong> {t('tutorialStep3Prompts')}</li>
                    <li><strong>{t('visualEditorMode')}:</strong> {t('tutorialStep3Editor')}</li>
                    <li><strong>{t('generateImage')}:</strong> {t('tutorialStep3Generate')}</li>
                     <li><strong>{t('expandPrompt')}:</strong> {t('tutorialStep3Expand')}</li>
                </ul>
            </Section>

             <Section titleKey="tutorialStep4Title">
                <p>{t('tutorialStep4Content')}</p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>{t('storyboard')}:</strong> {t('tutorialStep4Storyboard')}</li>
                    <li><strong>{t('exportPdf')}:</strong> {t('tutorialStep4Export')}</li>
                </ul>
            </Section>

            <div className="text-center pt-4">
                 <Button onClick={onBack} size="lg">&larr; {t('backToApp')}</Button>
            </div>
        </div>
    );
};

export default TutorialPage;