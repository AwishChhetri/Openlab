import { useRef, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Paperclip, Clock, List, Italic, Bold, Underline, AlignLeft, ListOrdered, Quote, Code, RotateCcw, Send, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Compose = () => {
    const navigate = useNavigate();
    const [senders, setSenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [formData, setFormData] = useState({
        senderId: '',
        name: 'New Campaign',
        subject: '',
        body: '',
        startTime: new Date().toISOString(),
        delayBetweenMs: '00',
        hourlyLimit: '00'
    });
    const [editorFontSize, setEditorFontSize] = useState<'sm' | 'md' | 'lg'>('lg');
    const [editorAlign, setEditorAlign] = useState<'left' | 'center' | 'right'>('left');
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [isEditorEmpty, setIsEditorEmpty] = useState(true);
    const [recipientInput, setRecipientInput] = useState('');
    const [pills, setPills] = useState<string[]>([]);
    const [showTimer, setShowTimer] = useState(false);
    const [isSendLater, setIsSendLater] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                setPills(prev => Array.from(new Set([...prev, ...emails])));
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
        setFormData({ ...formData, startTime: target.toISOString() });
        setIsSendLater(true);
    };

    useEffect(() => {
        const fetchSenders = async () => {
            try {
                const res = await api.get('/api/senders');
                setSenders(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, senderId: res.data[0].id }));
                }
            } catch (err) {
                console.error('Error fetching sender:', err);
            }
        };
        fetchSenders();
    }, []);

    // Keep editor DOM in sync when body changes programmatically (e.g. initial load/reset)
    useEffect(() => {
        if (!editorRef.current) return;
        const current = editorRef.current.innerHTML;
        if (current !== formData.body) {
            editorRef.current.innerHTML = formData.body || '';
        }
        const text = (editorRef.current.textContent || '').replace(/\u00A0/g, ' ').trim();
        setIsEditorEmpty(text.length === 0);
    }, [formData.body]);

    const handleSubmit = async () => {
        if (pills.length === 0) {
            toast.warn('Please add at least one recipient');
            return;
        }
        setLoading(true);
        const submitData = {
            ...formData,
            recipients: pills,
            startTime: isSendLater ? formData.startTime : new Date().toISOString()
        };

        try {
            await api.post('/api/campaigns/schedule', submitData);
            toast.success('Mail scheduled');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to schedule');
        } finally {
            setLoading(false);
        }
    };

    const focusEditor = () => {
        editorRef.current?.focus();
    };

    const preventBlur = (e: React.MouseEvent) => {
        // Keep selection alive; otherwise execCommand may not apply where the cursor/selection was.
        e.preventDefault();
    };

    const exec = (command: string, value?: string) => {
        focusEditor();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand(command, false, value);
        const html = editorRef.current?.innerHTML ?? '';
        setFormData(prev => ({ ...prev, body: html }));
    };

    const handleEditorInput = () => {
        const html = editorRef.current?.innerHTML ?? '';
        setFormData(prev => ({ ...prev, body: html }));
        const text = (editorRef.current?.textContent || '').replace(/\u00A0/g, ' ').trim();
        setIsEditorEmpty(text.length === 0);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Compose Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="hover:bg-slate-50 p-2 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-900" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Compose New Email</h1>
                </div>
                <div className="flex items-center gap-6 relative">
                    <div className="flex items-center gap-2">
                        <Paperclip size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                        {pills.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">{pills.length}</span>}
                    </div>
                    <div className="relative">
                        <Clock
                            size={20}
                            className={`cursor-pointer hover:text-slate-600 ${isSendLater ? 'text-[#00A854]' : 'text-slate-400'}`}
                            onClick={() => setShowTimer(!showTimer)}
                        />
                        {showTimer && (
                            <div className="absolute right-0 top-12 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h3 className="font-black text-slate-900 mb-6 text-[15px]">Send Later</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-white border-b border-slate-100 py-3 text-[13px] text-slate-900 focus:outline-none appearance-none cursor-pointer"
                                            value={new Date(new Date(formData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                            onChange={(e) => {
                                                const localDate = new Date(e.target.value);
                                                setFormData({ ...formData, startTime: localDate.toISOString() });
                                                setIsSendLater(true);
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
                                        <button onClick={() => { setIsSendLater(false); setShowTimer(false); }} className="text-[13px] font-black text-slate-900">Cancel</button>
                                        <button onClick={() => setShowTimer(false)} className="px-6 py-2 rounded-full border border-[#00A854] text-[#00A854] text-[13px] font-black hover:bg-[#E9F7F0]">Done</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center justify-center px-8 py-2.5 rounded-full border border-[#00A854] text-[#00A854] font-black hover:bg-[#E9F7F0] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : (isSendLater ? 'Send Later' : 'Send')}
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="px-10 py-8 space-y-8 max-w-5xl">
                <div className="flex items-center gap-6">
                    <span className="w-24 text-[13px] font-black uppercase tracking-wider text-slate-300">From</span>
                    <div className="flex-1">
                        <div className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-5 text-[13px] font-bold text-slate-400">
                            {senders.length > 0 ? senders[0].email : 'Loading sender...'}
                        </div>
                    </div>
                </div>

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

                <div className="flex items-center gap-6">
                    <span className="w-24 text-[13px] font-black uppercase tracking-wider text-slate-300">Subject</span>
                    <input
                        type="text"
                        placeholder="Subject"
                        className="flex-1 border-b border-slate-100 py-3 px-1 text-[13px] text-slate-900 focus:outline-none focus:border-[#00A854] transition-all"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-6 py-2">
                    <div className="flex items-center gap-4 flex-1">
                        <span className="text-[13px] font-bold text-slate-900">Delay between 2 emails</span>
                        <input
                            type="text"
                            placeholder="00"
                            className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:border-[#00A854] text-[13px]"
                            value={formData.delayBetweenMs}
                            onChange={e => setFormData({ ...formData, delayBetweenMs: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                        <span className="text-[13px] font-bold text-slate-900">Hourly Limit</span>
                        <input
                            type="text"
                            placeholder="00"
                            className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:border-[#00A854] text-[13px]"
                            value={formData.hourlyLimit}
                            onChange={e => setFormData({ ...formData, hourlyLimit: e.target.value })}
                        />
                    </div>
                </div>

                {/* Editor Area */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-6 text-slate-300 overflow-x-auto overflow-y-visible pb-2 no-scrollbar relative">
                        <RotateCcw
                            size={18}
                            className="cursor-pointer hover:text-slate-600"
                            onMouseDown={preventBlur}
                            onClick={() => exec('undo')}
                        />
                        <RotateCcw
                            size={18}
                            className="cursor-pointer hover:text-slate-600 rotate-180"
                            onMouseDown={preventBlur}
                            onClick={() => exec('redo')}
                        />
                        <div className="h-4 w-[1px] bg-slate-100" />
                        <div
                            className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 relative"
                            onMouseDown={preventBlur}
                            onClick={() => { setShowFontMenu(v => !v); setShowAlignMenu(false); }}
                        >
                            <span className="text-[13px] font-bold">T</span><span className="text-[10px] font-bold">T</span>
                            <ChevronDown size={12} />
                            {showFontMenu && (
                                <div className="absolute left-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 min-w-[160px]">
                                    {[
                                        { label: 'Small', value: 'sm' as const },
                                        { label: 'Normal', value: 'md' as const },
                                        { label: 'Large', value: 'lg' as const },
                                    ].map(item => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onMouseDown={preventBlur}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditorFontSize(item.value);
                                                exec('fontSize', item.value === 'sm' ? '2' : item.value === 'md' ? '3' : '5');
                                                setShowFontMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold ${editorFontSize === item.value ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="h-4 w-[1px] bg-slate-100" />
                        <Bold size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('bold')} />
                        <Italic size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('italic')} />
                        <Underline size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('underline')} />
                        <div className="h-4 w-[1px] bg-slate-100" />
                        <AlignLeft
                            size={18}
                            className="cursor-pointer hover:text-slate-600"
                            onMouseDown={preventBlur}
                            onClick={() => { setEditorAlign('left'); exec('justifyLeft'); }}
                        />
                        <div
                            className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 relative"
                            onMouseDown={preventBlur}
                            onClick={() => { setShowAlignMenu(v => !v); setShowFontMenu(false); }}
                        >
                            <AlignLeft size={18} className="scale-y-[-1]" />
                            <ChevronDown size={12} />
                            {showAlignMenu && (
                                <div className="absolute left-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 min-w-[160px]">
                                    {[
                                        { label: 'Left', value: 'left' as const },
                                        { label: 'Center', value: 'center' as const },
                                        { label: 'Right', value: 'right' as const },
                                    ].map(item => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onMouseDown={preventBlur}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditorAlign(item.value);
                                                exec(item.value === 'left' ? 'justifyLeft' : item.value === 'center' ? 'justifyCenter' : 'justifyRight');
                                                setShowAlignMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold ${editorAlign === item.value ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="h-4 w-[1px] bg-slate-100" />
                        <List size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('insertUnorderedList')} />
                        <ListOrdered size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('insertOrderedList')} />
                        <div className="h-4 w-[1px] bg-slate-100" />
                        <Quote size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('formatBlock', '<blockquote>')} />
                        <Code size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('formatBlock', '<pre>')} />
                    </div>
                    <div className="relative">
                        {isEditorEmpty && (
                            <div className="pointer-events-none absolute top-4 left-4 text-slate-400 text-lg">
                                Type Your Reply...
                            </div>
                        )}
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            onMouseDown={() => { setShowAlignMenu(false); setShowFontMenu(false); }}
                            className={`w-full min-h-[400px] text-slate-900 leading-relaxed focus:outline-none font-sans whitespace-pre-wrap px-4 py-4 ${editorFontSize === 'sm' ? 'text-sm' : editorFontSize === 'md' ? 'text-base' : 'text-lg'}`}
                            style={{ textAlign: editorAlign }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
