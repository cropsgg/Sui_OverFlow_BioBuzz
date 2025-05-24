import { Request, Response } from 'express';
import { biomedicalAIService } from '../services/biomedical-ai.service';
import logger from '../services/logger';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export class BiomedicalAIController {
  /**
   * Check health of biomedical AI service
   */
  async checkHealth(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const health = await biomedicalAIService.checkHealth();
      
      res.status(200).json({
        success: true,
        message: 'Biomedical AI service is healthy',
        data: health,
      });
    } catch (error: any) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Biomedical AI service is not available',
        error: error.message,
      });
    }
  }

  /**
   * Extract biomedical entities from text
   */
  async extractEntities(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Text field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.extractEntities(text);

      res.status(200).json({
        success: true,
        message: 'Entities extracted successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error extracting entities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to extract entities',
        error: error.message,
      });
    }
  }

  /**
   * Analyze text for biomedical entities (simplified)
   */
  async analyzeText(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Text field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.analyzeText(text);

      res.status(200).json({
        success: true,
        message: 'Text analyzed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error analyzing text:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze text',
        error: error.message,
      });
    }
  }

  /**
   * Summarize biomedical text
   */
  async summarizeText(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { text, max_length, min_length, do_sample } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Text field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.summarizeText({
        text,
        max_length,
        min_length,
        do_sample,
      });

      res.status(200).json({
        success: true,
        message: 'Text summarized successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error summarizing text:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to summarize text',
        error: error.message,
      });
    }
  }

  /**
   * Simple text summarization
   */
  async summarizeSimple(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Text field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.summarizeSimple(text);

      res.status(200).json({
        success: true,
        message: 'Text summarized successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error in simple summarization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to summarize text',
        error: error.message,
      });
    }
  }

  /**
   * Extract entities and summarize text in one request
   */
  async extractAndSummarize(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { text, max_length, min_length, do_sample } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Text field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.extractAndSummarize({
        text,
        max_length,
        min_length,
        do_sample,
      });

      res.status(200).json({
        success: true,
        message: 'Combined analysis completed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error in combined analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform combined analysis',
        error: error.message,
      });
    }
  }

  /**
   * Process sensor metadata for biomedical insights
   */
  async processSensorMetadata(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { metadata, sensorType } = req.body;

      if (!metadata || typeof metadata !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Metadata field is required and must be a string',
        });
        return;
      }

      if (!sensorType || typeof sensorType !== 'string') {
        res.status(400).json({
          success: false,
          message: 'SensorType field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.processSensorMetadata(metadata, sensorType);

      res.status(200).json({
        success: true,
        message: 'Sensor metadata processed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error processing sensor metadata:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process sensor metadata',
        error: error.message,
      });
    }
  }

  /**
   * Analyze proposal content for biomedical relevance
   */
  async analyzeProposalContent(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { title, description } = req.body;

      if (!title || typeof title !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Title field is required and must be a string',
        });
        return;
      }

      if (!description || typeof description !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Description field is required and must be a string',
        });
        return;
      }

      const result = await biomedicalAIService.analyzeProposalContent(title, description);

      res.status(200).json({
        success: true,
        message: 'Proposal content analyzed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error analyzing proposal content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze proposal content',
        error: error.message,
      });
    }
  }

  /**
   * Batch process multiple texts
   */
  async batchAnalyze(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { texts, operation = 'analyze' } = req.body;

      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Texts field must be a non-empty array',
        });
        return;
      }

      if (texts.length > 50) {
        res.status(400).json({
          success: false,
          message: 'Maximum 50 texts allowed per batch',
        });
        return;
      }

      const results = [];
      
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (typeof text !== 'string' || !text.trim()) {
          continue;
        }

        try {
          let result;
          switch (operation) {
            case 'summarize':
              result = await biomedicalAIService.summarizeSimple(text);
              break;
            case 'extract':
              result = await biomedicalAIService.analyzeText(text);
              break;
            case 'combined':
              result = await biomedicalAIService.extractAndSummarize({ text });
              break;
            default:
              result = await biomedicalAIService.analyzeText(text);
          }
          
          results.push({
            index: i,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            result,
            success: true,
          });
        } catch (error: any) {
          results.push({
            index: i,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            error: error.message,
            success: false,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Batch processing completed. Processed ${results.length} texts.`,
        data: {
          results,
          total_processed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      });
    } catch (error: any) {
      logger.error('Error in batch analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process batch analysis',
        error: error.message,
      });
    }
  }
}

export const biomedicalAIController = new BiomedicalAIController(); 