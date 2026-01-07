import React, { useState, useEffect } from 'react';
import { PipelineConfig, ScriptType } from '../types';
import { SCRIPTS } from '../constants';
import { Download, Copy, Check, RefreshCw, FileText } from 'lucide-react';
import { generateReadme } from '../services/gemini.ts';

interface ScriptEditorProps {
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ config, setConfig }) => {
  const [activeScript, setActiveScript] = useState<ScriptType>(ScriptType.MAIN);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');

  // Hydrate template
  useEffect(() => {
    let template = '';
    switch (activeScript) {
      case ScriptType.MAIN: template = SCRIPTS.main; break;
      case ScriptType.UNZIP: template = SCRIPTS.unzip; break;
      case ScriptType.INDEX: template = SCRIPTS.index; break;
      case ScriptType.ALIGN: template = SCRIPTS.align; break;
      case ScriptType.DOWNLOAD: template = SCRIPTS.download; break;
      case ScriptType.NO_KEGG: template = SCRIPTS.no_kegg; break;
      default: template = '# 请选择一个脚本以查看代码';
    }

    const code = template
      .replace(/{{PROJECT_BASE}}/g, config.projectBase)
      .replace(/{{GENOME_BASE}}/g, config.genomeBase)
      .replace(/{{THREADS}}/g, config.threads.toString());
    
    setGeneratedCode(code);
  }, [config, activeScript]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedCode], {type: 'text/plain'});
    const filename = activeScript === 'readme' as any ? 'README.md' : 
                     activeScript === ScriptType.MAIN ? 'main_pipeline.sh' :
                     activeScript === ScriptType.UNZIP ? 'batch_unzip_sra.sh' :
                     activeScript === ScriptType.INDEX ? 'batch_build_index.sh' :
                     activeScript === ScriptType.ALIGN ? 'batch_align.sh' :
                     activeScript === ScriptType.DOWNLOAD ? 'download_genome.sh' :
                     activeScript === ScriptType.NO_KEGG ? 'annotate_no_kegg.sh' : 
                     `script_${activeScript}.sh`;
    
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  const handleGenerateReadme = async () => {
    const text = await generateReadme(config);
    setGeneratedReadme(text);
    setActiveScript('readme' as any); 
  };

  const TABS = [
      { id: ScriptType.MAIN, label: '主程序' },
      { id: ScriptType.UNZIP, label: '解压' },
      { id: ScriptType.INDEX, label: '索引' },
      { id: ScriptType.ALIGN, label: '比对' },
      { id: ScriptType.DOWNLOAD, label: '下载' },
      { id: ScriptType.NO_KEGG, label: '无KEGG' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Config Panel */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <RefreshCw size={20} /> 配置参数
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">项目根目录</label>
            <input 
              type="text" 
              value={config.projectBase}
              onChange={(e) => setConfig({...config, projectBase: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">基因组索引目录</label>
            <input 
              type="text" 
              value={config.genomeBase}
              onChange={(e) => setConfig({...config, genomeBase: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">线程数</label>
            <input 
              type="number" 
              value={config.threads}
              onChange={(e) => setConfig({...config, threads: parseInt(e.target.value)})}
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-2">项目与物种</h3>
            {config.projects.map((proj, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input 
                  value={proj.name}
                  onChange={(e) => {
                    const newProjs = [...config.projects];
                    newProjs[idx].name = e.target.value;
                    setConfig({...config, projects: newProjs});
                  }}
                  className="w-1/2 p-1 text-xs border rounded bg-slate-50"
                  placeholder="项目 ID"
                />
                <input 
                  value={proj.species}
                  onChange={(e) => {
                    const newProjs = [...config.projects];
                    newProjs[idx].species = e.target.value;
                    setConfig({...config, projects: newProjs});
                  }}
                  className="w-1/2 p-1 text-xs border rounded bg-slate-50"
                  placeholder="物种名称"
                />
              </div>
            ))}
            <button 
              onClick={() => setConfig({...config, projects: [...config.projects, {name: 'New_Project', species: 'Species_Name'}]})}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + 添加项目
            </button>
          </div>
          
          <div className="pt-6">
             <button 
                onClick={handleGenerateReadme}
                className="w-full py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2 transition-colors"
             >
               <FileText size={16} /> 生成说明文档 (README)
             </button>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="lg:col-span-2 bg-slate-900 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 px-4 py-3 bg-slate-800 border-b border-slate-700">
           {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveScript(tab.id); setGeneratedReadme(''); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeScript === tab.id && !generatedReadme
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
             {generatedReadme && (
                <button className="px-3 py-1 rounded text-xs font-medium bg-indigo-600 text-white">README.md</button>
             )}
            <div className="ml-auto flex gap-2">
                <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-white transition-colors" title="复制">
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
                <button onClick={handleDownload} className="p-2 text-slate-400 hover:text-white transition-colors" title="下载">
                <Download size={18} />
                </button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {generatedReadme || generatedCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;