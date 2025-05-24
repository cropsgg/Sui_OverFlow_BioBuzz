import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from './logger';

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

export interface AnalyzeTextRequest {
  text: string;
}

export interface SummarizeTextRequest {
  text: string;
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

export class BiomedicalAIService {
  private client: AxiosInstance;
  private modelServerUrl: string;

  constructor() {
    this.modelServerUrl = process.env.BIOMEDICAL_MODEL_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.modelServerUrl,
      timeout: 30000, // 30 seconds timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Making request to biomedical AI: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Biomedical AI request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        logger.error('Biomedical AI response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the biomedical AI model server is healthy
   */
  async checkHealth(): Promise<{ status: string; models_loaded: { ner: boolean; summarizer: boolean } }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      throw new Error(`Biomedical AI service is not available: ${error}`);
    }
  }

  /**
   * Extract biomedical entities from text
   */
  async extractEntities(text: string): Promise<NERResponse> {
    try {
      if (!text?.trim()) {
        throw new Error('Text input cannot be empty');
      }

      const response = await this.client.post<NERResponse>('/extract-entities', {
        text: text.trim(),
      });

      logger.info(`Extracted ${response.data.total_entities} entities from text`);
      return response.data;
    } catch (error: any) {
      logger.error('Error extracting entities:', error);
      throw new Error(`Failed to extract entities: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Analyze text for entities (simplified version)
   */
  async analyzeText(text: string): Promise<{ text: string; entities: BiomedicalEntity[]; count: number }> {
    try {
      if (!text?.trim()) {
        throw new Error('Text input cannot be empty');
      }

      const response = await this.client.post('/analyze', {
        text: text.trim(),
      });

      logger.info(`Analyzed text and found ${response.data.count} entities`);
      return response.data;
    } catch (error: any) {
      logger.error('Error analyzing text:', error);
      throw new Error(`Failed to analyze text: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Summarize biomedical text
   */
  async summarizeText(request: SummarizeTextRequest): Promise<SummarizationResponse> {
    try {
      if (!request.text?.trim()) {
        throw new Error('Text input cannot be empty');
      }

      const payload = {
        text: request.text.trim(),
        max_length: request.max_length || 60,
        min_length: request.min_length || 20,
        do_sample: request.do_sample || false,
      };

      const response = await this.client.post<SummarizationResponse>('/summarize', payload);

      logger.info(`Summarized text: ${response.data.original_length} -> ${response.data.summary_length} chars`);
      return response.data;
    } catch (error: any) {
      logger.error('Error summarizing text:', error);
      throw new Error(`Failed to summarize text: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Simple summarization with default parameters
   */
  async summarizeSimple(text: string): Promise<{ original_text: string; summary: string; compression_ratio: number }> {
    try {
      if (!text?.trim()) {
        throw new Error('Text input cannot be empty');
      }

      const response = await this.client.post('/summarize-simple', {
        text: text.trim(),
      });

      logger.info(`Simple summarization completed with ${response.data.compression_ratio.toFixed(2)} compression ratio`);
      return response.data;
    } catch (error: any) {
      logger.error('Error in simple summarization:', error);
      throw new Error(`Failed to summarize text: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Extract entities and summarize text in one request
   */
  async extractAndSummarize(request: SummarizeTextRequest): Promise<CombinedAnalysisResponse> {
    try {
      if (!request.text?.trim()) {
        throw new Error('Text input cannot be empty');
      }

      const payload = {
        text: request.text.trim(),
        max_length: request.max_length || 60,
        min_length: request.min_length || 20,
        do_sample: request.do_sample || false,
      };

      const response = await this.client.post<CombinedAnalysisResponse>('/extract-and-summarize', payload);

      logger.info(`Combined analysis: ${response.data.total_entities} entities, ${response.data.compression_ratio.toFixed(2)} compression`);
      return response.data;
    } catch (error: any) {
      logger.error('Error in combined analysis:', error);
      throw new Error(`Failed to perform combined analysis: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Process sensor metadata for biomedical insights
   * This is a custom method tailored for DAO sensor data
   */
  async processSensorMetadata(metadata: string, sensorType: string): Promise<{
    entities: BiomedicalEntity[];
    summary: string;
    insights: string[];
    risk_level: 'low' | 'medium' | 'high';
  }> {
    try {
      const combinedText = `Sensor Type: ${sensorType}. Metadata: ${metadata}`;
      
      // Perform combined analysis
      const analysis = await this.extractAndSummarize({
        text: combinedText,
        max_length: 50,
        min_length: 15,
      });

      // Generate insights based on entities found
      const insights: string[] = [];
      const riskEntities = analysis.entities.filter(e => 
        e.entity_group === 'Disease_disorder' || 
        e.entity_group === 'Chemical' ||
        e.score > 0.8
      );

      if (riskEntities.length > 0) {
        insights.push(`Found ${riskEntities.length} biomedical entities of interest`);
      }

      const diseaseEntities = analysis.entities.filter(e => e.entity_group === 'Disease_disorder');
      if (diseaseEntities.length > 0) {
        insights.push(`Potential health-related concerns detected: ${diseaseEntities.map(e => e.word).join(', ')}`);
      }

      const chemicalEntities = analysis.entities.filter(e => e.entity_group === 'Chemical');
      if (chemicalEntities.length > 0) {
        insights.push(`Chemical/medication entities found: ${chemicalEntities.map(e => e.word).join(', ')}`);
      }

      // Determine risk level
      let risk_level: 'low' | 'medium' | 'high' = 'low';
      if (diseaseEntities.length > 0 || riskEntities.some(e => e.score > 0.9)) {
        risk_level = 'high';
      } else if (riskEntities.length > 0) {
        risk_level = 'medium';
      }

      return {
        entities: analysis.entities,
        summary: analysis.summary,
        insights,
        risk_level,
      };
    } catch (error: any) {
      logger.error('Error processing sensor metadata:', error);
      throw new Error(`Failed to process sensor metadata: ${error.message}`);
    }
  }

  /**
   * Analyze proposal description for biomedical content
   */
  async analyzeProposalContent(title: string, description: string): Promise<{
    entities: BiomedicalEntity[];
    summary: string;
    biomedical_relevance: number;
    key_terms: string[];
  }> {
    try {
      const combinedText = `Proposal: ${title}. Description: ${description}`;
      
      const analysis = await this.extractAndSummarize({
        text: combinedText,
        max_length: 80,
        min_length: 25,
      });

      // Calculate biomedical relevance score
      const biomedicalEntities = analysis.entities.filter(e => 
        ['Disease_disorder', 'Chemical', 'Gene_protein', 'Anatomy'].includes(e.entity_group)
      );
      
      const biomedical_relevance = biomedicalEntities.length > 0 ? 
        Math.min(1.0, biomedicalEntities.length / 5) : 0;

      // Extract key biomedical terms
      const key_terms = biomedicalEntities
        .filter(e => e.score > 0.7)
        .map(e => e.word)
        .slice(0, 10); // Top 10 terms

      return {
        entities: analysis.entities,
        summary: analysis.summary,
        biomedical_relevance,
        key_terms,
      };
    } catch (error: any) {
      logger.error('Error analyzing proposal content:', error);
      throw new Error(`Failed to analyze proposal content: ${error.message}`);
    }
  }
}

export const biomedicalAIService = new BiomedicalAIService(); 