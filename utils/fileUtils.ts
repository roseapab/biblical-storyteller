import type { ProjectData, Character, SEOMetadata } from '../types';
import { jsPDF } from 'jspdf';

export const saveProject = (projectData: ProjectData): void => {
    try {
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const projectName = projectData.selectedIdea?.title.replace(/\s/g, '_') || 'Biblical_Project';
        a.download = `${projectName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to save project:", error);
        alert("Could not save project. See console for details.");
    }
};

export const loadProject = (onLoad: (data: ProjectData) => void): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const data: ProjectData = JSON.parse(text);
                    // Basic validation
                    if (data && Array.isArray(data.ideas)) {
                        onLoad(data);
                    } else {
                        throw new Error("Invalid project file format.");
                    }
                }
            } catch (error) {
                console.error("Failed to load or parse project file:", error);
                alert("Could not load project. The file might be corrupted or in the wrong format.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

export const exportScriptAsTxt = (script: string, title: string): void => {
    try {
        const blob = new Blob([script], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = title.replace(/\s/g, '_');
        a.download = `${fileName}_script.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export script as TXT:", error);
    }
};

export const exportSeoAsTxt = (metadata: SEOMetadata, title: string): void => {
    try {
        let content = `Title: ${metadata.title}\n\n`;
        content += `Description:\n${metadata.description}\n\n`;
        content += `Hashtags:\n${metadata.hashtags.join(' ')}\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = title.replace(/\s/g, '_');
        a.download = `${fileName}_seo.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export SEO as TXT:", error);
    }
};

export const exportScriptAsPdf = (script: string, title: string): void => {
    try {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxW = pageW - margin * 2;
        
        doc.setFontSize(18).setFont('helvetica', 'bold');
        doc.text(title, pageW / 2, 20, { align: 'center' });
        
        doc.setFontSize(12).setFont('helvetica', 'normal');
        const scriptLines = doc.splitTextToSize(script, maxW);
        doc.text(scriptLines, margin, 35);
        
        const fileName = title.replace(/\s/g, '_');
        doc.save(`${fileName}_script.pdf`);
    } catch (error) {
        console.error("Failed to export script as PDF:", error);
    }
};


export const exportProjectAsTxt = (projectData: ProjectData): void => {
    if (!projectData.selectedIdea) {
        alert("No selected idea to export.");
        return;
    }

    let content = `BIBLICAL DOCUMENTARY STUDIO PROJECT\n`;
    content += `=====================================\n\n`;
    content += `IDEA\n`;
    content += `----\n`;
    content += `Title: ${projectData.selectedIdea.title}\n`;
    content += `Description: ${projectData.selectedIdea.description}\n\n`;
    
    if (projectData.characters && projectData.characters.length > 0) {
        content += `CHARACTERS\n`;
        content += `----------\n`;
        projectData.characters.forEach(char => {
            content += `Name: ${char.name}\n`;
            content += `Description: ${char.description}\n\n`;
        });
    }

    if (projectData.script.length > 0) {
        content += `SCRIPT & VISUAL PROMPTS\n`;
        content += `-------------------------\n\n`;

        projectData.script.forEach((segment, index) => {
            content += `SCENE ${index + 1}\n\n`;
            content += `[SCRIPT SEGMENT]\n${segment.segment}\n\n`;
            content += `[VISUAL PROMPT]\n${segment.prompt}\n\n`;
            content += `-------------------------\n\n`;
        });
    }


    try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const projectName = projectData.selectedIdea.title.replace(/\s/g, '_');
        a.download = `${projectName}_project.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export project as TXT:", error);
        alert("Could not export project. See console for details.");
    }
};

export const exportProjectAsPdf = (projectData: ProjectData): void => {
    if (!projectData.selectedIdea) {
        alert("No selected idea to export.");
        return;
    }
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxW = pageW - margin * 2;
    let y = 20;

    const checkPageBreak = (height: number) => {
        if (y + height > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = 20;
        }
    };

    // Title Page
    doc.setFontSize(22).setFont('helvetica', 'bold');
    doc.text(projectData.selectedIdea.title, pageW / 2, y, { align: 'center' });
    y += 15;
    doc.setFontSize(12).setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(projectData.selectedIdea.description, maxW);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 10;
    
    doc.addPage();
    y=20;

    // Characters Page
    if (projectData.characters && projectData.characters.length > 0) {
        doc.setFontSize(18).setFont('helvetica', 'bold');
        doc.text("Characters", margin, y);
        y += 10;
        
        projectData.characters.forEach(char => {
            checkPageBreak(20);
            doc.setFontSize(14).setFont('helvetica', 'bold');
            doc.text(char.name, margin, y);
            y += 7;
            doc.setFontSize(11).setFont('helvetica', 'normal');
            const charDescLines = doc.splitTextToSize(char.description, maxW);
            checkPageBreak(charDescLines.length * 5 + 5);
            doc.text(charDescLines, margin, y);
            y += charDescLines.length * 5 + 10;
        });
        doc.addPage();
        y=20;
    }

    // Script & Storyboard
    if(projectData.script && projectData.script.length > 0) {
        doc.setFontSize(18).setFont('helvetica', 'bold');
        doc.text("Storyboard & Script", margin, y);
        y += 15;

        projectData.script.forEach((segment, index) => {
            checkPageBreak(80); // Min space for a scene
            doc.setFontSize(16).setFont('helvetica', 'bold');
            doc.text(`Scene ${index + 1}`, margin, y);
            y += 10;

            if (segment.image) {
                try {
                     // Get image properties
                    const img = new Image();
                    img.src = segment.image;
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const ratio = imgWidth / imgHeight;
                    
                    let newWidth = maxW / 2 - 5;
                    let newHeight = newWidth / ratio;
                    
                    checkPageBreak(newHeight + 10);
                    doc.addImage(segment.image, 'JPEG', margin + maxW / 2 + 5, y, newWidth, newHeight);
                    
                    doc.setFontSize(11).setFont('helvetica', 'normal');
                    const scriptLines = doc.splitTextToSize(segment.segment, maxW / 2 - 5);
                    doc.text(scriptLines, margin, y);

                    y += Math.max(newHeight, scriptLines.length * 5) + 15;

                } catch(e) {
                    console.error("Could not add image to PDF", e);
                    doc.text("[Image could not be loaded]", margin + maxW / 2 + 5, y);
                     y += 15;
                }
            } else {
                 doc.setFontSize(11).setFont('helvetica', 'normal');
                const scriptLines = doc.splitTextToSize(segment.segment, maxW);
                checkPageBreak(scriptLines.length * 5 + 5);
                doc.text(scriptLines, margin, y);
                y += scriptLines.length * 5 + 10;
            }
        });
    }


    const projectName = projectData.selectedIdea.title.replace(/\s/g, '_');
    doc.save(`${projectName}_project.pdf`);
};