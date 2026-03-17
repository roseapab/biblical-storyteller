
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useTranslations } from '../../hooks/useTranslations';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const t = useTranslations();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('welcomeTitle')}>
            <div className="space-y-4 text-gray-300">
                <p>
                    {t('welcomeIntro')}
                </p>
                <div className="flex justify-end pt-4">
                     <Button onClick={onClose}>{t('close')}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default WelcomeModal;
