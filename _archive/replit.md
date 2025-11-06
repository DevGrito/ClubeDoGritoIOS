# Overview

Clube do Grito is an educational management and social impact platform designed for Instituto O Grito. It provides tailored functionalities for students, teachers, council members, administrators, and donors. The platform streamlines student enrollments, tracks educational activities, manages financial donations and event ticket sales, and generates detailed social impact reports for programs like Casa Sonhar and Polo Esportivo Cultural. Its primary goal is to enhance the institute's educational and social initiatives, optimize operations, and offer comprehensive insights into their impact.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Design Principles
- **Monorepo Structure**: Shared schema between client and server for consistency.
- **Role-Based Access Control**: Granular permissions for different user types (Leo Martins, Teachers, Students, Council Members, Developers).
- **Progressive Web App (PWA)**: Offline capabilities, mobile optimization, and native app-like experience.

## Frontend
- **Framework**: React with TypeScript using Vite.
- **Styling**: Tailwind CSS with Shadcn/UI for a consistent and accessible design.
- **UI Components**: Radix UI primitives.
- **Routing**: Client-side routing with role-based access.
- **State Management**: Local storage for authentication and user sessions.

## Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM for type-safe interactions.
- **API Design**: RESTful endpoints with role-based authorization.
- **Authentication**: Phone-based with SMS verification.
- **File Uploads**: Support for profile pictures and document uploads.

## Database
- **Primary Database**: Digital Ocean PostgreSQL.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Entities**: Users (students, teachers, administrators), educational programs, attendance, financial data, impact metrics, and documents.
- **Student Sharing**: Link tables (`psico_inclusao_vinculo`, `psico_pec_vinculo`) enable tracking students across multiple programs (e.g., Inclusão Produtiva, Psicossocial, PEC).

## Key Features
- **Ticket System**: Digital tickets with QR codes, Stripe integration, and phone-based search with automatic normalization. Includes corporate ticket quota management.
- **Report Export**: Generation and export of reports to Google Slides (as PDF) using dynamic data population.
- **Inclusion Productivity Management**: Systems for managing participants and hierarchical courses.
- **Gestão à Vista Dashboard**: Real-time performance indicators with 12 key metrics, dynamic aggregation of data from various program dashboards, and visual progress indicators.
- **Stripe Subscription Management**: Comprehensive lifecycle management for recurring subscriptions, including webhook handlers, reactivation flows, 3DS authentication, and automated reconciliation and dunning jobs. An administrative interface is provided for monitoring and managing subscriptions and billing events.
- **Auction Analytics (Oct 16, 2025)**: Enhanced `/api/leiloes-detalhes` endpoint provides comprehensive donor participation data:
  - Complete list of all confirmed donors (`doadores.status = 'paid'`)
  - Participation indicators (`participandoLeiloes`: boolean flag)
  - Leadership tracking (`liderEmLeiloes`: array of auctions where donor has highest bid)
  - Per-donor statistics (`totalLiderados`: count of auctions leading)
  - Auction details with participant lists and leader information
- **Custom Contribution Flow (Oct 16, 2025)**: Flexible donation system with custom values and periodicity
  - **Endpoint**: POST `/api/checkout/subscribe`
  - **Features**:
    - Free value input with preset options (R$ 35, 50, 60, 80, 100, 150, 200)
    - Periodicity selection (Monthly, Quarterly, Semi-annual, Annual)
    - Real-time total calculation (monthly value × period months)
    - Value range: R$ 35.00 to R$ 50,000.00
    - **Recurring subscription** - automatic monthly/quarterly/semi-annual/annual billing
    - Shows period summary with recurring payment indicator
  - **UI**: Purple-themed modal with preset buttons and segmented periodicity selector
  - **Validation**: Server-side validation for amount range and periodicity (1, 3, 6, 12 months)
  - **Payment**: Stripe Checkout in `subscription` mode (recurring charges)
  - **Metadata**: Stores `tier`, `amountMonthly`, `intervalMonths`, `customSubscription` in Stripe session metadata
  - **Billing**: Stripe handles automatic recurring charges based on selected interval

# External Dependencies

## Communication
- **Twilio**: SMS verification.
- **WhatsApp Integration**: Planned.

