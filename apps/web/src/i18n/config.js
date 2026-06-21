export const locales = ['en', 'fr', 'ar'];
export const defaultLocale = 'en';
export const localeNames = {
    en: 'English',
    fr: 'Français',
    ar: 'العربية',
};
export const localeDirections = {
    en: 'ltr',
    fr: 'ltr',
    ar: 'rtl',
};
export function isValidLocale(value) {
    return locales.includes(value);
}
