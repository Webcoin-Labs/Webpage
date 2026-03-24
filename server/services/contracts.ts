import "server-only";

import { IntegrationProvider, WorkspaceType } from "@prisma/client";

export type ScoreLabel = "strong" | "moderate" | "missing" | "under_review";

export type ScoreFactor = {
  key: string;
  label: string;
  weight: number;
  value: number;
  status: ScoreLabel;
  reason?: string;
};

export type ScoreExplanation = {
  score: number;
  label: ScoreLabel;
  factors: ScoreFactor[];
  lastComputedAt: string;
  sourceVersion: string;
};

export interface IdentityService {
  getEnabledWorkspaces(userId: string): Promise<WorkspaceType[]>;
  setDefaultWorkspace(userId: string, workspace: WorkspaceType): Promise<void>;
  saveOnboardingProgress(userId: string, step: string, payload?: Record<string, unknown>): Promise<void>;
}

export interface VentureService {
  getFounderVentures(userId: string): Promise<Array<{ id: string; name: string; stage: string | null; chainEcosystem: string | null }>>;
}

export interface DiscoveryService {
  findBuilderMatches(founderUserId: string, take?: number): Promise<Array<{ userId: string; score: number; reasons: string[] }>>;
  findVentureMatches(investorUserId: string, take?: number): Promise<Array<{ ventureId: string; score: number; reasons: string[] }>>;
}

export interface ApplicationService {
  createInvestorApplication(input: {
    founderUserId: string;
    investorUserId: string;
    ventureId: string;
    pitchDeckId?: string | null;
    note?: string | null;
  }): Promise<{ id: string }>;
}

export interface DiligenceService {
  listDiligenceMemos(input: { ventureId?: string; investorUserId?: string }): Promise<Array<{ id: string; title: string; status: string; updatedAt: Date }>>;
}

export interface ScoringService {
  computeFounderLaunchReadiness(userId: string): Promise<ScoreExplanation>;
  computeBuilderProofScore(userId: string): Promise<ScoreExplanation>;
  computeInvestorFitScore(input: { investorUserId: string; ventureId: string }): Promise<ScoreExplanation>;
}

export interface AdminRoutingService {
  assignBuilderToFounder(input: { adminUserId: string; founderUserId: string; builderUserId: string; note?: string }): Promise<void>;
  assignFounderToInvestor(input: { adminUserId: string; founderUserId: string; investorUserId: string; note?: string }): Promise<void>;
}

export interface IntegrationService {
  connectProvider(input: { userId: string; provider: IntegrationProvider }): Promise<void>;
}

