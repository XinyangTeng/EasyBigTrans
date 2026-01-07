import { PipelineConfig } from '../types';
import { README_TEMPLATE } from '../constants';

// This service no longer uses external APIs. 
// It generates content locally based on templates.

export const generateReadme = async (config: PipelineConfig): Promise<string> => {
  // Simulate async for compatibility, though it's instant
  return new Promise((resolve) => {
    let content = README_TEMPLATE
      .replace(/{{PROJECT_BASE}}/g, config.projectBase)
      .replace(/{{GENOME_BASE}}/g, config.genomeBase)
      .replace(/{{THREADS}}/g, config.threads.toString());

    const projectList = config.projects
      .map(p => `- **${p.name}**: ${p.species}`)
      .join('\n');
    
    const speciesList = config.speciesList
      .map(s => `- ${s}`)
      .join('\n');

    content = content
      .replace('{{PROJECT_LIST}}', projectList)
      .replace('{{SPECIES_LIST}}', speciesList);

    resolve(content);
  });
};

export const chatWithAssistant = async (message: string, context?: string) => {
    return "AI 助手在本地模式下已禁用。请参考流程指南。";
}