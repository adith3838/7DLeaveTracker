# Local and production configuration

Configuration is kept out of production builds and supplied at runtime. Do not copy the sample secrets below into production.

## Local development

- Backend services default to the `local` Spring profile, localhost PostgreSQL on port `5433`, and the existing service ports.
- For services started directly from the host, set `SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092` when using the Compose Kafka broker. Docker Compose supplies `kafka:29092` to containers.
- Docker Compose values can be overridden through a root `.env` file. Start from `.env.example`; the sample values preserve the current development settings. The Compose backend still expects the host PostgreSQL instance on port `5433` by default.
- The Angular dev server loads `elms-ui/src/assets/app-config.json`, retaining the existing local API URLs. Set API URL variables there if local service ports differ.

## Production backend

Set `SPRING_PROFILES_ACTIVE=prod` for every service. The production profile deliberately requires deployment-supplied values for database connection fields, the auth JWT secret, CORS origins, Kafka bootstrap servers, and notification SMTP/recipient settings. Do not deploy with the `local` profile or sample `.env.example` values.

Required values by service:

| Service | Required environment variables |
| --- | --- |
| Auth | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` |
| Employee | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` |
| Leave | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_KAFKA_BOOTSTRAP_SERVERS`, `JWT_SECRET`, `GOOGLE_API_KEY`, `CORS_ALLOWED_ORIGINS` |
| Notification | `SPRING_KAFKA_BOOTSTRAP_SERVERS`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_MANAGER_TO`, `MAIL_EMPLOYEE_TO` |

Optional overrides include `SERVER_PORT`, `SPRING_JPA_HIBERNATE_DDL_AUTO` (defaults to `validate` in production), JWT expiry values, `AI_CHAT_PROVIDER=google-genai`, `AI_EMBEDDING_PROVIDER=google-genai`, `GEMINI_CHAT_MODEL`, and `GEMINI_EMBEDDING_MODEL`. Gemini handles chat and 768-dimensional embeddings stored in its dedicated pgvector table. Kafka defaults to `SASL_SSL` with `PLAIN`; set `KAFKA_SECURITY_PROTOCOL`, `KAFKA_SASL_MECHANISM`, and `KAFKA_SASL_JAAS_CONFIG` to match the broker provider (for TLS-only brokers, set the protocol to `SSL`). Put secrets in the deployment platform's secret store, not in source control. The included Compose Kafka is a single-node development broker, not a production Kafka deployment.

The recipient addresses are configurable, but are still one configured manager and one configured employee address. For per-user production notifications, add recipient email addresses to the event or resolve them from the employee service instead of relying on these shared settings.

## Production frontend

Build with `npm run build -- --configuration production`. Before publishing, replace `elms-ui/dist/elms-ui/browser/assets/app-config.json` with the deployment's API base URLs. For a same-origin reverse proxy, `docs/app-config.production.example.json` is a starting point; for separate API hosts, set each URL to its corresponding public API base. This file is fetched at application startup, so API endpoint changes do not require rebuilding the JavaScript bundle. Production startup rejects missing URLs and localhost URLs.

The values in this JSON are public API addresses, not secrets. Route `/api/v1` to the correct backend service(s) through a gateway/reverse proxy; otherwise use distinct service URLs. Ensure the production backend's `CORS_ALLOWED_ORIGINS` includes the exact frontend origin when cross-origin requests are used.

See [ai-assistant.md](ai-assistant.md) for AI feature local setup, endpoints, pgvector requirements, and production considerations.