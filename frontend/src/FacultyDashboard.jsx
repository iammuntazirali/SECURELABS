import React, { useState, useEffect } from 'react';
import { Users, Award, LogOut, Activity, RefreshCw, Database, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const { user, token, logout } = useAuth();

    const [groups, setGroups] = useState([]);
    const [vulns, setVulns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seedMsg, setSeedMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupRes, vulnRes] = await Promise.all([
                fetch('http://localhost:5000/api/groups', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/vulnerabilities', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const groupData = await groupRes.json();
            const vulnData = await vulnRes.json();
            if (groupData.success) setGroups(groupData.groups);
            if (vulnData.success) setVulns(vulnData.vulnerabilities);
        } catch (err) { /* silent */ }
        finally { setLoading(false); }
    };

    const seedGroups = async () => {
        setSeedMsg('');
        try {
            const res = await fetch('http://localhost:5000/api/groups/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSeedMsg(data.message);
            fetchData();
        } catch { setSeedMsg('Failed to seed'); }
    };

    const totalGroups = groups.length;
    const gradedGroups = groups.filter(g => g.score !== null && g.score !== undefined).length;
    const activeGroups = groups.filter(g => g.status === 'Active').length;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <div className="text-2xl font-black text-blue-500 mb-10 italic">
                        SECURE<span className="text-white">LAB.</span>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/10 shadow-lg">
                            <Users size={20} />
                            <span className="font-bold text-sm text-left">Overview</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer">
                            <ShieldAlert size={20} />
                            <span className="font-medium text-sm">Vulnerabilities</span>
                        </div>
                    </nav>
                </div>

                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
                >
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Faculty Oversight Panel</h1>
                        <p className="text-slate-500 mt-1 font-medium">Welcome, {user?.name || 'Faculty'} — Monitoring Lab Assessments</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700">
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <button onClick={seedGroups} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-blue-500/30">
                            <Database size={14} /> Seed Groups
                        </button>
                    </div>
                </header>

                {seedMsg && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm text-center">
                        {seedMsg}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Groups" value={totalGroups} color="blue" />
                    <StatCard label="Active" value={activeGroups} color="emerald" />
                    <StatCard label="Graded" value={gradedGroups} color="purple" />
                    <StatCard label="Vuln Reports" value={vulns.length} color="yellow" />
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading data...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Groups Table */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                    <Users size={20} className="text-blue-400" /> All Student Groups
                                </h2>
                            </div>

                            <table className="w-full text-left">
                                <thead className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                    <tr>
                                        <th className="px-8 py-4">Group</th>
                                        <th className="px-8 py-4">Target</th>
                                        <th className="px-8 py-4">Members</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-center">Score</th>
                                        <th className="px-8 py-4">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {groups.length === 0 ? (
                                        <tr><td colSpan="6" className="px-8 py-10 text-center text-slate-500 italic">No groups yet. Click "Seed Groups" to create default groups.</td></tr>
                                    ) : groups.map((group) => (
                                        <tr key={group._id} className="hover:bg-slate-800/20 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-blue-400 tracking-tight">{group.groupId}</div>
                                                <div className="text-xs text-slate-500 font-medium">{group.lead} (Lead)</div>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-xs text-slate-400">{group.target || '—'}</td>
                                            <td className="px-8 py-5 text-xs text-slate-400">{group.members?.join(', ') || '—'}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${group.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {group.score !== null && group.score !== undefined ? (
                                                    <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                                                        <Award size={16} className="text-blue-400" />
                                                        <span className="text-lg font-black text-white">{group.score}</span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">pts</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 italic text-sm">Not Graded</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-xs text-slate-400 max-w-[200px] truncate">{group.feedback || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Vulnerability Reports */}
                        {vulns.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                    <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                        <ShieldAlert size={20} className="text-yellow-400" /> Vulnerability Reports ({vulns.length})
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
                                    {vulns.map((v) => (
                                        <div key={v._id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white text-sm">{v.attackType}</div>
                                                <div className="text-xs text-slate-400 mt-1">{v.description?.substring(0, 80)}{v.description?.length > 80 ? '...' : ''}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">By: {v.user?.name || 'Unknown'} — {new Date(v.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        v.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                            v.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>{v.severity}</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        v.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>{v.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-600/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-600/10 border-purple-500/20',
        yellow: 'text-yellow-400 bg-yellow-600/10 border-yellow-500/20'
    };
    return (
        <div className={`border rounded-2xl p-5 ${colors[color]}`}>
            <div className="text-3xl font-black">{value}</div>
            <div className="text-xs font-bold uppercase tracking-widest mt-1 opacity-60">{label}</div>
        </div>
    );
};

export default FacultyDashboard;