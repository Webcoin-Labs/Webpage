# Request and Data Flows

## 1) Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js App
    participant SB as Supabase Auth
    participant DB as App Database (Prisma)

    U->>FE: Open /login and choose provider
    FE->>SB: Start OAuth or magic link flow
    SB-->>FE: Redirect to /auth/callback with auth code
    FE->>SB: Exchange code for session
    FE->>DB: find/create User by supabaseAuthId or email
    DB-->>FE: Internal user record with role and onboarding state
    FE-->>U: Redirect to /app or /app/onboarding
```

## 2) Onboarding Continuation Flow

```mermaid
flowchart TD
    A["User enters /app"] --> B{"onboardingComplete?"}
    B -- yes --> C["Open role workspace dashboard"]
    B -- no --> D["Show dashboard warning banner"]
    D --> E["Complete Profile CTA"]
    E --> F["Resume onboarding from saved step"]
```

## 3) Integration Plugin Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Settings Plugin Center
    participant API as /api/integrations/connect/[provider]
    participant Provider as OAuth Provider
    participant CB as /api/integrations/callback/[provider]
    participant DB as IntegrationConnection

    U->>UI: Click Connect
    UI->>API: Start connect request
    API->>Provider: Redirect with state and callback URL
    Provider-->>CB: Return auth code
    CB->>Provider: Exchange code for token
    CB->>DB: Upsert IntegrationConnection (CONNECTED)
    CB-->>UI: Redirect with success state
```

## 4) Feed Publishing Guard Flow

```mermaid
flowchart LR
    A["Create Post Action"] --> B["Load current user and profile score"]
    B --> C{"meets minimum profile completion?"}
    C -- no --> D["Block action and return warning"]
    C -- yes --> E["Create FeedPost"]
    E --> F["Return success and revalidate feed"]
```

## 5) Connection Request Notification Flow

```mermaid
flowchart TD
    A["User sends connection request"] --> B["Persist request"]
    B --> C["Resolve recipient contact channel"]
    C --> D["Send notification email template"]
    D --> E["Audit event and UI notification"]
```

## 6) Startup and Venture Read Adapter Flow

```mermaid
flowchart LR
    Startup["Startup table"] --> Adapter["startup-hub adapter"]
    Venture["Venture table"] --> Adapter
    Adapter --> UI["Discovery cards and detail pages"]
```

This adapter keeps route compatibility while moving to canonical read models.
