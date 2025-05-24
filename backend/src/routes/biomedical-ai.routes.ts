import { Router } from 'express';
import { biomedicalAIController } from '../controllers/biomedical-ai.controller';

const router = Router();

/**
 * @swagger
 * /api/biomedical-ai/health:
 *   get:
 *     summary: Check biomedical AI service health
 *     tags: [Biomedical AI]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unavailable
 */
router.get('/health', biomedicalAIController.checkHealth);

/**
 * @swagger
 * /api/biomedical-ai/extract-entities:
 *   post:
 *     summary: Extract biomedical entities from text
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to analyze for biomedical entities
 *                 example: "Patients with diabetes and hypertension require careful monitoring."
 *     responses:
 *       200:
 *         description: Entities extracted successfully
 */
router.post('/extract-entities', biomedicalAIController.extractEntities);

/**
 * @swagger
 * /api/biomedical-ai/analyze:
 *   post:
 *     summary: Analyze text for biomedical entities (simplified)
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Patient shows symptoms of influenza and takes acetaminophen."
 *     responses:
 *       200:
 *         description: Text analyzed successfully
 */
router.post('/analyze', biomedicalAIController.analyzeText);

/**
 * @swagger
 * /api/biomedical-ai/summarize:
 *   post:
 *     summary: Summarize biomedical text
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to summarize
 *               max_length:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 1000
 *                 default: 60
 *               min_length:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 500
 *                 default: 20
 *               do_sample:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Text summarized successfully
 */
router.post('/summarize', biomedicalAIController.summarizeText);

/**
 * @swagger
 * /api/biomedical-ai/summarize-simple:
 *   post:
 *     summary: Simple text summarization with default parameters
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text summarized successfully
 */
router.post('/summarize-simple', biomedicalAIController.summarizeSimple);

/**
 * @swagger
 * /api/biomedical-ai/extract-and-summarize:
 *   post:
 *     summary: Extract entities and summarize text in one request
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               max_length:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 1000
 *                 default: 60
 *               min_length:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 500
 *                 default: 20
 *               do_sample:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Combined analysis completed successfully
 */
router.post('/extract-and-summarize', biomedicalAIController.extractAndSummarize);

/**
 * @swagger
 * /api/biomedical-ai/process-sensor-metadata:
 *   post:
 *     summary: Process sensor metadata for biomedical insights
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *               - sensorType
 *             properties:
 *               metadata:
 *                 type: string
 *                 description: Sensor metadata to analyze
 *                 example: "Temperature sensor in ICU room 302, patient monitoring vital signs"
 *               sensorType:
 *                 type: string
 *                 description: Type of sensor
 *                 example: "Temperature"
 *     responses:
 *       200:
 *         description: Sensor metadata processed successfully
 */
router.post('/process-sensor-metadata', biomedicalAIController.processSensorMetadata);

/**
 * @swagger
 * /api/biomedical-ai/analyze-proposal:
 *   post:
 *     summary: Analyze proposal content for biomedical relevance
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: Proposal title
 *               description:
 *                 type: string
 *                 description: Proposal description
 *     responses:
 *       200:
 *         description: Proposal analyzed successfully
 */
router.post('/analyze-proposal', biomedicalAIController.analyzeProposalContent);

/**
 * @swagger
 * /api/biomedical-ai/batch-analyze:
 *   post:
 *     summary: Batch process multiple texts
 *     tags: [Biomedical AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texts
 *             properties:
 *               texts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: Array of texts to process
 *               operation:
 *                 type: string
 *                 enum: [analyze, summarize, extract, combined]
 *                 default: analyze
 *                 description: Type of operation to perform
 *     responses:
 *       200:
 *         description: Batch processing completed
 */
router.post('/batch-analyze', biomedicalAIController.batchAnalyze);

export default router; 