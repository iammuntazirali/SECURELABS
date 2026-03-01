import React from 'react';
import { Shield, GraduationCap, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const RoleCard = ({ icon, title, description, borderColor, glowColor }) => (
  <div className={`group relative p-8 rounded-3xl border ${borderColor} bg-slate-900/40 backdrop-blur-md transition-all duration-300 ${glowColor}`}>
    <div className="mb-6">{icon}</div>
    <h4 className="text-2xl font-bold mb-4">{title}</h4>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center p-8 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tight">
          <span className="text-blue-500 uppercase">Secure</span>
          <span className="text-white uppercase ml-2">Lab</span>
        </div>
        {/* <Link 
          to="/login" 
          className="px-6 py-2 border border-blue-500/50 text-blue-400 rounded-md hover:bg-blue-500/10 transition-all font-medium"
        >
          Login
        </Link> */}
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          <span className="text-blue-400">Security</span> Assessment <br /> 
          Management System
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mb-10">
          A centralized platform for student groups to conduct controlled security audits, 
          track vulnerabilities, and manage lab projects.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex gap-4 mb-20">
          <Link 
            to="/login" 
            className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-md font-semibold transition-all shadow-lg shadow-blue-900/20"
          >
            Get Started
          </Link>
          <button className="bg-slate-800/50 border border-slate-700 px-8 py-3 rounded-md font-semibold transition-all hover:bg-slate-800">
            Learn More
          </button>
        </div>

        {/* Role Overview Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <RoleCard 
            icon={<Shield className="text-blue-400" size={32} />} 
            title="For Students" 
            description="Perform scans, log findings, and submit audit reports." 
            borderColor="border-blue-500/40" 
            glowColor="group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
          />
          <RoleCard 
            icon={<GraduationCap className="text-emerald-400" size={32} />} 
            title="For Faculty" 
            description="Design projects and evaluate security assessments." 
            borderColor="border-emerald-500/40" 
            glowColor="group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
          />
          <RoleCard 
            icon={<Zap className="text-blue-400" size={32} />} 
            title="For TAs" 
            description="Monitor progress and validate milestones." 
            borderColor="border-blue-500/40" 
            glowColor="group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
          />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;