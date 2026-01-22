import React from 'react';
import { List } from 'lucide-react';

interface SchedulePickerProps {
    startTime: string;
    setStartTime: (time: string) => void;
    onCancel: () => void;
    onDone: () => void;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
    startTime,
    setStartTime,
    onCancel,
    onDone
}) => {
    const setScheduleTime = (label: string) => {
        const now = new Date();
        const target = new Date();
        if (label === 'Tomorrow') {
            target.setDate(now.getDate() + 1);
            target.setHours(9, 0, 0, 0);
        } else if (label === 'Tomorrow 10AM') {
            target.setDate(now.getDate() + 1);
            target.setHours(10, 0, 0, 0);
        } else if (label === 'Tomorrow 11AM') {
            target.setDate(now.getDate() + 1);
            target.setHours(11, 0, 0, 0);
        } else if (label === 'Tomorrow 3PM') {
            target.setDate(now.getDate() + 1);
            target.setHours(15, 0, 0, 0);
        }
        setStartTime(target.toISOString());
    };

    return (
        <div className="absolute right-0 top-12 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="font-black text-slate-900 mb-6 text-[15px]">Send Later</h3>
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="datetime-local"
                        className="w-full bg-white border-b border-slate-100 py-3 text-[13px] text-slate-900 focus:outline-none appearance-none cursor-pointer"
                        value={new Date(new Date(startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        onChange={(e) => {
                            const localDate = new Date(e.target.value);
                            setStartTime(localDate.toISOString());
                        }}
                    />
                    <List size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
                <div className="space-y-4 pt-2">
                    {[
                        { label: 'Tomorrow', value: 'Tomorrow' },
                        { label: 'Tomorrow, 10:00 AM', value: 'Tomorrow 10AM' },
                        { label: 'Tomorrow, 11:00 AM', value: 'Tomorrow 11AM' },
                        { label: 'Tomorrow, 3:00 PM', value: 'Tomorrow 3PM' }
                    ].map(item => (
                        <div
                            key={item.label}
                            className="text-[13px] font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors"
                            onClick={() => setScheduleTime(item.value)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-6 pt-8 border-t border-slate-50 mt-4">
                    <button onClick={onCancel} className="text-[13px] font-black text-slate-900">Cancel</button>
                    <button onClick={onDone} className="px-6 py-2 rounded-full border border-[#00A854] text-[#00A854] text-[13px] font-black hover:bg-[#E9F7F0]">Done</button>
                </div>
            </div>
        </div>
    );
};
