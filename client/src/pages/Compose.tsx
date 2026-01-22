import { useRef, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Paperclip, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecipientSelector } from '../components/compose/RecipientSelector';
import { SchedulePicker } from '../components/compose/SchedulePicker';
import { RichTextEditor } from '../components/compose/RichTextEditor';
import { stripHtml } from '../utils/text';

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
    const [isEditorEmpty, setIsEditorEmpty] = useState(true);
    const [recipientInput, setRecipientInput] = useState('');
    const [pills, setPills] = useState<string[]>([]);
    const [showTimer, setShowTimer] = useState(false);
    const [isSendLater, setIsSendLater] = useState(false);

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

    // Sync editor DOM with formData.body for initial load or programatic resets
    useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== formData.body) {
            editorRef.current.innerHTML = formData.body || '';
        }
        setIsEditorEmpty(stripHtml(formData.body).length === 0);
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

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header (Merged Back - Minor component) */}
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
                        {pills.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                                {pills.length}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Clock
                            size={20}
                            className={`cursor-pointer hover:text-slate-600 ${isSendLater ? 'text-[#00A854]' : 'text-slate-400'}`}
                            onClick={() => setShowTimer(!showTimer)}
                        />
                        {showTimer && (
                            <SchedulePicker
                                startTime={formData.startTime}
                                setStartTime={(time) => {
                                    setFormData({ ...formData, startTime: time });
                                    setIsSendLater(true);
                                }}
                                onCancel={() => { setIsSendLater(false); setShowTimer(false); }}
                                onDone={() => setShowTimer(false)}
                            />
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

            <div className="px-10 py-8 space-y-8 max-w-5xl">
                {/* From Field */}
                <div className="flex items-center gap-6">
                    <span className="w-24 text-[13px] font-black uppercase tracking-wider text-slate-300">From</span>
                    <div className="flex-1">
                        <div className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-5 text-[13px] font-bold text-slate-400">
                            {senders.length > 0 ? senders[0].email : 'Loading sender...'}
                        </div>
                    </div>
                </div>

                <RecipientSelector
                    pills={pills}
                    setPills={setPills}
                    recipientInput={recipientInput}
                    setRecipientInput={setRecipientInput}
                />

                {/* Subject Field */}
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

                {/* Delay and Limit Fields */}
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

                <RichTextEditor
                    editorRef={editorRef}
                    body={formData.body}
                    setBody={(html) => setFormData({ ...formData, body: html })}
                    isEditorEmpty={isEditorEmpty}
                    setIsEditorEmpty={setIsEditorEmpty}
                />
            </div>
        </div>
    );
};
