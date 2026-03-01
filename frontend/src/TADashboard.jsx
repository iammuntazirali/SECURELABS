import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Clock, Search, LayoutDashboard, Database, LogOut, Award, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TADashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  // State for Grading Modal
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups from DB on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setGroups(data.groups);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const marks = e.target.marks.value;
    const feedback = e.target.feedback?.value || '';

    try {
      const res = await fetch(`http://localhost:5000/api/groups/${selectedGroup._id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: parseInt(marks), feedback })
      });
      const data = await res.json();
      if (data.success) {
        setGroups(groups.map(g => g._id === selectedGroup._id ? { ...g, score: marks, feedback } : g));
        alert(`Grade saved for ${selectedGroup.groupId}: ${marks}/100`);
      }
    } catch (err) { alert('Failed to save grade'); }
    setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans relative">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-black tracking-tighter text-blue-500 mb-10 italic">SECURE<span className="text-white">LAB.</span></div>
          <nav className="flex flex-col gap-2">
            <NavItem icon={<LayoutDashboard size={20} />} label="TA Overview" active />
            <NavItem icon={<Users size={20} />} label="Manage Groups" />
            {/* <NavItem icon={<Database size={20}/>} label="Lab Inventory" /> */}
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
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">TA Monitoring Panel</h1>
            <p className="text-slate-500 mt-1 font-medium">Lab Session #04 | Network Security Assessment</p>
          </div>
          <div className="flex gap-4">
            <StatBox icon={<Users className="text-blue-400" />} label="Total Groups" value="12" />
            {/* <StatBox icon={<ShieldAlert className="text-red-400"/>} label="Critical Alerts" value="05" /> */}
          </div>
        </header>

        {/* Live Monitoring Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-emerald-400" /> Live Group Activity
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="text" placeholder="Filter Group ID..." className="bg-slate-800 border border-slate-700 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Group</th>
                <th className="px-6 py-4 font-semibold">Target IP</th>
                <th className="px-6 py-4 font-semibold">Bugs Found</th>
                <th className="px-6 py-4 font-semibold">Grade</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {groups.length === 0 && !loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">No groups found. Faculty can seed groups from the API.</td></tr>
              ) : groups.map((group) => (
                <tr key={group._id || group.groupId} className="hover:bg-slate-800/30 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="font-bold text-blue-400">{group.groupId}</div>
                    <div className="text-xs text-slate-500">{group.lead}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{group.target}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${group.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{group.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {group.score ? (
                      <span className="text-emerald-400 font-bold font-mono text-lg">{group.score}/100</span>
                    ) : (
                      <span className="text-slate-600 italic">Not Graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
                    >
                      <Award size={14} /> Review & Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- GRADING MODAL --- */}
        {selectedGroup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedGroup(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Grading Session</h2>
                <p className="text-slate-400 text-sm">Reviewing: {selectedGroup.groupId} ({selectedGroup.lead})</p>
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Marks (0-100)</label>
                  <input
                    name="marks"
                    required
                    type="number"
                    max="100"
                    min="0"
                    placeholder="Enter score"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Feedback (optional)</label>
                  <textarea
                    name="feedback"
                    placeholder="Write feedback for the group..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg' : 'hover:bg-slate-800 text-slate-500'}`}>
    {icon}
    <span className="font-bold text-sm tracking-wide">{label}</span>
  </div>
);

const StatBox = ({ icon, label, value }) => (
  <div className="bg-slate-900/60 border border-slate-800 px-6 py-4 rounded-3xl flex items-center gap-5 backdrop-blur-sm">
    <div className="bg-slate-800 p-3 rounded-2xl">{icon}</div>
    <div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">{label}</p>
    </div>
  </div>
);

export default TADashboard;