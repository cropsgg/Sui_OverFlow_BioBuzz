'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Microscope, 
  Activity, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Brain,
  Database,
  Users
} from 'lucide-react';
import { biomedicalAIApi } from '@/lib/biomedical-ai-api';
import {
  SensorMetadataAnalysis,
  ProposalAnalysis,
  RISK_LEVEL_CONFIG,
  ENTITY_GROUP_CONFIG,
  BiomedicalEntity
} from '@/types/biomedical-ai.types';

// Mock DAO data - In real app, this would come from the DAO API
const MOCK_SENSOR_DATA = [
  {
    id: 1,
    sensorType: 'Temperature',
    metadata: 'Hospital ICU temperature monitoring for COVID-19 patients, tracking fever patterns and inflammation markers',
    value: 38.5,
    timestamp: new Date('2024-01-15'),
    submittedBy: '0x123...abc'
  },
  {
    id: 2,
    sensorType: 'Heart Rate',
    metadata: 'Cardiac monitoring device for patients with atrial fibrillation and heart disease, measuring arrhythmia patterns',
    value: 95,
    timestamp: new Date('2024-01-14'),
    submittedBy: '0x456...def'
  },
  {
    id: 3,
    sensorType: 'Blood Pressure',
    metadata: 'Hypertension monitoring system for diabetes patients, tracking systolic and diastolic pressure variations',
    value: 140,
    timestamp: new Date('2024-01-13'),
    submittedBy: '0x789...ghi'
  }
];

const MOCK_PROPOSALS = [
  {
    id: 1,
    title: 'CRISPR Gene Therapy Research Initiative',
    description: 'Proposal to fund research on CRISPR-Cas9 gene editing for treating sickle cell disease and beta-thalassemia. The study will focus on editing the BCL11A gene to reactivate fetal hemoglobin production.',
    proposer: '0xabc...123',
    type: 'Research',
    status: 'Active'
  },
  {
    id: 2,
    title: 'COVID-19 Vaccine Efficacy Study',
    description: 'Longitudinal study to analyze vaccine effectiveness against SARS-CoV-2 variants. Will track antibody levels, T-cell responses, and breakthrough infections in vaccinated populations.',
    proposer: '0xdef...456',
    type: 'Clinical',
    status: 'Active'
  },
  {
    id: 3,
    title: 'AI-Powered Drug Discovery Platform',
    description: 'Development of machine learning algorithms to identify potential pharmaceutical compounds for treating Alzheimer disease and Parkinson disease using molecular structure analysis.',
    proposer: '0xghi...789',
    type: 'Technology',
    status: 'Pending'
  }
];

interface AnalysisState {
  sensorAnalysis: { [key: number]: SensorMetadataAnalysis } | null;
  proposalAnalysis: { [key: number]: ProposalAnalysis } | null;
  isAnalyzing: boolean;
  selectedSensorId: number | null;
  selectedProposalId: number | null;
  customSensorData: {
    sensorType: string;
    metadata: string;
  };
  customProposalData: {
    title: string;
    description: string;
  };
}

