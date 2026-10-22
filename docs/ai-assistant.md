# Leave assistant implementation

The first assistant implementation lives in `leave-service` and reuses its existing `LeaveService`, `HolidayRepository`, and PostgreSQL connection. It uses the existing ELMS JWT signing secret to authenticate AI endpoints; `employee.user_id` is resolved from the signed JWT user ID, and the linked employee primary key is used for leave data and conversation ownership. The AI API never accepts employee IDs from the client.

## Local setup

AI and policy ingestion are **disabled by default locally**, so they do not change the existing ELMS startup. If the HR screen shows “AI policy service is not enabled” or an upload returns 404, enable AI in the root `.env` and restart the backend:

1. Copy `.env.example` to `.env`; set `AI_ENABLED=true`, `AI_CHAT_PROVIDER=google-genai`, and `AI_EMBEDDING_PROVIDER=google-genai`. Put a newly generated Gemini Developer API key in `GOOGLE_API_KEY`. Both chat and embeddings use Gemini; embeddings are stored separately in a 768-dimensional pgvector table. Never commit `.env` or expose the key to Angular.
2. For Docker Compose, uncomment the three datasource overrides in `.env` so auth, employee, and leave services all use `jdbc:postgresql://postgres:5432/postgres`. The Compose Postgres image includes pgvector. If you instead run leave-service against your own host PostgreSQL, the database on port 5433 must have `vector`, `hstore`, and `uuid-ossp` extensions enabled. Pointing at the bundled DB is necessary if your host DB lacks pgvector.
3. Recreate/restart the services after changing `.env`; Spring reads these environment variables at startup. On a direct IDE run, set the same variables in the run configuration and use a PostgreSQL JDBC URL reachable from the host (for Compose's mapped port, `jdbc:postgresql://localhost:5434/postgres`).
4. When AI is enabled, Flyway baselines an existing ELMS schema at version 99 and runs the AI objects in V100 and policy lifecycle columns in V101. Back up any non-disposable database before enabling migrations.
5. Sign in as HR or Admin and open `/admin/ai-policies`. Uploading extracts and indexes the document; it stays a draft until explicitly approved. Only approved, effective policies can be used by employee RAG answers.

The Gemini key is optional while AI is disabled. Without a configured Gemini provider/key or indexed approved policies, policy questions return a safe fallback rather than inventing an answer.

## API

All routes below require `Authorization: Bearer <ELMS access token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/ai/chat` | Answer policy, balance, request-status, holiday questions; leave requests are directed to draft/confirm. |
| POST | `/api/v1/ai/leave-drafts` | Create a 20-minute draft from `{ "leaveType", "startDate", "endDate", "reason" }`. |
| POST | `/api/v1/ai/leave-drafts/{draftId}/confirm` | Explicitly confirm a draft; existing leave validations run again and repeat submission is rejected. |
| GET | `/api/v1/ai/admin/policies/health` | HR/ADMIN checks pgvector extension, configured model beans, and effective approved policy count. |
| GET | `/api/v1/ai/admin/policies` | HR/ADMIN list with optional `search`, `processingStatus`, `approvalStatus`, `policyType`, `page`, and `size` parameters; returns persisted counts and server-side pagination. |
| GET | `/api/v1/ai/admin/policies/{documentId}` | HR/ADMIN fetch document metadata, current processing stage, pipeline status, metrics and safe error summary. |
| POST | `/api/v1/ai/admin/policies/ingest` | HR/ADMIN multipart upload: `file`, `title`, `policyType`, `version`, optional ISO dates `effectiveFrom` and `effectiveTo`. Each request accepts one PDF, DOCX, or TXT file, up to 10 MB. |
| PATCH | `/api/v1/ai/admin/policies/{documentId}/approval` | HR/ADMIN approve a successfully indexed, non-expired policy. |
| POST | `/api/v1/ai/admin/policies/{documentId}/archive` | HR/ADMIN archive a policy so it is excluded from RAG retrieval. |

Chat conversations and messages are persisted in the `ai` schema. Conversation IDs are checked against the signed-in employee. Policy answers retrieve only successfully indexed, approved, currently effective policies, selecting the latest effective version per policy type, and return source metadata. Ingestion runs synchronously; persisted stages describe only the current recorded stage, and embedding generation plus pgvector persistence are one combined Spring AI operation. The original binary is not persisted, per-stage timestamps are not recorded, and no retry or download endpoint exists; after a failure, re-upload the file. Add malware scanning and operational extraction limits before accepting untrusted production documents.

## Production notes

- Apply/verify Flyway V100 as part of a controlled deployment and ensure the production PostgreSQL provider supports pgvector and the needed extensions. `initialize-schema` is disabled so Flyway owns the vector table.
- All services that validate ELMS JWTs must use the same strong `JWT_SECRET`. The leave-service production profile requires it.
- Set `SPRING_PROFILES_ACTIVE=prod`, `AI_CHAT_PROVIDER=google-genai`, `AI_EMBEDDING_PROVIDER=google-genai`, a secret `GOOGLE_API_KEY`, supported Gemini model IDs, and the production PostgreSQL/Kafka/CORS settings. Store the key in the deployment secret manager.
- Restrict policy ingestion to approved administrators; formal document approval workflow, virus scanning, retention controls, rate limiting, and model budget monitoring remain deployment/product responsibilities.
- Leave drafts are confirmed in a transaction through the existing leave application service. For robust Kafka delivery tied to the DB commit, replace direct event publication with a transactional outbox.
- Configure Gemini data controls/privacy to match HR policy; never send unnecessary sensitive employee data in prompts.