CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS ai;

CREATE TABLE IF NOT EXISTS ai.policy_document (
    id UUID PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    policy_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    effective_from DATE,
    effective_to DATE,
    source_filename VARCHAR(255),
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ai_policy_dates CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
    ),
    CONSTRAINT chk_ai_policy_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_policy_document_version
    ON ai.policy_document (policy_type, version, content_hash);

CREATE TABLE IF NOT EXISTS ai.chat_conversation (
    id UUID PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_conversation_employee
    ON ai.chat_conversation (employee_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai.chat_message (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES ai.chat_conversation(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ai_chat_message_role CHECK (role IN ('USER', 'ASSISTANT'))
);

CREATE INDEX IF NOT EXISTS ix_ai_chat_message_conversation
    ON ai.chat_message (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS ai.leave_draft (
    id UUID PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(1000),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    expires_at TIMESTAMPTZ NOT NULL,
    leave_request_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ai_leave_draft_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_ai_leave_draft_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS ix_ai_leave_draft_employee
    ON ai.leave_draft (employee_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai.policy_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT,
    metadata JSON,
    embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS ix_ai_policy_vectors_embedding
    ON ai.policy_vectors USING HNSW (embedding vector_cosine_ops);
