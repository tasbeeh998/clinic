import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

interface DateInputProps {
    value: string; // 'YYYY-MM-DD' or ''
    onChange: (value: string) => void;
    className?: string;
    placeholderText?: string;
    disabled?: boolean;
    isClearable?: boolean;
}

function toDate(value: string): Date | null {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function toDateString(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function DateInput({ value, onChange, className, placeholderText, disabled, isClearable }: DateInputProps) {
    return (
        <DatePicker
            selected={toDate(value)}
            onChange={(date) => onChange(toDateString(date))}
            dateFormat="dd/MM/yyyy"
            placeholderText={placeholderText || 'dd/mm/yyyy'}
            disabled={disabled}
            isClearable={isClearable}
            locale="en-GB"
            className={className || 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]'}
        />
    );
}
