import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { useTranslations } from '../hooks/useTranslations';
import { AUTHORIZED_USERS_URL } from '../config';
import Spinner from './ui/Spinner';

interface LoginProps {
    onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const t = useTranslations();

    const validateEmail = (email: string) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const lowerCaseEmail = email.toLowerCase().trim();

        if (!validateEmail(lowerCaseEmail)) {
            setError(t('validEmailError'));
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            if (!AUTHORIZED_USERS_URL.startsWith('https://')) {
                console.error("Authorization URL is not configured or is invalid.");
                setError(t('loginVerificationError'));
                return;
            }

            const response = await fetch(AUTHORIZED_USERS_URL, { cache: 'no-cache' });

            if (!response.ok) {
                throw new Error('Failed to fetch authorized users list.');
            }

            const authorizedEmails: string[] = await response.json();

            if (!Array.isArray(authorizedEmails)) {
                 throw new Error('Authorized users list is not in the correct format.');
            }

            const isAuthorized = authorizedEmails.some(
                authorizedEmail => typeof authorizedEmail === 'string' && authorizedEmail.toLowerCase() === lowerCaseEmail
            );

            if (isAuthorized) {
                onLogin(email);
            } else {
                setError(t('loginAccessDenied'));
            }
        } catch (err) {
            console.error("Authorization check failed:", err);
            setError(t('loginVerificationError'));
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full animate-fade-in-scale">
                 <style>{`
                    @keyframes fade-in-scale {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .animate-fade-in-scale {
                        animation-name: fade-in-scale;
                        animation-duration: 0.3s;
                        animation-fill-mode: forwards;
                    }
                `}</style>
                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <h1 className="text-3xl font-bold text-white tracking-wider">{t('appTitle')}</h1>
                        <p className="text-gray-400 mt-2">{t('loginToContinue')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError('');
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
                                placeholder="your.email@example.com"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div>
                            <Button type="submit" className="w-full" size="lg" disabled={isVerifying}>
                                {isVerifying ? <Spinner /> : t('continue')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default Login;
