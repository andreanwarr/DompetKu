import { locale } from '@/lib/i18n';

const numberLocale = () => (locale() === 'en' ? 'en-US' : 'id-ID');

export const rupiah = (value: number) =>
    new Intl.NumberFormat(numberLocale(), {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export const shortDate = (value: string) =>
    new Intl.DateTimeFormat(numberLocale(), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
