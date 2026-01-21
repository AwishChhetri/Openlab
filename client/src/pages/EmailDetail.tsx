import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, ChevronDown, Archive } from 'lucide-react';

interface Email {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduled_at: string;
    sent_at: string;
}

export const EmailDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/campaigns/emails/${id}`, { withCredentials: true });
                setEmail(res.data);
            } catch (err) {
                console.error('Error fetching email details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmail();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!email) return <div className="h-screen flex items-center justify-center">Email not found</div>;

    const formattedDate = new Date(email.sent_at || email.scheduled_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    }) + `, ${new Date(email.sent_at || email.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-6 overflow-hidden">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors flex-shrink-0">
                        <ArrowLeft size={22} className="text-slate-900 stroke-[2.5]" />
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h1 className="text-[17px] font-bold text-slate-900 truncate">{email.subject}</h1>
                        <span className="text-slate-200 font-medium">|</span>
                        <span className="text-[14px] font-bold text-slate-300 tracking-wider uppercase"></span>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6 text-slate-300">
                        <Star size={20} className="hover:text-yellow-400 cursor-pointer transition-colors" />
                        <Archive size={20} className="hover:text-slate-600 cursor-pointer transition-colors" />
                        <Trash2 size={20} className="hover:text-rose-500 cursor-pointer transition-colors" />
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100 mx-2" />
                    <img
                        src="https://ui-avatars.com/api/?name=Admin&background=00A854&color=fff"
                        alt="User"
                        className="w-8 h-8 rounded-full border border-slate-100"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-white px-14 py-12">
                <div className="flex items-start justify-between mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-[#00A854] rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#00A854]/20">
                            {email.recipient[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-[15px]">{email.recipient.split('@')[0]}</h3>
                                <span className="text-slate-300 text-[13px] font-medium">{"<"}{email.recipient}{">"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-[12px] text-slate-400 font-black uppercase tracking-tight">from me</p>
                                <ChevronDown size={14} className="text-slate-300" />
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[13px] font-bold text-slate-400">
                            {formattedDate}
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <div className="text-slate-900 text-[16px] leading-relaxed whitespace-pre-wrap mb-10 font-medium">
                        {email.body}
                    </div>
                </div>
            </div>
        </div>
    );
};
