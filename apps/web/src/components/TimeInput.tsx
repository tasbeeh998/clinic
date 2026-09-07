interface TimeInputProps { value: string; onChange: (value: string) => void; className?: string; }
export default function TimeInput({ value, onChange, className }: TimeInputProps) {
  return <input type="time" step="900" value={value} onChange={(event) => onChange(event.target.value)} className={className || 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]'} />;
}
