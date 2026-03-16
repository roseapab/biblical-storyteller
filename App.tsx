
import React, { useState, useCallback, useEffect } from 'react';
import type { Character, Idea, ProjectData, ScriptSegment, VisualStyle, SEOMetadata } from './types';
import Header from './components/Header';
import IdeaGenerator from './components/IdeaGenerator';
import ScriptEditor from './components/ScriptEditor';
import { saveProject, loadProject } from './utils/fileUtils';
import { LanguageProvider } from './context/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import WelcomeModal from './components/ui/WelcomeModal';
import QuotaExceededModal from './components/ui/QuotaExceededModal';
import TutorialPage from './components/TutorialPage';

const AppContent: React.FC = () => {
    const [projectData, setProjectData] = useState<ProjectData>({
        ideas: [],
        hiddenIdeas: [],
        selectedIdea: null,
        script: [],
        favoriteIdeas: [],
        characters: [],
        masterVisualStyle: 'Cinematic',
        seoMetadata: undefined,
    });
    const [currentView, setCurrentView] = useState<'ideas' | 'script' | 'tutorial'>('ideas');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showQuotaModal, setShowQuotaModal] = useState(false);
    const t = useTranslations();

    useEffect(() => {
        const hasVisited = localStorage.getItem('hasVisitedBiblicalStudio');
        if (!hasVisited) {
            setShowWelcomeModal(true);
            localStorage.setItem('hasVisitedBiblicalStudio', 'true');
        }
    }, []);

    const onError = useCallback((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        if (errorMessage === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else {
            setError(errorMessage);
        }
    }, []);

    const handleSelectIdea = (idea: Idea) => {
        setProjectData(prev => ({ ...prev, selectedIdea: idea, script: [], characters: prev.characters || [], masterVisualStyle: prev.masterVisualStyle || 'Cinematic' }));
        setCurrentView('script');
    };

    const handleBackToIdeas = () => {
        setCurrentView('ideas');
        setProjectData(prev => ({ ...prev, selectedIdea: null, script: [] }));
    };

    const handleUpdateIdeas = (ideas: Idea[]) => {
        setProjectData(prev => ({ ...prev, ideas }));
    };
    
    const handleUpdateHiddenIdeas = (hiddenIdeas: string[]) => {
        setProjectData(prev => ({ ...prev, hiddenIdeas }));
    };

    const handleUpdateFavoriteIdeas = (favoriteIdeas: string[]) => {
        setProjectData(prev => ({ ...prev, favoriteIdeas }));
    };

    const handleUpdateScript = (script: ScriptSegment[]) => {
        setProjectData(prev => ({ ...prev, script }));
    };



    const handleUpdateCharacters = (characters: Character[]) => {
        setProjectData(prev => ({ ...prev, characters }));
    };
    
    const handleUpdateMasterVisualStyle = (style: VisualStyle) => {
        setProjectData(prev => ({ ...prev, masterVisualStyle: style }));
    };
    
    const handleUpdateSEOMetadata = (metadata: SEOMetadata) => {
        setProjectData(prev => ({ ...prev, seoMetadata: metadata }));
    };

    const handleSaveProject = () => {
        saveProject(projectData);
    };

    const handleLoadProject = useCallback(() => {
        loadProject((data) => {
            const validatedData: ProjectData = {
                ideas: [],
                hiddenIdeas: [],
                selectedIdea: null,
                script: [],
                favoriteIdeas: [],
                characters: [],
                masterVisualStyle: 'Cinematic',
                ...data,
                seoMetadata: data.seoMetadata || undefined,
            };
            setProjectData(validatedData);
            if (validatedData.selectedIdea) {
                setCurrentView('script');
            } else {
                setCurrentView('ideas');
            }
        });
    }, []);
    
    const handleNewProject = () => {
        setProjectData({
            ideas: [],
            hiddenIdeas: [],
            selectedIdea: null,
            script: [],
            favoriteIdeas: [],
            characters: [],
            masterVisualStyle: 'Cinematic',
            seoMetadata: undefined,
        });
        setCurrentView('ideas');
    }

    const handleGoToTutorial = () => {
        setCurrentView('tutorial');
    };

    const handleExitTutorial = () => {
        setCurrentView('ideas');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header 
                onSave={handleSaveProject} 
                onLoad={handleLoadProject}
                onNew={handleNewProject}
                onTutorial={handleGoToTutorial}
            />
            <main className="container mx-auto p-4 md:p-8">
                <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
                <QuotaExceededModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />
                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}
                {error && (
                    <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">{t('errorTitle')}:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                        <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-xl font-bold">&times;</button>
                    </div>
                )}

                {currentView === 'tutorial' ? (
                    <TutorialPage onBack={handleExitTutorial} />
                ) : currentView === 'ideas' ? (
                    <IdeaGenerator
                        ideas={projectData.ideas}
                        hiddenIdeas={projectData.hiddenIdeas}
                        favoriteIdeas={projectData.favoriteIdeas}
                        onUpdateIdeas={handleUpdateIdeas}
                        onUpdateHiddenIdeas={handleUpdateHiddenIdeas}
                        onUpdateFavoriteIdeas={handleUpdateFavoriteIdeas}
                        onSelectIdea={handleSelectIdea}
                        setIsLoading={setIsLoading}
                        setError={setError}
                        onError={onError}
                    />
                ) : projectData.selectedIdea ? (
                    <ScriptEditor
                        key={projectData.selectedIdea.title}
                        projectData={projectData}
                        onUpdateScript={handleUpdateScript}
                        onUpdateCharacters={handleUpdateCharacters}
                        onUpdateMasterVisualStyle={handleUpdateMasterVisualStyle}
                        onUpdateSEOMetadata={handleUpdateSEOMetadata}
                        onBack={handleBackToIdeas}
                        setIsLoading={setIsLoading}
                        setError={setError}
                        onError={onError}
                    />
                ) : null}
            </main>
        </div>
    );
}


const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
};

export default App;
