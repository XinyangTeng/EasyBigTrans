import React, { useEffect, useState } from 'react';
import { Book, FileText } from 'lucide-react';
import { PipelineConfig } from '../types';
import { GUIDE_CONTENT } from '../constants';

interface ChatAssistantProps {
    config: PipelineConfig;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ config }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        // Hydrate guide content with current config
        const hydrated = GUIDE_CONTENT
            .replace(/{{PROJECT_BASE}}/g, config.projectBase)
            .replace(/{{THREADS}}/g, config.threads.toString());
        setContent(hydrated);
    }, [config]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="bg-slate-800 p-4 text-white flex items-center gap-3">
                <Book size={24} className="text-blue-400" />
                <div>
                    <h2 className="font-semibold">流程指南</h2>
                    <p className="text-xs text-slate-400">实施方案参考手册</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="prose prose-slate max-w-none">
                     {/* Simple Markdown-like rendering */}
                     {content.split('\n').map((line, idx) => {
                         if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-bold text-slate-800 mt-6 mb-4">{line.replace('# ', '')}</h1>;
                         if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-slate-700 mt-5 mb-3">{line.replace('## ', '')}</h2>;
                         if (line.startsWith('```')) return null; // Skip code fence markers
                         
                         return <p key={idx} className="text-slate-600 mb-2 whitespace-pre-wrap">{line}</p>;
                     })}
                     
                     <div className="mt-8 bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">原始内容引用</h3>
                        <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                            {content}
                        </pre>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;