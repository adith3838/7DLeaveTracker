CREATE TABLE IF NOT EXISTS ai.policy_vectors_gemini (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT,
    metadata JSON,
    embedding VECTOR(768)
);

CREATE INDEX IF NOT EXISTS ix_ai_policy_vectors_gemini_embedding
    ON ai.policy_vectors_gemini USING HNSW (embedding vector_cosine_ops);