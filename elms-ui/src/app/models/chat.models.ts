export interface ChatRequest {
    conversationId: string | null;
    message: string;
}

export interface ChatSource {
    documentId: string;
    title: string;
    section: string | null;
    version: string;
}

export interface ChatResponse {
    conversationId: string;
    answer: string;
    intent: string;
    sources: ChatSource[];
    needsConfirmation: boolean;
    actionStatus: string;
}

export interface AiRuntimeStatus {
    enabled: boolean;
    chatModelConfigured: boolean;
    embeddingModelConfigured: boolean;
    vectorStoreConfigured: boolean;
}

export interface ChatMessage {
    role: 'USER' | 'ASSISTANT';
    content: string;
    sources?: ChatSource[];
}

export interface LeaveDraftRequest {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveDraftResponse {
    draftId: string;
    status: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveRequestId: number | null;
    message: string;
}
