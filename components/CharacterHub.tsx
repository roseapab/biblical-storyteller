
import React, { useState } from 'react';
import type { Character } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import Card from './ui/Card';
import Button from './ui/Button';
import Tooltip from './ui/Tooltip';

interface CharacterHubProps {
    characters: Character[];
    onUpdateCharacters: (characters: Character[]) => void;
}

const CharacterHub: React.FC<CharacterHubProps> = ({ characters, onUpdateCharacters }) => {
    const t = useTranslations();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [currentCharacter, setCurrentCharacter] = useState({ id: '', name: '', description: '' });

    const handleAddOrUpdateCharacter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCharacter.name || !currentCharacter.description) return;

        if (isEditing) {
            onUpdateCharacters(characters.map(c => c.id === isEditing ? { ...currentCharacter, id: isEditing } : c));
        } else {
            onUpdateCharacters([...characters, { ...currentCharacter, id: crypto.randomUUID() }]);
        }
        resetForm();
    };
    
    const handleEdit = (character: Character) => {
        setIsEditing(character.id);
        setCurrentCharacter(character);
    };

    const handleDelete = (characterId: string) => {
        if (window.confirm("Are you sure you want to delete this character?")) {
            onUpdateCharacters(characters.filter(c => c.id !== characterId));
        }
    };
    
    const resetForm = () => {
        setIsEditing(null);
        setCurrentCharacter({ id: '', name: '', description: '' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                    <form onSubmit={handleAddOrUpdateCharacter} className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-amber-400">{isEditing ? t('editCharacter') : t('addCharacter')}</h3>
                        <div>
                            <label htmlFor="char-name" className="block text-sm font-medium text-gray-400 mb-1">{t('characterName')}</label>
                            <input
                                id="char-name"
                                type="text"
                                value={currentCharacter.name}
                                onChange={(e) => setCurrentCharacter({ ...currentCharacter, name: e.target.value })}
                                placeholder={t('characterNamePlaceholder')}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <Tooltip text={t('characterHubDescription')}>
                                <label htmlFor="char-desc" className="block text-sm font-medium text-gray-400 mb-1">{t('characterDescription')}</label>
                            </Tooltip>
                            <textarea
                                id="char-desc"
                                value={currentCharacter.description}
                                onChange={(e) => setCurrentCharacter({ ...currentCharacter, description: e.target.value })}
                                placeholder={t('characterDescriptionPlaceholder')}
                                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit">{isEditing ? t('saveCharacter') : t('addCharacter')}</Button>
                            {isEditing && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
                        </div>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('characterHubTitle')}</h2>
                        <p className="mb-6 text-gray-400">{t('characterHubDescription')}</p>
                         {characters.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">{t('noCharacters')}</p>
                         ) : (
                            <div className="space-y-4">
                                {characters.map(char => (
                                    <div key={char.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg text-amber-300">{char.name}</h4>
                                                <p className="text-gray-400 mt-1">{char.description}</p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(char)}>{t('editCharacter')}</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(char.id)}>{t('deleteCharacter')}</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CharacterHub;
