
import React from 'react';
import type { ScriptSegment } from '../types';
import Card from './ui/Card';
import { useTranslations } from '../hooks/useTranslations';

interface StoryboardViewerProps {
    scriptSegments: ScriptSegment[];
}

const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scriptSegments }) => {
    const t = useTranslations();
    
    const segmentsWithImages = scriptSegments.filter(s => s.image);

    if (scriptSegments.length > 0 && segmentsWithImages.length === 0) {
        return (
            <Card>
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('storyboardTitle')}</h2>
                    <p className="text-gray-400">{t('noImagesForStoryboard')}</p>
                </div>
            </Card>
        );
    }
    
    if (scriptSegments.length === 0) {
         return (
            <Card>
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('storyboardTitle')}</h2>
                    <p className="text-gray-400">{t('noVisualsGenerated')}</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('storyboardTitle')}</h2>
                    <p className="text-gray-400">{t('storyboardDescription')}</p>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scriptSegments.map((segment, index) => (
                    <Card key={segment.id}>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-amber-300 mb-2">{t('scriptSegment')} #{index + 1}</h3>
                             {segment.image ? (
                                <img src={segment.image} alt={`Scene ${index + 1}`} className="w-full rounded-md aspect-video object-cover border border-gray-700" />
                            ) : (
                                <div className="w-full rounded-md aspect-video bg-gray-700 flex items-center justify-center border border-gray-600">
                                    <p className="text-gray-500">No Image</p>
                                </div>
                            )}
                            <p className="text-sm text-gray-400 mt-3 max-h-24 overflow-y-auto">{segment.segment}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StoryboardViewer;
