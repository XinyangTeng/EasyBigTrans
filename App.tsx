import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Code, LayoutDashboard, BookOpen, Menu, Terminal, Github } from 'lucide-react';
import { DEFAULT_CONFIG } from './constants';
import { PipelineConfig } from './types';
import ScriptEditor from './components/ScriptEditor';
import Dashboard from './components/Dashboard';
import ChatAssistant from './components/ChatAssistant';

const AppContent: React.FC = () => {
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname === '');
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
             <Terminal size={24} />
             <span className="font-bold text-lg tracking-tight text-white">EasyBigtrans</span>
          </div>
          <p className="text-xs text-slate-500">简易宏转录组流程管理器</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="仪表盘 (演示)" />
          <NavItem to="/scripts" icon={Code} label="脚本生成器" />
          <NavItem to="/guide" icon={BookOpen} label="流程指南" />
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 text-xs text-slate-500">
               <span>v1.0.0 (Web版)</span>
             </div>
             <a href="#" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
               <Github size={12} />
               <span>GitHub 仓库</span>
             </a>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 md:hidden">
             <Menu className="text-slate-600" />
             <span className="font-bold text-slate-800">EasyBigtrans</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 hidden md:block">
            {location.pathname === '/scripts' ? '批量脚本生成' : 
             location.pathname === '/guide' ? '流程参考手册' : '流程概览'}
          </h1>
          <div className="flex items-center gap-3">
             <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium border border-blue-200">
               Web 在线生成器
             </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard config={config} />} />
            <Route path="/scripts" element={<ScriptEditor config={config} setConfig={setConfig} />} />
            <Route path="/guide" element={<ChatAssistant config={config} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;