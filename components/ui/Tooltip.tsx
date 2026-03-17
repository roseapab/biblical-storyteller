
import React from 'react';

interface TooltipProps {
    children: React.ReactNode;
    text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
    return (
        <div className="relative inline-block group">
            {children}
            <div className="absolute bottom-full left-1/2 z-20 w-max max-w-xs mb-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-1/2 pointer-events-none border border-gray-700">
                {text}
                <div className="tooltip-arrow absolute left-1/2 -translate-x-1/2 top-full" style={{ borderTopColor: 'rgb(55 65 81)' }}></div>
            </div>
            <style>{`
                .tooltip-arrow {
                    content: '';
                    position: absolute;
                    border-width: 5px;
                    border-style: solid;
                    border-color: transparent;
                }
            `}</style>
        </div>
    );
};

export default Tooltip;
