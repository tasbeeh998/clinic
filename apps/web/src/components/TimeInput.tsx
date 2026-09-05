import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

interface TimeInputProps {
    value: string; // 'HH:mm'
    onChange: (value: string) => void;
    className?: string;
}

function toDate(value: string): Date | null {
    if (!value) return null;
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

function toTimeString(date: Date | null): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TimeInput({ value, onChange, className }: TimeInputProps) {
    return (
        <DatePicker
            selected={toDate(value)}
            onChange={(date) => onChange(toTimeString(date))}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="HH:mm"
            locale="en-GB"
            className={className || 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]'}
        />
    );
}
