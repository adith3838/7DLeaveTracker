export type PolicyProcessingStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED' | 'CANCELLED';
export type PolicyApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ARCHIVED';
export type PolicyPipelineStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PolicyPipelineStage {
    name: string;
    status: PolicyPipelineStageStatus;
}

export interface PolicyDocument {
    id: string;
    filename: string;
    title: string;
    policyType: string;
    version: string;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    processingStatus: PolicyProcessingStatus;
    processingStage: string;
    approvalStatus: PolicyApprovalStatus;
    uploadedBy: string | null;
    uploadedAt: string;
    updatedAt: string;
    processingStartedAt: string | null;
    processingCompletedAt: string | null;
    failureReason: string | null;
    extractedCharacters: number | null;
    chunksIndexed: number | null;
    pipeline: PolicyPipelineStage[];
}

export interface PolicyDocumentCounts {
    total: number;
    ready: number;
    processing: number;
    failed: number;
}

export interface PolicyDocumentPage {
    documents: PolicyDocument[];
    total: number;
    page: number;
    size: number;
    counts: PolicyDocumentCounts;
}

export interface PolicyUploadMetadata {
    title: string;
    policyType: string;
    version: string;
    effectiveFrom?: string;
    effectiveTo?: string;
}

export interface PolicyIngestionResult {
    documentId: string;
    chunksIndexed: number;
    processingStatus: PolicyProcessingStatus;
    approvalStatus: PolicyApprovalStatus;
}

export interface PolicyKnowledgeHealth {
    pgvectorAvailable: boolean;
    embeddingConfigured: boolean;
    chatConfigured: boolean;
    approvedEffectiveDocuments: number;
    operational: boolean;
}
