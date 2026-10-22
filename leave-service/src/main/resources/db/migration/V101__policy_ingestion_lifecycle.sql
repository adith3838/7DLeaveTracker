ALTER TABLE ai.policy_document
    ADD COLUMN IF NOT EXISTS processing_status VARCHAR(30) NOT NULL DEFAULT 'READY',
    ADD COLUMN IF NOT EXISTS processing_stage VARCHAR(40) NOT NULL DEFAULT 'READY',
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(320),
    ADD COLUMN IF NOT EXISTS extracted_characters INTEGER,
    ADD COLUMN IF NOT EXISTS chunks_indexed INTEGER,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

ALTER TABLE ai.policy_document
    DROP CONSTRAINT IF EXISTS chk_ai_policy_processing_status,
    DROP CONSTRAINT IF EXISTS chk_ai_policy_processing_stage,
    DROP CONSTRAINT IF EXISTS chk_ai_policy_approval_status;

ALTER TABLE ai.policy_document
    ADD CONSTRAINT chk_ai_policy_processing_status
        CHECK (processing_status IN ('QUEUED', 'PROCESSING', 'READY', 'FAILED', 'CANCELLED')),
    ADD CONSTRAINT chk_ai_policy_processing_stage
        CHECK (processing_stage IN ('UPLOADING', 'EXTRACTING_TEXT', 'CHUNKING', 'INDEXING', 'READY', 'FAILED')),
    ADD CONSTRAINT chk_ai_policy_approval_status
        CHECK (approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ARCHIVED'));

UPDATE ai.policy_document
SET processing_status = CASE WHEN status = 'PUBLISHED' THEN 'READY' ELSE 'FAILED' END,
    processing_stage = CASE WHEN status = 'PUBLISHED' THEN 'READY' ELSE 'FAILED' END,
    approval_status = CASE WHEN status = 'ARCHIVED' THEN 'ARCHIVED' ELSE 'DRAFT' END,
    processing_completed_at = updated_at;

CREATE INDEX IF NOT EXISTS ix_ai_policy_document_status_date
    ON ai.policy_document (processing_status, approval_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS ix_ai_policy_document_type_date
    ON ai.policy_document (policy_type, updated_at DESC);