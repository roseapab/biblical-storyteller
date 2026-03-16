
export interface Idea {
    title: string;
    description: string;
    source?: 'bible-explorer' | 'random-verse';
    category?: string;
    meta?: {
        narrationStyle?: NarrationStyleKey;
    };
}

export interface Character {
    id: string;
    name: string;
    description: string;
}

export type Lang = 'en-US' | 'en-GB' | 'es-ES' | 'es-SA';

export type VisualStyle = 'Cinematic' | 'Realistic' | 'Más Realista' | 'Painted' | 'Documentary Photo' | 'For Kids (Cartoon)' | 'Comic Book';

export interface ScriptSegment {
    id: string;
    segment: string;
    prompt: string;
    image?: string;
    isGeneratingImage?: boolean;
    visualStyle?: VisualStyle;
    isExpandingPrompt?: boolean;
}

export type NarrationStyleKey = 'NARRATOR' | 'PREACHER' | 'DOCUMENTARY' | 'DEBATE' | 'STORY' | 'MICRO' | 'FIRST_PERSON' | 'YOUTUBE_SCRIPT';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface SEOMetadata {
    title: string;
    description: string;
    hashtags: string[];
}

export interface ProjectData {
    ideas: Idea[];
    hiddenIdeas: string[];
    selectedIdea: Idea | null;
    script: ScriptSegment[];
    favoriteIdeas: string[];
    characters: Character[];
    masterVisualStyle: VisualStyle;
    seoMetadata?: SEOMetadata;
}