export default function ResearchInsightsPage() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    sensorAnalysis: null,
    proposalAnalysis: null,
    isAnalyzing: false,
    selectedSensorId: null,
    selectedProposalId: null,
    customSensorData: { sensorType: '', metadata: '' },
    customProposalData: { title: '', description: '' }
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sensor-insights');

  const analyzeSensorData = async (sensorId?: number) => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);

    try {
      if (sensorId) {
        const sensor = MOCK_SENSOR_DATA.find(s => s.id === sensorId);
        if (!sensor) return;

        const result = await biomedicalAIApi.processSensorMetadata({
          metadata: sensor.metadata,
          sensorType: sensor.sensorType
        });

        setAnalysisState(prev => ({
          ...prev,
          sensorAnalysis: { ...prev.sensorAnalysis, [sensorId]: result },
          selectedSensorId: sensorId
        }));
      } else {
        // Analyze custom sensor data
        const { sensorType, metadata } = analysisState.customSensorData;
        if (!sensorType || !metadata) return;

        const result = await biomedicalAIApi.processSensorMetadata({
          metadata,
          sensorType
        });

        setAnalysisState(prev => ({
          ...prev,
          sensorAnalysis: { ...prev.sensorAnalysis, custom: result },
          selectedSensorId: 'custom' as any
        }));
      }
    } catch (error: any) {
      setError(`Sensor analysis failed: ${error.message}`);
    } finally {
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const analyzeProposal = async (proposalId?: number) => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);

    try {
      if (proposalId) {
        const proposal = MOCK_PROPOSALS.find(p => p.id === proposalId);
        if (!proposal) return;

        const result = await biomedicalAIApi.analyzeProposalContent({
          title: proposal.title,
          description: proposal.description
        });

        setAnalysisState(prev => ({
          ...prev,
          proposalAnalysis: { ...prev.proposalAnalysis, [proposalId]: result },
          selectedProposalId: proposalId
        }));
      } else {
        // Analyze custom proposal data
        const { title, description } = analysisState.customProposalData;
        if (!title || !description) return;

        const result = await biomedicalAIApi.analyzeProposalContent({
          title,
          description
        });

        setAnalysisState(prev => ({
          ...prev,
          proposalAnalysis: { ...prev.proposalAnalysis, custom: result },
          selectedProposalId: 'custom' as any
        }));
      }
    } catch (error: any) {
      setError(`Proposal analysis failed: ${error.message}`);
    } finally {
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const analyzeAllSensorData = async () => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);

    try {
      const results: { [key: number]: SensorMetadataAnalysis } = {};
      
      for (const sensor of MOCK_SENSOR_DATA) {
        const result = await biomedicalAIApi.processSensorMetadata({
          metadata: sensor.metadata,
          sensorType: sensor.sensorType
        });
        results[sensor.id] = result;
      }

      setAnalysisState(prev => ({ ...prev, sensorAnalysis: results }));
    } catch (error: any) {
      setError(`Batch sensor analysis failed: ${error.message}`);
    } finally {
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const analyzeAllProposals = async () => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);

    try {
      const results: { [key: number]: ProposalAnalysis } = {};
      
      for (const proposal of MOCK_PROPOSALS) {
        const result = await biomedicalAIApi.analyzeProposalContent({
          title: proposal.title,
          description: proposal.description
        });
        results[proposal.id] = result;
      }

      setAnalysisState(prev => ({ ...prev, proposalAnalysis: results }));
    } catch (error: any) {
      setError(`Batch proposal analysis failed: ${error.message}`);
    } finally {
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const renderEntityBadge = (entity: BiomedicalEntity) => {
    const config = ENTITY_GROUP_CONFIG[entity.entity_group as keyof typeof ENTITY_GROUP_CONFIG] || ENTITY_GROUP_CONFIG.Other;
    return (
      <Badge
        key={`${entity.word}-${entity.start}`}
        variant="outline"
        className={`${config.bgColor} ${config.color} ${config.borderColor} mr-1 mb-1`}
      >
        <span className="text-xs">{entity.word}</span>
      </Badge>
    );
  };

  const getRiskLevelIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    const config = RISK_LEVEL_CONFIG[riskLevel];
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🔬 Research Insights Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          AI-powered analysis of DAO sensor data and research proposals for biomedical insights
        </p>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensor-insights" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sensor Data Insights
          </TabsTrigger>
          <TabsTrigger value="proposal-analysis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Proposal Analysis
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensor-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sensor Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sensor Data
                </CardTitle>
                <CardDescription>
                  Select sensor data to analyze for biomedical insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={analyzeAllSensorData}
                  disabled={analysisState.isAnalyzing}
                  className="w-full"
                >
                  {analysisState.isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Analyze All Sensors
                </Button>

                <div className="space-y-2">
                  {MOCK_SENSOR_DATA.map((sensor) => (
                    <Card key={sensor.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{sensor.sensorType}</h4>
                          <Badge variant="outline">{sensor.value}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{sensor.metadata.substring(0, 100)}...</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {sensor.timestamp.toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => analyzeSensorData(sensor.id)}
                            disabled={analysisState.isAnalyzing}
                          >
                            {analysisState.isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
                          </Button>
                        </div>
                        
                        {/* Show analysis result if available */}
                        {analysisState.sensorAnalysis?.[sensor.id] && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              {getRiskLevelIcon(analysisState.sensorAnalysis[sensor.id].risk_level)}
                              <span className="text-sm font-medium">
                                {RISK_LEVEL_CONFIG[analysisState.sensorAnalysis[sensor.id].risk_level].label}
                              </span>
                            </div>
                            <div className="flex flex-wrap">
                              {analysisState.sensorAnalysis[sensor.id].entities.slice(0, 3).map(entity => renderEntityBadge(entity))}
                              {analysisState.sensorAnalysis[sensor.id].entities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{analysisState.sensorAnalysis[sensor.id].entities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Custom Sensor Input */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Custom Sensor Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Sensor type (e.g., Temperature, Heart Rate)"
                      value={analysisState.customSensorData.sensorType}
                      onChange={(e) => setAnalysisState(prev => ({
                        ...prev,
                        customSensorData: { ...prev.customSensorData, sensorType: e.target.value }
                      }))}
                    />
                    <Textarea
                      placeholder="Sensor metadata description..."
                      value={analysisState.customSensorData.metadata}
                      onChange={(e) => setAnalysisState(prev => ({
                        ...prev,
                        customSensorData: { ...prev.customSensorData, metadata: e.target.value }
                      }))}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => analyzeSensorData()}
                      disabled={!analysisState.customSensorData.sensorType || !analysisState.customSensorData.metadata || analysisState.isAnalyzing}
                      className="w-full"
                    >
                      Analyze Custom Data
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Detailed Analysis Results */}
            <div className="lg:col-span-2">
              {analysisState.selectedSensorId && analysisState.sensorAnalysis?.[analysisState.selectedSensorId] ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Microscope className="h-5 w-5" />
                      Detailed Sensor Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const analysis = analysisState.sensorAnalysis[analysisState.selectedSensorId];
                      const riskConfig = RISK_LEVEL_CONFIG[analysis.risk_level];
                      
                      return (
                        <>
                          {/* Risk Assessment */}
                          <div className={`p-4 rounded-lg border ${riskConfig.borderColor} ${riskConfig.bgColor}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {getRiskLevelIcon(analysis.risk_level)}
                              <h3 className={`font-medium ${riskConfig.color}`}>
                                Risk Level: {riskConfig.label}
                              </h3>
                            </div>
                            <p className={`text-sm ${riskConfig.color}`}>
                              {analysis.summary}
                            </p>
                          </div>

                          {/* Insights */}
                          <div>
                            <h3 className="font-medium mb-3">Key Insights</h3>
                            <div className="space-y-2">
                              {analysis.insights.map((insight, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-blue-800">{insight}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Biomedical Entities */}
                          <div>
                            <h3 className="font-medium mb-3">Biomedical Entities Found</h3>
                            <div className="flex flex-wrap gap-1">
                              {analysis.entities.map(entity => renderEntityBadge(entity))}
                            </div>
                          </div>

                          {/* Entity Breakdown */}
                          <div>
                            <h3 className="font-medium mb-3">Entity Categories</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(
                                analysis.entities.reduce((acc, entity) => {
                                  acc[entity.entity_group] = (acc[entity.entity_group] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).map(([category, count]) => {
                                const config = ENTITY_GROUP_CONFIG[category as keyof typeof ENTITY_GROUP_CONFIG] || ENTITY_GROUP_CONFIG.Other;
                                return (
                                  <div key={category} className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                                    <div className={`text-sm font-medium ${config.color}`}>
                                      {config.label}
                                    </div>
                                    <div className={`text-lg font-bold ${config.color}`}>
                                      {count}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a sensor to view detailed biomedical analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposal-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Proposal Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  DAO Proposals
                </CardTitle>
                <CardDescription>
                  Analyze proposals for biomedical relevance and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={analyzeAllProposals}
                  disabled={analysisState.isAnalyzing}
                  className="w-full"
                >
                  {analysisState.isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Analyze All Proposals
                </Button>

                <div className="space-y-2">
                  {MOCK_PROPOSALS.map((proposal) => (
                    <Card key={proposal.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{proposal.title}</h4>
                          <Badge variant="outline" className="text-xs">{proposal.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{proposal.description.substring(0, 120)}...</p>
                        <div className="flex justify-between items-center">
                          <Badge 
                            variant={proposal.status === 'Active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {proposal.status}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => analyzeProposal(proposal.id)}
                            disabled={analysisState.isAnalyzing}
                          >
                            {analysisState.isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
                          </Button>
                        </div>

                        {/* Show analysis result if available */}
                        {analysisState.proposalAnalysis?.[proposal.id] && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium">Biomedical Relevance</span>
                              <Badge 
                                variant={analysisState.proposalAnalysis[proposal.id].biomedical_relevance > 0.5 ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {Math.round(analysisState.proposalAnalysis[proposal.id].biomedical_relevance * 100)}%
                              </Badge>
                            </div>
                            <div className="flex flex-wrap">
                              {analysisState.proposalAnalysis[proposal.id].key_terms.slice(0, 3).map((term, index) => (
                                <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                  {term}
                                </Badge>
                              ))}
                              {analysisState.proposalAnalysis[proposal.id].key_terms.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{analysisState.proposalAnalysis[proposal.id].key_terms.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Custom Proposal Input */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Custom Proposal Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Proposal title..."
                      value={analysisState.customProposalData.title}
                      onChange={(e) => setAnalysisState(prev => ({
                        ...prev,
                        customProposalData: { ...prev.customProposalData, title: e.target.value }
                      }))}
                    />
                    <Textarea
                      placeholder="Proposal description..."
                      value={analysisState.customProposalData.description}
                      onChange={(e) => setAnalysisState(prev => ({
                        ...prev,
                        customProposalData: { ...prev.customProposalData, description: e.target.value }
                      }))}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => analyzeProposal()}
                      disabled={!analysisState.customProposalData.title || !analysisState.customProposalData.description || analysisState.isAnalyzing}
                      className="w-full"
                    >
                      Analyze Custom Proposal
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Detailed Proposal Analysis */}
            <div className="lg:col-span-2">
              {analysisState.selectedProposalId && analysisState.proposalAnalysis?.[analysisState.selectedProposalId] ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Detailed Proposal Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const analysis = analysisState.proposalAnalysis[analysisState.selectedProposalId];
                      const relevanceScore = Math.round(analysis.biomedical_relevance * 100);
                      const isHighlyRelevant = analysis.biomedical_relevance > 0.5;
                      
                      return (
                        <>
                          {/* Relevance Score */}
                          <div className={`p-4 rounded-lg border ${isHighlyRelevant ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`font-medium ${isHighlyRelevant ? 'text-green-900' : 'text-yellow-900'}`}>
                                Biomedical Relevance Score
                              </h3>
                              <div className="flex items-center gap-2">
                                {isHighlyRelevant ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Activity className="h-5 w-5 text-yellow-600" />
                                )}
                                <span className={`text-2xl font-bold ${isHighlyRelevant ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {relevanceScore}%
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm ${isHighlyRelevant ? 'text-green-800' : 'text-yellow-800'}`}>
                              {analysis.summary}
                            </p>
                          </div>

                          {/* Key Biomedical Terms */}
                          <div>
                            <h3 className="font-medium mb-3">Key Biomedical Terms</h3>
                            <div className="flex flex-wrap gap-2">
                              {analysis.key_terms.map((term, index) => (
                                <Badge 
                                  key={index} 
                                  variant="default" 
                                  className="bg-blue-100 text-blue-800 border-blue-300"
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* All Entities */}
                          <div>
                            <h3 className="font-medium mb-3">All Biomedical Entities</h3>
                            <div className="flex flex-wrap gap-1">
                              {analysis.entities.map(entity => renderEntityBadge(entity))}
                            </div>
                          </div>

                          {/* Entity Statistics */}
                          <div>
                            <h3 className="font-medium mb-3">Entity Statistics</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(
                                analysis.entities.reduce((acc, entity) => {
                                  acc[entity.entity_group] = (acc[entity.entity_group] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).map(([category, count]) => {
                                const config = ENTITY_GROUP_CONFIG[category as keyof typeof ENTITY_GROUP_CONFIG] || ENTITY_GROUP_CONFIG.Other;
                                return (
                                  <div key={category} className={`p-3 rounded-lg border text-center ${config.borderColor} ${config.bgColor}`}>
                                    <div className={`text-xs font-medium ${config.color} mb-1`}>
                                      {config.label}
                                    </div>
                                    <div className={`text-xl font-bold ${config.color}`}>
                                      {count}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              AI Recommendations
                            </h3>
                            <div className="space-y-2">
                              {isHighlyRelevant ? (
                                <div className="text-sm text-green-800 bg-green-100 p-2 rounded">
                                  ✅ This proposal shows high biomedical relevance and would be valuable for healthcare research
                                </div>
                              ) : (
                                <div className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                                  ⚠️ This proposal has moderate biomedical relevance. Consider adding more specific medical applications
                                </div>
                              )}
                              {analysis.entities.some(e => e.entity_group === 'Disease_disorder') && (
                                <div className="text-sm text-blue-800 bg-blue-100 p-2 rounded">
                                  🔬 Disease-related entities detected - suitable for medical research funding
                                </div>
                              )}
                              {analysis.entities.some(e => e.entity_group === 'Gene_protein') && (
                                <div className="text-sm text-purple-800 bg-purple-100 p-2 rounded">
                                  🧬 Genetic/protein research components identified - aligns with precision medicine goals
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a proposal to view detailed biomedical analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Summary Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sensors</p>
                    <p className="text-3xl font-bold text-blue-600">{MOCK_SENSOR_DATA.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Proposals</p>
                    <p className="text-3xl font-bold text-green-600">
                      {MOCK_PROPOSALS.filter(p => p.status === 'Active').length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Risk Sensors</p>
                    <p className="text-3xl font-bold text-red-600">
                      {analysisState.sensorAnalysis 
                        ? Object.values(analysisState.sensorAnalysis).filter(a => a.risk_level === 'high').length 
                        : '-'}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Biomedical Proposals</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {analysisState.proposalAnalysis 
                        ? Object.values(analysisState.proposalAnalysis).filter(a => a.biomedical_relevance > 0.5).length 
                        : '-'}
                    </p>
                  </div>
                  <Microscope className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensor Risk Assessment</CardTitle>
                <CardDescription>Risk levels across all analyzed sensors</CardDescription>
              </CardHeader>
              <CardContent>
                {analysisState.sensorAnalysis ? (
                  <div className="space-y-3">
                    {Object.entries(analysisState.sensorAnalysis).map(([id, analysis]) => {
                      const sensor = MOCK_SENSOR_DATA.find(s => s.id === parseInt(id));
                      const riskConfig = RISK_LEVEL_CONFIG[analysis.risk_level];
                      
                      return (
                        <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{sensor?.sensorType || 'Custom'}</span>
                            <div className="text-sm text-gray-600">
                              {analysis.entities.length} entities found
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRiskLevelIcon(analysis.risk_level)}
                            <Badge className={`${riskConfig.bgColor} ${riskConfig.color} ${riskConfig.borderColor}`}>
                              {riskConfig.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No sensor analysis data available. Run sensor analysis to see results.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proposal Relevance Scores</CardTitle>
                <CardDescription>Biomedical relevance of DAO proposals</CardDescription>
              </CardHeader>
              <CardContent>
                {analysisState.proposalAnalysis ? (
                  <div className="space-y-3">
                    {Object.entries(analysisState.proposalAnalysis).map(([id, analysis]) => {
                      const proposal = MOCK_PROPOSALS.find(p => p.id === parseInt(id));
                      const relevanceScore = Math.round(analysis.biomedical_relevance * 100);
                      const isHighlyRelevant = analysis.biomedical_relevance > 0.5;
                      
                      return (
                        <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{proposal?.title.substring(0, 30) || 'Custom'}...</span>
                            <div className="text-sm text-gray-600">
                              {analysis.key_terms.length} key terms
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isHighlyRelevant ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <Badge variant={isHighlyRelevant ? 'default' : 'secondary'}>
                              {relevanceScore}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No proposal analysis data available. Run proposal analysis to see results.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 