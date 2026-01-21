import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, Send, ChevronDown } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, count, active }: any) => (
    <Link
        to={to}
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${active
            ? 'bg-[#E9F7F0] text-[#00A854] font-black'
            : 'text-slate-500 hover:bg-slate-50 font-bold'
            }`}
    >
        <div className="flex items-center gap-4">
            <Icon size={18} className={active ? 'text-[#00A854]' : 'text-slate-400'} />
            <span className="text-[13px]">{label}</span>
        </div>
        {count !== undefined && (
            <span className={`text-[11px] font-bold ${active ? 'text-[#00A854]' : 'text-slate-300'}`}>{count}</span>
        )}
    </Link>
);

export const Shell = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [stats, setStats] = useState({ sent: 0, scheduled: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/campaigns/stats/summary', { withCredentials: true });
                setStats({
                    sent: parseInt(res.data.sent || '0'),
                    scheduled: parseInt(res.data.scheduled || '0')
                });
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex bg-white">
            {/* Sidebar */}
            <aside className="w-[280px] border-r border-slate-100 flex flex-col fixed h-full bg-white z-10">
                <div className="p-8">
                    <div className="text-[32px] font-black text-black mb-10 tracking-tighter">
                        OpenLab
                    </div>
                    {/* User Profile */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-2xl mb-8 group cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user?.name}
                                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                                    onError={(e) => {
                                        // Hide image and show initials fallback on error
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00A854] to-[#008F47] flex items-center justify-center text-white font-black text-sm shadow-sm"
                                style={{ display: user?.avatar_url ? 'none' : 'flex' }}
                            >
                                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[12px] font-black text-slate-900 truncate leading-tight">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                            </div>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>

                    <Link
                        to="/compose"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-[#00A854] text-[#00A854] text-[13px] font-black hover:bg-[#E9F7F0] transition-all mb-10 active:scale-95"
                    >
                        Compose
                    </Link>

                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black uppercase tracking-[2px] text-slate-300 mb-4">Core</p>
                        <nav className="space-y-1">
                            <NavItem
                                to="/dashboard"
                                icon={Clock}
                                label="Scheduled"
                                count={stats.scheduled}
                                active={location.pathname === '/dashboard'}
                            />
                            <NavItem
                                to="/senders"
                                icon={Send}
                                label="Sent"
                                count={stats.sent}
                                active={location.pathname === '/senders'}
                            />
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-[280px]">
                <Outlet />
            </main>
        </div>
    );
};
