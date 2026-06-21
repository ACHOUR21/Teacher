import { clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatDate(date, formatStr = 'MMM d, yyyy') {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
}
export function formatRelativeDate(date) {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
}
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return remainingSeconds > 0
            ? `${minutes}m ${remainingSeconds}s`
            : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
}
export function formatNumber(num, locale = 'en-US') {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat(locale).format(num);
}
export function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
export function truncate(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return `${str.slice(0, maxLength)}...`;
}
export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export function generateInitials(name) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
export function getAvatarColor(name) {
    const colors = [
        'bg-blue-500',
        'bg-purple-500',
        'bg-green-500',
        'bg-amber-500',
        'bg-red-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        colors.length;
    return colors[index];
}
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function parseErrorMessage(error) {
    if (typeof error === 'string') {
        return error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string') {
        return error.message;
    }
    return 'An unexpected error occurred';
}
export function getProgressColor(progress) {
    if (progress >= 80) {
        return 'bg-green-500';
    }
    if (progress >= 50) {
        return 'bg-blue-500';
    }
    if (progress >= 25) {
        return 'bg-amber-500';
    }
    return 'bg-red-500';
}
export function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
}
