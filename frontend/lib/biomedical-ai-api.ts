import {
  NERResponse,
  SummarizationResponse,
  CombinedAnalysisResponse,
  SimpleSummarizationResponse,
  SimpleAnalysisResponse,
  SensorMetadataAnalysis,
  ProposalAnalysis,
  BatchAnalysisResponse,
  AnalyzeTextRequest,
  SummarizeTextRequest,
  ProcessSensorMetadataRequest,
  AnalyzeProposalRequest,
  BatchAnalyzeRequest,
  HealthStatus
} from '@/types/biomedical-ai.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

class BiomedicalAIApi {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data.data as T;
  }

  // Health check
  async checkHealth(): Promise<HealthStatus> {
    return this.makeRequest<HealthStatus>('/biomedical-ai/health');
  }

  // Text analysis and entity extraction
  async extractEntities(request: AnalyzeTextRequest): Promise<NERResponse> {
    return this.makeRequest<NERResponse>('/biomedical-ai/extract-entities', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeText(request: AnalyzeTextRequest): Promise<SimpleAnalysisResponse> {
    return this.makeRequest<SimpleAnalysisResponse>('/biomedical-ai/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Text summarization
  async summarizeText(request: SummarizeTextRequest): Promise<SummarizationResponse> {
    return this.makeRequest<SummarizationResponse>('/biomedical-ai/summarize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async summarizeSimple(request: AnalyzeTextRequest): Promise<SimpleSummarizationResponse> {
    return this.makeRequest<SimpleSummarizationResponse>('/biomedical-ai/summarize-simple', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Combined analysis
  async extractAndSummarize(request: SummarizeTextRequest): Promise<CombinedAnalysisResponse> {
    return this.makeRequest<CombinedAnalysisResponse>('/biomedical-ai/extract-and-summarize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Specialized DAO functions
  async processSensorMetadata(request: ProcessSensorMetadataRequest): Promise<SensorMetadataAnalysis> {
    return this.makeRequest<SensorMetadataAnalysis>('/biomedical-ai/process-sensor-metadata', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeProposalContent(request: AnalyzeProposalRequest): Promise<ProposalAnalysis> {
    return this.makeRequest<ProposalAnalysis>('/biomedical-ai/analyze-proposal', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Batch processing
  async batchAnalyze(request: BatchAnalyzeRequest): Promise<BatchAnalysisResponse> {
    return this.makeRequest<BatchAnalysisResponse>('/biomedical-ai/batch-analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Utility functions for common use cases
  async quickAnalyze(text: string): Promise<{
    entities: SimpleAnalysisResponse;
    summary: SimpleSummarizationResponse;
  }> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    const [entities, summary] = await Promise.all([
      this.analyzeText({ text }),
      this.summarizeSimple({ text }),
    ]);

    return { entities, summary };
  }

  async comprehensiveAnalysis(text: string, options?: {
    max_length?: number;
    min_length?: number;
  }): Promise<CombinedAnalysisResponse> {
    return this.extractAndSummarize({
      text,
      max_length: options?.max_length || 100,
      min_length: options?.min_length || 20,
      do_sample: false,
    });
  }

  // Research-specific helpers
  async analyzeSensorData(metadata: string, sensorType: string): Promise<{
    analysis: SensorMetadataAnalysis;
    isHighRisk: boolean;
    hasHealthConcerns: boolean;
  }> {
    const analysis = await this.processSensorMetadata({ metadata, sensorType });
    
    const isHighRisk = analysis.risk_level === 'high';
    const hasHealthConcerns = analysis.entities.some(e => 
      e.entity_group === 'Disease_disorder' && e.score > 0.8
    );

    return {
      analysis,
      isHighRisk,
      hasHealthConcerns,
    };
  }

  async analyzeResearchProposal(title: string, description: string): Promise<{
    analysis: ProposalAnalysis;
    isBiomedicallyRelevant: boolean;
    relevanceScore: number;
  }> {
    const analysis = await this.analyzeProposalContent({ title, description });
    
    const isBiomedicallyRelevant = analysis.biomedical_relevance > 0.3;
    const relevanceScore = Math.round(analysis.biomedical_relevance * 100);

    return {
      analysis,
      isBiomedicallyRelevant,
      relevanceScore,
    };
  }

  // Batch processing helpers
  async analyzeMultipleTexts(
    texts: string[],
    operation: 'analyze' | 'summarize' | 'combined' = 'analyze'
  ): Promise<BatchAnalysisResponse> {
    if (texts.length === 0) {
      throw new Error('No texts provided');
    }

    if (texts.length > 50) {
      throw new Error('Maximum 50 texts allowed per batch');
    }

    return this.batchAnalyze({ texts, operation });
  }

  // Error handling wrapper
  async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<{ result?: T; error?: string; success: boolean }> {
    try {
      const result = await operation();
      return { result, success: true };
    } catch (error: any) {
      console.error('Biomedical AI operation failed:', error);
      return {
        result: fallback,
        error: error.message || 'Unknown error occurred',
        success: false,
      };
    }
  }
}

export const biomedicalAIApi = new BiomedicalAIApi();
export default biomedicalAIApi; 