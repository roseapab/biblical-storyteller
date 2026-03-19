import { GoogleGenAI, Type } from "@google/genai";
import type { Idea, Lang, AspectRatio, VisualStyle, Character, SEOMetadata } from '../types';
import { en } from '../locales/en';
import { es } from '../locales/es';
import { CONTENT_CATEGORIES } from '../constants';
import { bibleData } from '../data/bibleData';

const handleApiError = (error: unknown): never => {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
            throw new Error("QUOTA_EXCEEDED");
        }
    }
    throw error;
};

// This function will throw a clear, user-friendly error if the API key is missing.
const getAiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        // This specific error message will be caught and displayed in the UI.
        throw new Error("API key is not configured. Please set up the VITE_GEMINI_API_KEY for AI features to work.");
    }
    return new GoogleGenAI({ apiKey });
};

const getLanguageInstruction = (lang: Lang) => {
    return `The entire output, including all text and descriptions, must be in ${lang.startsWith('es') ? 'Spanish' : 'English'}.`;
}

export const generateIdeas = async (lang: Lang, keyword?: string, categoryId?: string, topic?: string): Promise<Idea[]> => {
    try {
        const ai = getAiClient();
        
        let specificInstructions = '';
        let ideaCount = 10;
        if (categoryId === 'JESUS_LIFE_EXPLORER') {
            ideaCount = 8;
            specificInstructions = `
            You are a theologian and historian specializing in the life of Jesus.
            Generate ${ideaCount} in-depth documentary ideas about a specific aspect of Jesus's life: "${topic}".
            These ideas should be suitable for a serious documentary, exploring historical context, theological implications, and human drama.
            Go beyond the obvious and suggest unique angles.
            `;
        } else if (categoryId === 'BIBLICAL_FIGURE_EXPLORER') {
            ideaCount = 8;
            specificInstructions = `
            You are a theologian and historian specializing in biblical figures.
            Generate ${ideaCount} in-depth documentary ideas about the life and legacy of this major biblical figure: "${topic}".
            These ideas should be suitable for a serious documentary, exploring historical context, theological implications, and human drama.
            Go beyond the obvious and suggest unique angles.
            `;
        } else if (categoryId === 'Controversial Topics') {
            specificInstructions = `
            The user wants to explore controversial, incoherent, or theologically challenging topics from the Bible.
            Act as a critical theologian and historian. Generate ideas that question, analyze, and delve into difficult passages.
            Topics could include moral ambiguities (like the conquest of Canaan), scientific or historical inconsistencies, or passages that are hard to reconcile with modern ethics.
            The goal is to provoke deep thought and discussion, not to provide simple faith-based answers.
            `;
        } else if (categoryId === 'Angels') {
            specificInstructions = `
            The user wants to explore the topic of angels in the Bible.
            Act as a theologian and expert in angelology. Generate ideas for documentaries that explore the nature of angels, their hierarchy (cherubim, seraphim, archangels), their role as messengers, warriors, and guardians.
            Ideas could cover famous angelic encounters like Jacob's ladder, Gabriel's visit to Mary, or the angels at the empty tomb. Explore both the Old and New Testament depictions of angels.
            `;
        } else if (categoryId === 'Women in the Bible') {
            specificInstructions = `
            The user wants to explore the stories of women in the Bible.
            Act as a historian and theologian with a focus on feminist biblical studies. Generate ideas that highlight the roles, struggles, and faith of women in the scriptures.
            Cover both well-known figures like Mary, Ruth, and Esther, as well as lesser-known or controversial figures like Tamar, Rahab, or Jezebel.
            The ideas should explore their influence, societal context, and theological significance.
            `;
        } else if (categoryId === 'Life of Jesus (In-Depth)') {
            specificInstructions = `
            The user wants to do an in-depth exploration of the life of Jesus Christ.
            Generate ideas that go beyond simple retellings of his life. Focus on his miracles, his relationships (with disciples, family, enemies), the political and social context of his time, and the deeper theological meaning of his teachings and actions.
            Suggest documentary ideas that could explore aspects like "The Psychology of Jesus's Miracles," "The Lost Years of Jesus," or "Jesus the Revolutionary."
            `;
        } else if (categoryId === "Motivational (Jesus's Words)") {
            specificInstructions = `
            The user wants ideas for motivational speeches or short videos based on the teachings of Jesus.
            Act as an inspiring motivational speaker. Adapt Jesus's parables and words into modern, uplifting messages about hope, purpose, resilience, and personal growth.
            The tone should be contemporary and encouraging, not religious or preachy in a traditional sense. The ideas should feel applicable to a general audience's daily life challenges.
            `;
        } else if (categoryId && categoryId !== 'All') {
            const categoryInfo = CONTENT_CATEGORIES.find(c => c.id === categoryId);
            if (categoryInfo) {
                const translations = lang.startsWith('es') ? es : en;
                const translatedCategory = translations[categoryInfo.translationKey as keyof typeof en];
                specificInstructions = `Focus the ideas within the category of: "${translatedCategory}".`;
            }
        } else {
            specificInstructions = `Cover a diverse range of topics from both the Old and New Testaments.`;
        }

        let prompt = `
            You are an expert in biblical history and creative content generation.
            Generate ${ideaCount} compelling and unique ideas for documentaries or video series based on biblical events, characters, or concepts.
            Each idea should have a catchy title and a short, intriguing description (2-3 sentences).
            ${getLanguageInstruction(lang)}
            
            ${specificInstructions}
            
            Provide the output as a JSON object.
        `;

        if (keyword) {
            prompt += `\nFurther focus the ideas around the keyword: "${keyword}".`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        const ideasWithCategory: Idea[] = (jsonResponse.ideas || []).map((idea: Omit<Idea, 'category'>) => ({
            ...idea,
            category: categoryId,
        }));
        return ideasWithCategory;
    } catch (error) {
        handleApiError(error);
    }
};

export const generateScript = async (idea: Idea, style: string, lang: Lang, existingScript?: string): Promise<string> => {
    try {
        const ai = getAiClient();
        
        let styleInstructions = '';
        if (idea.category === "Motivational (Jesus's Words)") {
            styleInstructions = `The narration style MUST be that of a modern, inspiring motivational speaker. Adapt the core message into an uplifting, contemporary speech. Use storytelling and address the audience directly with encouraging words. Avoid traditional religious sermon language.`
        } else {
            styleInstructions = `The narration style must be: "${style}".
            - If 'Biblical Narrator', write as if a timeless narrator is recounting the story from a biblical perspective. Use evocative, historical language that feels authentic to the scriptures.
            - If 'Preacher', write as a passionate pastor delivering a sermon. Use rhetoric, ask questions to the audience, and draw moral or spiritual lessons, connecting the story to modern life.
            - If 'Documentary', write as a neutral, informative narrator for a voice-over, focusing on historical context, archaeological findings, and expert analysis, citing potential sources.
            - If 'Scientific Debate', write a script with two distinct voices. VOICE 1 is the Biblical Narrator, presenting the story from the scriptures. VOICE 2 is a skeptical Scientist/Historian, offering critical counterpoints, scientific explanations, or historical context that challenges the biblical account. The script should alternate between these two voices to create a dynamic debate. Start each voice's part with "NARRATOR:" or "SCIENTIST:".
            - If 'Biblical Storyteller', write as a warm, engaging storyteller. Use simple language, focus on the characters' emotions and the story's moral. The tone should be suitable for a broad audience, including families or children.
            - If 'Micro-Story', write an extremely concise and impactful narrative. The entire script should be only 2-4 sentences long, distilling the event to its powerful essence.
            - If 'First Person Podcast', identify the main character of the story (e.g., David, Peter, Mary Magdalene). Write the script from their first-person perspective (using "I", "me", "my"). The tone should be intimate and reflective, like a personal podcast or interview where the character is recounting their own life experiences, feelings, and thoughts.
            - If 'YouTube Script', write in a modern, engaging, and conversational style suitable for a YouTube documentary. Start with a strong hook to grab the viewer's attention within the first few seconds. Use clear, accessible language, not overly academic. The script can include rhetorical questions to engage the audience and should be structured for easy visual pacing (short, punchy sentences are good). It's for a single narrator talking directly to the audience.`
        }

        const prompt = `
            You are a master scriptwriter.
            ${getLanguageInstruction(lang)}

            ${existingScript 
                ? `Continue and extend the following script, maintaining the established tone and style. Here is the existing script:\n\n---\n${existingScript}\n---\n\nWrite the next logical section of the script, adding new details, depth, and narrative progression.`
                : `Write a compelling script for a voice-over based on the following idea:
                Title: ${idea.title}
                Description: ${idea.description}`
            }

            ${styleInstructions}

            CRITICAL: The output MUST be only the raw, narrative text for the voice-over. Do NOT include any formatting like "**SCENE 1**", "**VISUALS:**", character names, or markdown (bold, italics). The script should be a single block of plain text. If using the Debate style, the speaker labels "NARRATOR:" and "SCIENTIST:" are allowed but nothing else.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const generateScriptFromChapter = async (book: string, chapter: number, style: string, lang: Lang): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
            You are a master scriptwriter specializing in biblical content.
            ${getLanguageInstruction(lang)}

            Write a compelling script for a voice-over based on the biblical chapter of ${book}, chapter ${chapter}.

            The narration style must be: "${style}".
            - If 'Biblical Narrator', write as if a timeless narrator is recounting the story from a biblical perspective.
            - If 'Preacher', write as a passionate pastor delivering a sermon, connecting the story to modern life.
            - If 'Documentary', write as a neutral, informative narrator for a voice-over, focusing on historical context.
            - If 'Scientific Debate', write a script with two distinct voices. VOICE 1 is the Biblical Narrator, presenting the story from the scriptures. VOICE 2 is a skeptical Scientist/Historian, offering critical counterpoints, scientific explanations, or historical context that challenges the biblical account. The script should alternate between these two voices to create a dynamic debate. Start each voice's part with "NARRATOR:" or "SCIENTIST:".
            - If 'Biblical Storyteller', write as a warm, engaging storyteller. Use simple language, focus on the characters' emotions and the story's moral. The tone should be suitable for a broad audience, including families or children.
            - If 'Micro-Story', write an extremely concise and impactful narrative. The entire script should be only 2-4 sentences long, distilling the event to its powerful essence.
            - If 'First Person Podcast', identify the main character of the chapter (e.g., David, Peter, Mary Magdalene). Write the script from their first-person perspective (using "I", "me", "my"). The tone should be intimate and reflective, like a personal podcast or interview where the character is recounting their own life experiences, feelings, and thoughts.
            - If 'YouTube Script', write in a modern, engaging, and conversational style suitable for a YouTube documentary. Start with a strong hook to grab the viewer's attention within the first few seconds. Use clear, accessible language, not overly academic. The script can include rhetorical questions to engage the audience and should be structured for easy visual pacing (short, punchy sentences are good). It's for a single narrator talking directly to the audience.

            CRITICAL: The output MUST be only the raw, narrative text for the voice-over. Do NOT include any formatting like "**SCENE 1**", "**VISUALS:**", character names, or markdown (bold, italics). The script should be a single block of plain text. If using the Debate style, the speaker labels "NARRATOR:" and "SCIENTIST:" are allowed but nothing else.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const generatePromptsForScript = async (script: string, lang: Lang, characters: Character[], visualStyle: VisualStyle): Promise<{ segment: string; prompt: string; }[]> => {
    try {
        const ai = getAiClient();
        
        let characterInstructions = '';
        if (characters.length > 0) {
            characterInstructions = `
            **DEFINED CHARACTERS (CRITICAL FOR CONSISTENCY):**
            You MUST adhere to these visual descriptions for the following characters in every prompt where they appear. This is essential for visual continuity.
            ${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}
            `;
        }

        let styleInstructions = '';
        switch(visualStyle) {
            case 'Más Realista':
                styleInstructions = 'The visual style MUST be hyper-realistic, indistinguishable from a high-resolution photograph taken for a BBC-style historical documentary. This is a reenactment scene with real actors. It must look filmed with a high-end 4K cinematic camera (e.g., ARRI Alexa) with prime lenses. Absolutely no CGI, digital, or rendered look. Focus on authentic, photorealistic human skin textures with pores and subtle imperfections, realistic eyes, and historically accurate, textured clothing. Lighting must be naturalistic and complex. Use terms like "ultra-detailed 4K photo", "historical reenactment", "BBC documentary style", "photorealistic skin texture", "shot on ARRI Alexa".';
                break;
            case 'Cinematic':
                styleInstructions = 'The visual style must be cinematic, evoking the feel of a high-budget film. Use dramatic lighting (Rembrandt lighting, chiaroscuro), professional color grading (e.g., teal and orange), and a shallow depth of field to create bokeh. Emphasize mood and emotion through visuals. Use terms like "epic wide shot", "anamorphic lens flare", "subtle film grain", "moody, atmospheric lighting".';
                break;
            case 'For Kids (Cartoon)':
                styleInstructions = 'The visual style MUST be a friendly, inviting 3D cartoon for children. Use soft, rounded shapes, bright and cheerful primary colors, and simple, expressive character designs. The tone should be gentle and heartwarming. Describe scenes with terms like "charming 3D animation, Pixar style", "soft ambient lighting", "friendly and smiling characters".';
                break;
            case 'Comic Book':
                styleInstructions = 'The visual style MUST be a gritty, high-contrast comic book style, reminiscent of artists like Frank Miller or Jim Lee. Use bold ink lines, dramatic cross-hatching for shadows, dynamic perspectives, and a limited, impactful color palette. Describe scenes with terms like "graphic novel illustration", "dynamic action lines", "heavy black inks", "dramatic shadows".';
                break;
            case 'Painted':
                styleInstructions = 'The visual style must resemble a classical oil painting by masters like Caravaggio or Rembrandt. Use rich textures, visible brushstrokes, and a dramatic interplay of light and shadow (chiaroscuro). The composition should be thoughtful and artistic.';
                break;
            case 'Documentary Photo':
                styleInstructions = 'The visual style must be that of a gritty, authentic documentary photograph. It must feel real and unstaged. Use a realistic, slightly desaturated color palette, natural available lighting, and a candid, "in-the-moment" composition. The image should have the texture of a real photo, not a digital render. Imagine it was shot on location with a Leica M-series camera. --no staged, posed, cgi, render';
                break;
            default:
                styleInstructions = 'The visual style must be immersive, transporting the viewer to the biblical era. It must be hyper-realistic, with cinematic quality.';
        }


        const prompt = `
            You are an expert prompt engineer for cinematic AI image and video generation.
            Your task is to take the following script, break it down into logical scenes, and create a detailed visual prompt for each scene based on the specified visual style.
            
            CRITICAL PACING RULE: Break the script into short, logical scenes. Each scene's narration should last approximately 8 seconds when read at a moderate pace. This is critical for video pacing.

            CRITICAL COMPLETENESS RULE: You MUST process the entire script from beginning to end. Do not omit any part of it. Every single sentence from the original script must be included in one of the "segment" outputs. The combined "segment" values should reconstruct the full original script.

            If the script contains speaker labels like "NARRATOR:" or "SCIENTIST:", treat the text that follows the label as the script segment for that scene. The label itself should not be part of the final "segment" value.

            ${characterInstructions}
            
            **MASTER VISUAL STYLE (MANDATORY): ${styleInstructions}**

            Apply this master style to every prompt you generate to ensure visual continuity and a professional, film-like quality.

            VISUAL PROMPT REQUIREMENTS FOR EACH SCENE:
            - CRITICAL & STRICT LIMIT: The prompt must be detailed but MUST NEVER exceed a maximum of 1000 characters. This is an unbreakable rule.
            - CRITICAL ANATOMY RULE: When characters are present, especially their hands or faces, you MUST actively include descriptive phrases to reinforce correct anatomy. For example: "anatomically correct hands with five distinct fingers", "symmetrical facial features", "natural-looking eyes". This is crucial to avoid visual errors.
            - It must contain historically accurate details in architecture, clothing (e.g., textures of rough-spun wool, leather sandals), and environment.
            - Include specific camera instructions (e.g., "dolly zoom," "extreme close-up on teary eyes," "sweeping panoramic view," "slow-motion").
            - A MANDATORY negative prompt section starting with "--no". This section is not optional. Include a comprehensive list of terms to prevent common artifacts: "--no cgi, painting, illustration, cartoon, 3d render, deformed hands, malformed limbs, floating limbs, fused fingers, extra fingers, missing limbs, distorted faces, asymmetrical eyes, unnatural body proportions, weird anatomy, mutations, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft, jpeg artifacts, inconsistent character appearance".
            - The prompt must be in English for the image generation model to have the best performance.
            
            Here is the script:
            ---
            ${script}
            ---

            Return the output as a JSON array. Each object must have two keys: "segment" (the original script text, in the original language, without speaker labels) and "prompt" (the detailed English visual prompt).
        `;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            segment: { type: Type.STRING },
                            prompt: { type: Type.STRING },
                        },
                    },
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        handleApiError(error);
    }
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, visualStyle: VisualStyle): Promise<string> => {
    try {
        // 1. Intentar con Hugging Face (FLUX.1-schnell) si hay API KEY
        const hfKey = import.meta.env.VITE_HF_API_KEY;
        if (hfKey) {
            try {
                const hfModelUrl = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
                const enhancedPrompt = `${visualStyle} style: ${prompt}`;
                
                const hfResponse = await fetch(hfModelUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${hfKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        inputs: enhancedPrompt,
                        parameters: {
                            num_inference_steps: 4,
                        },
                        options: {
                            wait_for_model: true
                        }
                    }),
                });

                if (hfResponse.ok) {
                    const blob = await hfResponse.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                console.warn("Hugging Face failed, falling back to Pollinations AI", e);
            }
        }

        // 2. Fallback: Pollinations AI (Gratis, sin key, alta calidad con modelo flux)
        const width = 1024;
        const height = aspectRatio === '16:9' ? 576 : (aspectRatio === '9:16' ? 1792 : 1024);
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(`${visualStyle} style biblical scene: ${prompt}`);
        
        // Retornamos la URL de Pollinations directamente
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true&enhance=true`;
    } catch (error) {
        handleApiError(error);
    }
};

export const summarizeScript = async (script: string, lang: Lang): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
            You are a skilled editor. Summarize the following script into a concise, short version suitable for a brief video (like a YouTube Short or Instagram Reel).
            Retain the core message, tone, and key narrative points.
            ${getLanguageInstruction(lang)}

            Script to summarize:
            ---
            ${script}
            ---
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const findBiblicalQuote = async (context: string, lang: Lang): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
            You are a biblical scholar. Based on the following script context, find a relevant and powerful Bible verse (including the book, chapter, and verse number) that would enhance its message.
            ${getLanguageInstruction(lang)}

            Script context:
            ---
            ${context}
            ---
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const generateSEOMetadata = async (script: string, lang: Lang): Promise<SEOMetadata> => {
    try {
        const ai = getAiClient();
        const prompt = `You are an expert SEO and content strategist for video platforms like YouTube. Your audience is interested in biblical documentaries. I will provide a script. First, use Google Search to analyze top-ranking videos and articles on the script's topic to understand common keywords, effective title structures, and engaging description styles. Based on this research and the provided script, generate the following in ${lang.startsWith('es') ? 'Spanish' : 'English'}: 1. A compelling, SEO-optimized title (max 70 characters). 2. A captivating description (max 500 characters) that hooks the viewer and includes a summary of the content. 3. A list of 10-15 relevant hashtags. Your output MUST be a single, minified JSON object with the keys "title", "description", and "hashtags" (an array of strings). Do not include any other text, markdown, or explanations before or after the JSON object. Script: --- ${script} ---`;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();
        const parsedJson = JSON.parse(cleanedText);

        if (typeof parsedJson.title === 'string' && typeof parsedJson.description === 'string' && Array.isArray(parsedJson.hashtags)) {
             return parsedJson as SEOMetadata;
        } else {
            throw new Error("AI returned an invalid JSON structure for SEO metadata.");
        }
       
    } catch (error) {
        console.error("Error generating SEO metadata:", error);
        if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
            handleApiError(error);
        }
        throw new Error("Failed to generate or parse SEO metadata from AI.");
    }
};

