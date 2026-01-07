export interface PipelineConfig {
  projectBase: string;
  genomeBase: string;
  threads: number;
  speciesList: string[];
  projects: {
    name: string;
    species: string;
  }[];
}

export enum ScriptType {
  UNZIP = 'unzip',
  INDEX = 'index',
  ALIGN = 'align',
  MAIN = 'main',
  DOWNLOAD = 'download',
  NO_KEGG = 'no_kegg'
}

export interface ChartData {
  name: string;
  value: number;
  category?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}