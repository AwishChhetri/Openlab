import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Filter, RotateCcw, Star, Paperclip, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Email {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduled_at: string;
    sent_at: string;
    sender_name?: string;
}

const stripHtml = (html: string) =>
    (html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
const truncate = (text: string, len = 120) =>
    text.length > len ? text.slice(0, len) + '…' : text;

export const Dashboard = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const location = useLocation();
    const isSentView = location.pathname === '/senders';
    const isScheduledView = location.pathname === '/dashboard';

    useEffect(() => {
        const fetchEmails = async () => {
            setLoading(true);
            try {
                // Fetch all campaigns
                const campaignsRes = await api.get('/api/campaigns');

                if (campaignsRes.data.length > 0) {
                    // Fetch emails from all campaigns and aggregate them
                    const emailPromises = campaignsRes.data.map((campaign: any) =>
                        api.get(`/api/campaigns/${campaign.id}/emails`)
                    );

                    const emailResponses = await Promise.all(emailPromises);

                    // Flatten all emails into a single array
                    let allEmails = emailResponses.flatMap(res => res.data);

                    // Filter based on current view
                    if (isSentView) {
                        // Show only SENT emails
                        allEmails = allEmails.filter(email => email.status === 'SENT');
                    } else if (isScheduledView) {
                        // Show only SCHEDULED and PENDING emails
                        allEmails = allEmails.filter(email =>
                            email.status === 'SCHEDULED' || email.status === 'PENDING'
                        );
                    }

                    // Sort by sent_at or scheduled_at (most recent first)
                    allEmails.sort((a, b) => {
                        const dateA = new Date(a.sent_at || a.scheduled_at || a.created_at);
                        const dateB = new Date(b.sent_at || b.scheduled_at || b.created_at);
                        return dateB.getTime() - dateA.getTime();
                    });

                    setEmails(allEmails);
                } else {
                    setEmails([]);
                }
            } catch (err) {
                console.error(err);
                setEmails([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [location.pathname, isSentView, isScheduledView]);

    return (
        <div className="flex flex-col h-screen relative">

            {/* Search Header */}
            <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-11 pr-6 text-[13px] focus:outline-none focus:ring-0 transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="flex items-center gap-7 ml-6 text-slate-300">
                    <button className="hover:text-[#00A854] transition-colors"><Filter size={18} /></button>
                    <button className="hover:text-[#00A854] transition-colors"><RotateCcw size={18} /></button>
                </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium italic">
                        Gathering your messages...
                    </div>
                ) : emails.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium italic">
                        No messages found in this folder.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {emails.map((email: Email) => (
                            <div
                                key={email.id}
                                onClick={() => navigate(`/emails/${email.id}`)}
                                className="px-10 py-5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer group transition-all border-b border-slate-50 last:border-0"
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="w-[180px] flex-shrink-0">
                                        <p className="font-extrabold text-slate-900 text-[13px] truncate">
                                            To: {email.recipient.split('@')[0]}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {email.status === 'SCHEDULED' && (
                                            <div className="flex-shrink-0 bg-[#FFF2E2] text-[#FF9C28] px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border border-[#FFE7C8]">
                                                <Clock size={12} className="stroke-[3]" />
                                                {new Date(email.scheduled_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    weekday: 'short',
                                                })}
                                            </div>
                                        )}

                                        {email.status === 'SENT' && (
                                            <div className="flex-shrink-0 bg-[#F5F5F7] text-slate-400 px-3 py-1 rounded-full text-[11px] font-black border border-slate-100 uppercase">
                                                Sent
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-extrabold text-[#1a1a1a] text-[13px] shrink-0">
                                                {email.subject}
                                            </span>
                                            <span className="text-slate-400 text-[13px] truncate">
                                                {' - '}
                                                {truncate(stripHtml(email.body))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Star size={18} className="text-slate-300 hover:text-yellow-400" />
                                    <Paperclip size={18} className="text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};
