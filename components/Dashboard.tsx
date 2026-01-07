import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { PipelineConfig } from '../types';
import { Info } from 'lucide-react';

const ALIGNMENT_DATA = [
  { name: 'PRJNA327257-S1', rate: 92.5, reads: 45000000 },
  { name: 'PRJNA327257-S2', rate: 88.2, reads: 42000000 },
  { name: 'PRJNA495025-S1', rate: 76.4, reads: 38000000 },
  { name: 'PRJNA495025-S2', rate: 81.0, reads: 39500000 },
  { name: 'PRJNA495025-S3', rate: 95.1, reads: 41000000 },
];

const SPECIES_DIST = [
  { name: 'S. lycopersicum', value: 2 },
  { name: 'S. virginianum', value: 3 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<{config: PipelineConfig}> = ({ config }) => {
  return (
    <div className="space-y-6">
        {/* 演示数据警告 Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div>
                <h3 className="font-semibold text-blue-800 text-sm">演示模式</h3>
                <p className="text-sm text-blue-600 mt-1">
                    当前展示为<b>模拟数据</b>。EasyBigtrans 是一个静态脚本生成器，它无法连接到您的私有服务器读取实时运行状态。
                    请使用 <span className="font-mono bg-blue-100 px-1 rounded">scripts</span> 页面生成脚本，在您的集群上运行后，查看生成的 CSV 报告。
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">项目总数</p>
                <p className="text-2xl font-bold text-slate-800">{config.projects.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">物种总数</p>
                <p className="text-2xl font-bold text-slate-800">{config.speciesList.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">平均比对率 (示例)</p>
                <p className="text-2xl font-bold text-slate-400">--%</p>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500">预计运行时间</p>
                <p className="text-2xl font-bold text-blue-600">计算中...</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">比对率 (模拟展示)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ALIGNMENT_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} angle={-45} textAnchor="end" />
                        <YAxis tick={{fill: '#64748b'}} />
                        <ReTooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                        />
                        <Legend />
                        <Bar dataKey="rate" name="比对率 %" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">样本分布 (模拟展示)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={SPECIES_DIST}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {SPECIES_DIST.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <ReTooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">流程示例</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 font-medium">
                        <tr>
                            <th className="p-3">项目</th>
                            <th className="p-3">步骤</th>
                            <th className="p-3">状态</th>
                            <th className="p-3">耗时</th>
                            <th className="p-3">最新日志</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="p-3 font-medium">演示项目 A</td>
                            <td className="p-3">--</td>
                            <td className="p-3"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">等待配置</span></td>
                            <td className="p-3">--</td>
                            <td className="p-3 font-mono text-xs">请前往脚本生成器配置参数</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;