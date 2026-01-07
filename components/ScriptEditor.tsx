import React, { useState, useEffect, useRef } from 'react';
import { PipelineConfig, ScriptType } from '../types';
import { SCRIPTS } from '../constants';
import { Download, Copy, Check, RefreshCw, FileUp, FileDown, Trash2 } from 'lucide-react';

interface ScriptEditorProps {
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ config, setConfig }) => {
  const [activeScript, setActiveScript] = useState<ScriptType>(ScriptType.MAIN);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const filename = activeScript === ScriptType.MAIN ? 'main_pipeline.sh' :
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
    document.body.removeChild(element);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "project_name,species_name\nPRJNA327257,Solanum_lycopersicum\nPRJNA495025,Solanum_virginianum";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'project_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r\n|\n/);
        const newProjects: { name: string; species: string }[] = [];
        const newSpeciesSet = new Set<string>(config.speciesList);

        lines.forEach((line, index) => {
          // Skip empty lines
          if (!line.trim()) return;
          
          const parts = line.split(',');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const species = parts[1].trim();
            
            // Skip header row if present
            if (index === 0 && (name.toLowerCase() === 'project_name' || name.toLowerCase() === 'project')) return;

            if (name && species) {
              newProjects.push({ name, species });
              newSpeciesSet.add(species);
            }
          }
        });

        if (newProjects.length > 0) {
          setConfig(prev => ({
            ...prev,
            projects: newProjects,
            speciesList: Array.from(newSpeciesSet)
          }));
          alert(`成功导入 ${newProjects.length} 个项目！`);
        } else {
          alert('未能识别有效数据，请检查 CSV 格式。');
        }
      } catch (err) {
        alert('文件解析失败，请确保上传的是标准的 CSV 文件。');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-700">项目与物种</h3>
              <div className="flex gap-2">
                 <button 
                  onClick={handleDownloadTemplate}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="下载 CSV 模板"
                >
                  <FileDown size={16} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="上传 CSV (Excel 另存为 CSV)"
                >
                  <FileUp size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.txt" 
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            
            <div className="text-xs text-slate-400 mb-3">
              支持 Excel 另存为 CSV 格式导入 (格式: 项目名,物种名)
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {config.projects.map((proj, idx) => (
                <div key={idx} className="flex gap-2 group">
                  <input 
                    value={proj.name}
                    onChange={(e) => {
                      const newProjs = [...config.projects];
                      newProjs[idx].name = e.target.value;
                      setConfig({...config, projects: newProjs});
                    }}
                    className="w-[45%] p-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                    placeholder="项目 ID"
                  />
                  <input 
                    value={proj.species}
                    onChange={(e) => {
                      const newProjs = [...config.projects];
                      newProjs[idx].species = e.target.value;
                      setConfig({...config, projects: newProjs});
                    }}
                    className="w-[45%] p-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                    placeholder="物种名称"
                  />
                  <button 
                    onClick={() => {
                        const newProjs = config.projects.filter((_, i) => i !== idx);
                        setConfig({...config, projects: newProjs});
                    }}
                    className="w-[10%] flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setConfig({...config, projects: [...config.projects, {name: 'New_Project', species: 'Species_Name'}]})}
              className="mt-3 w-full py-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 font-medium transition-colors"
            >
              + 添加单条记录
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
                onClick={() => { setActiveScript(tab.id); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeScript === tab.id
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            {generatedCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;