import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

interface DateTimeInputProps {
    value: string; // 'YYYY-MM-DDTHH:mm'
    onChange: (value: string) => void;
    className?: string;
}

function toDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function toDateTimeString(date: Date | null): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
    return (
        <DatePicker
            selected={toDate(value)}
            onChange={(date) => onChange(toDateTimeString(date))}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd/MM/yyyy HH:mm"
            locale="en-GB"
            className={className || 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]'}
        />
    );
}