export const analyzeVerse = async (book: string, chapter: number, startVerse: number, endVerse: number | null, lang: Lang): Promise<string> => {
    try {
        const ai = getAiClient();
        const verseRange = endVerse && endVerse > startVerse ? `${startVerse}-${endVerse}` : `${startVerse}`;
        const prompt = `
            You are a master theologian, historian, and biblical scholar.
            ${getLanguageInstruction(lang)}

            Provide a deep and comprehensive analysis of the following biblical passage: ${book} ${chapter}:${verseRange}.

            Your analysis MUST include the following sections:
            1.  **Historical and Cultural Context:** Describe the setting, the author, the intended audience, and the cultural norms relevant to this passage. What was happening in the world at that time?
            2.  **Theological Meaning:** Explain the core theological message. What does this passage teach about God, humanity, salvation, and other key doctrines?
            3.  **Literary Analysis:** Discuss the genre (e.g., poetry, narrative, law, prophecy), literary devices used, and key words or phrases in the original language (if relevant).
            4.  **Connections to Scripture:** How does this passage connect with other parts of the Bible (both Old and New Testaments)? Are there prophecies fulfilled, themes repeated, or earlier events referenced?
            5.  **Practical Application:** How can this passage be applied to the life of a modern believer? What are the practical lessons or encouragements?

            The output should be well-structured, clear, and insightful. Do not just summarize the text; provide a deep analysis.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const generateRandomVerseScript = async (style: string, lang: Lang): Promise<string> => {
    try {
        const ai = getAiClient();

        const allBooks = [...bibleData.oldTestament, ...bibleData.newTestament];
        const randomBook = allBooks[Math.floor(Math.random() * allBooks.length)];
        const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
        const bookName = lang.startsWith('es') ? randomBook.name_es : randomBook.name_en;

        const prompt = `
            You are a master scriptwriter and theologian.
            ${getLanguageInstruction(lang)}

            Your task is:
            1. Select a single, powerful, and thought-provoking verse completely at random from the biblical book of ${bookName}, chapter ${randomChapter}.
            2. Use Google Search to research this verse's context, meaning, and theological significance.
            3. Write a compelling, voice-over script about this verse.

            The narration style must be: "${style}".
            - If 'Biblical Narrator', write as if a timeless narrator is recounting the story from a biblical perspective.
            - If 'Preacher', write as a passionate pastor delivering a sermon, connecting the story to modern life.
            - If 'Documentary', write as a neutral, informative narrator for a voice-over, focusing on historical context.
            - If 'Scientific Debate', write a script with two distinct voices. VOICE 1 is the Biblical Narrator, presenting the story from the scriptures. VOICE 2 is a skeptical Scientist/Historian, offering critical counterpoints, scientific explanations, or historical context that challenges the biblical account. The script should alternate between these two voices to create a dynamic debate. Start each voice's part with "NARRATOR:" or "SCIENTIST:".
            - If 'Biblical Storyteller', write as a warm, engaging storyteller. Use simple language, focus on the characters' emotions and the story's moral. The tone should be suitable for a broad audience, including families or children.
            - If 'Micro-Story', write an extremely concise and impactful narrative. The entire script should be only 2-4 sentences long, distilling the event to its powerful essence.
            - If 'First Person Podcast', identify the main character related to the verse. Write the script from their first-person perspective (using "I", "me", "my"). The tone should be intimate and reflective, like a personal podcast or interview where the character is recounting their own life experiences, feelings, and thoughts related to that verse.
            - If 'YouTube Script', write in a modern, engaging, and conversational style suitable for a YouTube documentary. Start with a strong hook to grab the viewer's attention within the first few seconds. Use clear, accessible language, not overly academic. The script can include rhetorical questions to engage the audience and should be structured for easy visual pacing (short, punchy sentences are good). It's for a single narrator talking directly to the audience.

            CRITICAL: The script's very first line MUST be the Bible verse citation (e.g., ${bookName} ${randomChapter}:[VerseNumber]) enclosed in parentheses. The rest of the output must be ONLY the raw, narrative text for the voice-over, with no other formatting, labels, or explanations. The output should be a single block of plain text.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};

export const expandPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const currentLength = prompt.length;
        const targetLength = Math.min(4000, currentLength * 2);

        const apiPrompt = `
            You are an expert prompt engineer for cinematic AI image generation.
            Take the following existing prompt and expand it to approximately double its length (target: ${targetLength} characters, max 4000).
            Your task is to add significantly more detail while preserving the original intent and style.
            
            EXPANSION REQUIREMENTS:
            1.  **Visual Detail:** Add more descriptive adjectives. Elaborate on textures (fabric, skin, stone), lighting (time of day, light source, quality of light), atmospheric effects (dust motes, fog, heat haze), and environmental details (flora, fauna, architecture specifics).
            2.  **Anatomy Reinforcement (CRITICAL):** Add even more explicit phrases to ensure anatomical correctness. For example, if the original prompt mentioned "hands", expand it to "perfectly formed, anatomically correct hands with five distinct, elegant fingers and detailed knuckles". If it mentioned a face, expand to "a symmetrical, photorealistic face with clear, expressive eyes and natural skin texture".
            3.  **Camera and Composition:** Add more specific camera directions if they can enhance the scene (e.g., "dynamic low-angle shot", "subtle rack focus from foreground to background").
            4.  **Negative Prompts:** Expand the "--no" section with more terms to avoid common errors. Add things like "fused limbs, unrealistic textures, plastic look, blurry details, strange artifacts".
            5.  **Maintain Structure:** Keep the core concepts and character descriptions from the original prompt. The final output must be only the expanded prompt text, in English, including the expanded "--no" section.

            EXISTING PROMPT TO EXPAND:
            ---
            ${prompt}
            ---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: apiPrompt,
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
    }
};
