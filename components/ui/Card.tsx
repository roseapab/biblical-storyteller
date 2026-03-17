
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    const baseStyles = 'bg-gray-800 border border-gray-700 rounded-lg shadow-md';
    const combinedClassName = `${baseStyles} ${className}`;

    return (
        <div className={combinedClassName}>
            {children}
        </div>
    );
};

export default Card;
