import React from 'react';
import { Send } from 'lucide-react';

interface RecipientSelectorProps {
    pills: string[];
    setPills: (pills: string[]) => void;
    recipientInput: string;
    setRecipientInput: (val: string) => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
    pills,
    setPills,
    recipientInput,
    setRecipientInput
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                setPills(Array.from(new Set([...pills, ...emails])));
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleRecipientKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const email = recipientInput.trim().replace(',', '');
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (!pills.includes(email)) setPills([...pills, email]);
                setRecipientInput('');
            }
        }
    };

    const removePill = (email: string) => {
        setPills(pills.filter(p => p !== email));
    };

    return (
        <div className="flex items-start gap-6">
            <span className="w-24 mt-2.5 text-[13px] font-black uppercase tracking-wider text-slate-300 shrink-0">To</span>
            <div className="flex-1 flex flex-wrap items-center gap-2 border-b border-slate-100 min-h-[44px] py-1">
                {pills.slice(0, 3).map(pill => (
                    <div key={pill} className="flex items-center gap-1.5 bg-[#E9F7F0] text-[#00A854] px-3 py-1 rounded-full text-[13px] font-bold border border-[#DCF2E7]">
                        {pill}
                        <button onClick={() => removePill(pill)} className="hover:text-rose-500 transition-colors">×</button>
                    </div>
                ))}
                {pills.length > 3 && (
                    <div className="bg-[#E9F7F0] text-[#00A854] px-2 py-1 rounded-full text-[13px] font-bold border border-[#DCF2E7]">
                        +{pills.length - 3}
                    </div>
                )}
                <input
                    type="text"
                    placeholder={pills.length === 0 ? "recipient@example.com" : ""}
                    className="flex-1 min-w-[200px] bg-white text-[13px] text-slate-900 focus:outline-none py-2"
                    value={recipientInput}
                    onChange={e => setRecipientInput(e.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                />
                <div className="flex items-center gap-2 text-[#00A854] text-[13px] font-bold cursor-pointer hover:text-[#008F47] transition-colors ml-auto group relative">
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        accept=".csv"
                    />
                    <Send size={16} className="rotate-[-45deg] stroke-[3]" />
                    <span>Upload List</span>
                </div>
            </div>
        </div>
    );
};
