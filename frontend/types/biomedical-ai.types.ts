export interface BiomedicalEntity {
  word: string;
  entity_group: string;
  score: number;
  start: number;
  end: number;
}

export interface NERResponse {
  input_text: string;
  entities: BiomedicalEntity[];
  total_entities: number;
}

export interface SummarizationResponse {
  original_text: string;
  summary: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
  max_length: number;
  min_length: number;
}

export interface CombinedAnalysisResponse {
  original_text: string;
  summary: string;
  entities: BiomedicalEntity[];
  total_entities: number;
  compression_ratio: number;
  original_length: number;
  summary_length: number;
}

export interface SimpleSummarizationResponse {
  original_text: string;
  summary: string;
  compression_ratio: number;
}

export interface SimpleAnalysisResponse {
  text: string;
  entities: BiomedicalEntity[];
  count: number;
}

export interface SensorMetadataAnalysis {
  entities: BiomedicalEntity[];
  summary: string;
  insights: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface ProposalAnalysis {
  entities: BiomedicalEntity[];
  summary: string;
  biomedical_relevance: number;
  key_terms: string[];
}

export interface BatchAnalysisResult {
  index: number;
  text: string;
  result?: any;
  error?: string;
  success: boolean;
}

export interface BatchAnalysisResponse {
  results: BatchAnalysisResult[];
  total_processed: number;
  successful: number;
  failed: number;
}

export interface AnalyzeTextRequest {
  text: string;
}

export interface SummarizeTextRequest {
  text: string;
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

export interface ProcessSensorMetadataRequest {
  metadata: string;
  sensorType: string;
}

export interface AnalyzeProposalRequest {
  title: string;
  description: string;
}

export interface BatchAnalyzeRequest {
  texts: string[];
  operation?: 'analyze' | 'summarize' | 'extract' | 'combined';
}

export interface HealthStatus {
  status: string;
  models_loaded: {
    ner: boolean;
    summarizer: boolean;
  };
}

// Entity group types for better categorization
export type EntityGroup = 
  | 'Disease_disorder'
  | 'Chemical'
  | 'Gene_protein'
  | 'Anatomy'
  | 'Biological_process'
  | 'Medical_device'
  | 'Medication'
  | 'Symptom'
  | 'Treatment'
  | 'Other';

// Risk level colors and icons
export const RISK_LEVEL_CONFIG = {
  low: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Low Risk',
    icon: '🟢'
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Medium Risk',
    icon: '🟡'
  },
  high: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'High Risk',
    icon: '🔴'
  }
} as const;

// Entity group colors for UI
export const ENTITY_GROUP_CONFIG = {
  Disease_disorder: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    label: 'Disease/Disorder'
  },
  Chemical: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    label: 'Chemical'
  },
  Gene_protein: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    label: 'Gene/Protein'
  },
  Anatomy: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: 'Anatomy'
  },
  Biological_process: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    label: 'Biological Process'
  },
  Medical_device: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    label: 'Medical Device'
  },
  Medication: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    label: 'Medication'
  },
  Symptom: {
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    label: 'Symptom'
  },
  Treatment: {
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    label: 'Treatment'
  },
  Other: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Other'
  }
} as const; 