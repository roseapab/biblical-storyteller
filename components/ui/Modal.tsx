
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-4 overflow-y-auto" 
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl my-auto mx-4 border border-gray-700 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animationName: 'fade-in-scale',
                    animationDuration: '0.2s',
                    animationFillMode: 'forwards'
                }}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-amber-400">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white text-2xl leading-none font-bold"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation-name: fade-in-scale;
                    animation-duration: 0.2s;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
};

export default Modal;
