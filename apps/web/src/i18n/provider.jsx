'use client';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

import ar from '../../messages/ar.json';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';

import { defaultLocale, isValidLocale, localeDirections } from './config';
const allMessages = { en, fr, ar };
function getStoredLocale() {
    if (typeof window === 'undefined') {
        return defaultLocale;
    }
    try {
        const stored = localStorage.getItem('eduai-locale');
        if (stored && isValidLocale(stored)) {
            return stored;
        }
    }
    catch {
        // localStorage unavailable
    }
    return defaultLocale;
}
export function I18nProvider({ children }) {
    const [locale, setLocale] = useState(defaultLocale);
    useEffect(() => {
        const stored = getStoredLocale();
        setLocale(stored);
        // Sync <html> dir attribute for RTL support
        document.documentElement.setAttribute('dir', localeDirections[stored]);
        document.documentElement.setAttribute('lang', stored);
    }, []);
    // Listen for locale change events dispatched by the settings page
    useEffect(() => {
        const handler = (e) => {
            const next = e.detail.locale;
            setLocale(next);
            document.documentElement.setAttribute('dir', localeDirections[next]);
            document.documentElement.setAttribute('lang', next);
            try {
                localStorage.setItem('eduai-locale', next);
            }
            catch {
                // ignore
            }
        };
        window.addEventListener('eduai:locale-change', handler);
        return () => window.removeEventListener('eduai:locale-change', handler);
    }, []);
    return (<NextIntlClientProvider locale={locale} messages={allMessages[locale]} timeZone="UTC" now={new Date()}>
      {children}
    </NextIntlClientProvider>);
}
/** Call this to switch locale at runtime (e.g. from settings page) */
export function setLocale(locale) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.setItem('eduai-locale', locale);
    }
    catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent('eduai:locale-change', { detail: { locale } }));
}
