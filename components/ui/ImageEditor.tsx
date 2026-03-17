
import React, { useState, useMemo } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import Button from './Button';

interface ImageEditorProps {
    imageUrl: string;
    initialFilters: { base: string, brightness: number, contrast: number, saturate: number };
    onClose: () => void;
    onSave: (newFilters: { base: string, brightness: number, contrast: number, saturate: number }) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, initialFilters, onClose, onSave }) => {
    const t = useTranslations();
    const [filters, setFilters] = useState(initialFilters);
    const isVintage = filters.base === 'filter-vintage';

    const filterStyle = useMemo(() => {
        const baseFilterValues: { [key: string]: string } = {
            'filter-sepia': 'sepia(80%)',
            'filter-grayscale': 'grayscale(100%)',
            'filter-vintage': 'sepia(60%) contrast(1.1) brightness(0.9) saturate(1.5)',
            'filter-contrast': 'contrast(150%)',
        };
        
        let combinedFilter = baseFilterValues[filters.base] || '';
        
        if (!isVintage) {
             combinedFilter += ` brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
        }
        
        return {
            filter: combinedFilter.trim()
        };
    }, [filters, isVintage]);
    
    const baseFilters = [
        { name: t('filterNone'), class: 'filter-none' },
        { name: t('filterSepia'), class: 'filter-sepia' },
        { name: t('filterGrayscale'), class: 'filter-grayscale' },
        { name: t('filterVintage'), class: 'filter-vintage' },
        { name: t('filterContrast'), class: 'filter-contrast' },
        { name: t('filterVignette'), class: 'filter-vignette' },
    ];
    
    const handleReset = () => {
        setFilters({ base: 'filter-none', brightness: 100, contrast: 100, saturate: 100 });
    }

    const handleSave = () => {
        onSave(filters);
        onClose();
    };
    
    const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean}> = ({label, value, onChange, disabled = false}) => (
        <div className={disabled ? 'opacity-50' : ''}>
            <label className="text-sm text-gray-400">{label}: {value}%</label>
            <input 
                type="range" 
                min="0" 
                max="200" 
                value={value} 
                onChange={onChange} 
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb disabled:cursor-not-allowed"
                disabled={disabled}
            />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <style>{`
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #f59e0b; /* amber-500 */
                    cursor: pointer;
                    border-radius: 50%;
                }
                .range-thumb:disabled::-webkit-slider-thumb {
                    background: #4b5563; /* gray-600 */
                    cursor: not-allowed;
                }

                .range-thumb::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: #f59e0b;
                    cursor: pointer;
                    border-radius: 50%;
                    border: none;
                }
                .range-thumb:disabled::-moz-range-thumb {
                    background: #4b5563;
                    cursor: not-allowed;
                }
            `}</style>
            <div className="flex justify-center items-center bg-gray-900 p-2 rounded-lg border border-gray-700">
                <div className="relative w-full">
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-auto object-contain rounded-md transition-all duration-300 max-h-[75vh]"
                        style={filterStyle}
                    />
                    {filters.base === 'filter-vignette' && <div className="absolute inset-0 w-full h-full pointer-events-none rounded-md shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]"></div>}
                </div>
            </div>

            <div className="flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="space-y-3">
                        <Slider label={t('brightness')} value={filters.brightness} onChange={e => setFilters(f => ({ ...f, brightness: Number(e.target.value) }))} disabled={isVintage} />
                        <Slider label={t('contrast')} value={filters.contrast} onChange={e => setFilters(f => ({ ...f, contrast: Number(e.target.value) }))} disabled={isVintage} />
                        <Slider label={t('saturate')} value={filters.saturate} onChange={e => setFilters(f => ({ ...f, saturate: Number(e.target.value) }))} disabled={isVintage} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-700">
                        {baseFilters.map(filter => (
                            <button
                                key={filter.class}
                                onClick={() => setFilters(f => ({ ...f, base: filter.class }))}
                                className={`p-2 rounded-md text-center text-sm border-2 transition-colors ${filters.base === filter.class ? 'border-amber-500 bg-amber-500/20' : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {filter.name}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-700 mt-4">
                    <Button variant="secondary" onClick={handleReset}>{t('reset')}</Button>
                    <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                    <Button onClick={handleSave}>{t('saveChanges')}</Button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