## Payment Processing
- **Stripe**: Payment gateway for donations and recurring subscriptions, including React Stripe.js and a robust subscription management module with webhooks.
- **PagBank Connect (Oct 21, 2025)**: Modern payment gateway for event ticket purchases only
  - **Migration**: Replaced deprecated PagSeguro API v2 (discontinued June 30, 2025)
  - **Service**: `server/services/pagBankConnectService.ts` - Centralized PagBank Connect interactions
  - **Payment Methods**: Credit card (tokenized via SDK) and PIX
  - **Backend Endpoints**:
    - GET `/api/pagbank/integration-key` - Provides Integration Key for card tokenization on front-end
    - POST `/api/pagbank/card-payment` - Processes card payments with tokenized card data
    - POST `/api/pagbank/pix-payment` - Generates PIX QR codes
    - POST `/api/pagbank/webhook` - Receives payment notifications
  - **Frontend Integration**:
    - **Component**: `PagBankConnectPaymentModal` (lines 160-596 in `client/src/pages/pagamento-ingresso.tsx`)
    - **SDK Integration**: PagBank Connect JavaScript SDK loaded globally in `client/index.html`
    - **Card Tokenization**: Uses `window.PagSeguro.encryptCard()` for client-side encryption before transmission
    - **Payment Flow States**:
      - `escolher-metodo`: User selects between Credit Card or PIX
      - `form-cartao`: Collects encrypted card data (number, CVV, expiry, holder)
      - `form-pix`: Generates PIX QR code with expiration timer
      - `processando`: Shows loading state during payment processing
      - `sucesso`/`erro`: Final confirmation states with appropriate messaging
    - **UI Features**:
      - Real-time card number formatting with brand detection (Visa, Mastercard, etc.)
      - Countdown timer for PIX expiration (15 minutes)
      - Responsive design with yellow-themed buttons matching site branding
      - Error handling with user-friendly messages
    - **Integration Point**: Triggered via `setEtapa('pagamento-pagbank')` in main payment flow
  - **Security**: Two-tier authentication
    - `PAGBANK_INTEGRATION_KEY`: Public key for front-end SDK tokenization
    - `PAGBANK_ACCESS_TOKEN`: Private Bearer token for back-end API calls
  - **Environment**: Sandbox/Production support via NODE_ENV
  - **Webhook URL**: https://clubedogrito.institutoogrito.com.br/api/pagseguro/webhook
  - **Status Mapping**: Maps PagBank statuses (PAID, AUTHORIZED, DECLINED, etc.) to internal ticket statuses
  - **Scope**: ONLY ticket purchases; all other payments remain on Stripe
  - **Legacy Support**: Old PagSeguro v2 modal (`PagSeguroPaymentModal`) retained for backward compatibility but not actively used

## File Storage
- **Google Cloud Storage (GCS)**: Primary cloud storage solution (bucket: `clubedogrito`, project: infra-optics-454414-g5)
  - **Benefits Images (Oct 16, 2025)**: Automated upload system for benefit program images
    - POST `/api/beneficios/:id/imagem` - Upload endpoint (admin-only, 5MB limit)
    - Supports `card` and `detalhes` image types (JPEG, PNG, GIF, WebP)
    - Storage: `public/uploads/beneficios/beneficio-{id}-{tipo}-{timestamp}.{ext}`
    - URLs: `https://storage.googleapis.com/clubedogrito/{path}`
    - Database: Saves URLs in `beneficio_imagens.caminho_completo` + `beneficios.imagem` (card only)
    - Auto-replaces previous images of same type
    - **Permission Fix (Oct 16, 2025)**: All uploads now explicitly call `file.makePublic()` after save
      - Fixes: 403 Forbidden errors on newly uploaded images
      - Both `uploadToGCS()` and `uploadBase64ImagesToGCS()` now ensure public access
      - Admin endpoint: POST `/api/admin/beneficios/fix-permissions` (auth required)
        - Retroactively applies public permissions to existing GCS images
        - Returns detailed status report with success/error counts
        - Usage: Call this endpoint to fix existing images that return 403
  - **Mission Evidence**: Base64 image upload for mission completion proofs
  - **Authentication**: Service account via `gcs-service-account.json` (excluded from git)
- **Uppy**: File upload UI components
- **AWS S3**: Deprecated (replaced by GCS)

## UI/Design
- **Lucide Icons**: Iconography.
- **Lottie**: Animations.
- **Google Fonts**: Inter font family.

## Development & Deployment
- **Neon Database**: Serverless PostgreSQL.
- **Docker**: Containerization.

## Third-Party Integrations
- **Google Slides API / Google Drive API**: For report generation.
- **Brazilian Data Standards**: IBGE classifications, CEP validation.
- **Educational/Government Programs**: SCFV compliance, Bolsa Família integration.