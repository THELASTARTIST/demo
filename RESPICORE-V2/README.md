# RespiCore V.2

**Acoustic Respiratory Triage & Health Platform** — converts a 10-second cough recording into a clinical-grade analysis, detecting asthma, COPD, bronchitis, wheeze, and anomalous patterns with on-device AI inference. Now expanded with health tracking, family network, medication logs, and multi-platform deployment.

> Research prototype — not a clinical diagnostic device.

## Features

- **Live Triage Demo** — record audio via microphone, see real-time waveform visualization, and get instant 4-class classification results with a Mel-spectrogram output
- **Audio Analysis Pipeline** — silence trimming, spectral denoising, FFT-based feature extraction (centroid, flatness, rolloff, kurtosis, flux, RMS, band energies), and softmax classification (Normal, Anomalous, Wheeze, COPD / Bronchitis)
- **Dashboard** — health metrics tracking, past triage reports, medication history, and session charts
- **Health Metrics** — track sleep disruption, breathing exercises, personal baselines, and rescue inhaler usage
- **Family Network** — secure group settings, role management, SMS OTP verification, and profile access controls
- **Triage Reports Storage** — reports persisted to Supabase with user-level Row-Level Security
- **Medication Tracking** — log medications with timestamps and dosage records
- **Weekly Report Viewer** — aggregated health insights and trend summaries
- **Voice Biomarker Sparklines** — visual trends from acoustic analysis over time
- **Session Comparison** — side-by-side probability comparison between any two triage reports
- **About & Reviews** — multi-language project story (English, Hindi, Bengali), team info, and community review system with reply support
- **Responsive Design** — dark theme, mobile drawer navigation, bottom tab bar, glass-card UI
- **Offline-First** — audio analysis runs in-browser via Web Audio API, no model uploads
- **Cross-Platform** — Next.js web app + Electron desktop build (Windows NSIS) + Capacitor mobile (Android / iOS)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| UI | **React 19** with Server & Client Components |
| Styling | **Tailwind CSS 4** + custom CSS |
| Font | **Syne** (Google Fonts) |
| Auth | **Supabase Auth** (Google OAuth + Guest mode) |
| Database | **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) |
| Charts | **Recharts** |
| Audio | **Web Audio API** (AnalyserNode, OfflineAudioContext, MediaRecorder) |
| Visualization | **HTML Canvas** (waveform + Mel-spectrogram rendering) |
| Desktop | **Electron** (Windows NSIS installer) |
| Mobile | **Capacitor** (`capacitor/core`, `@capacitor/android`, `@capacitor/browser`) |
| SMS / OTP | **Twilio** (family network verification) |
| Security | `bcryptjs`, network-call suppression via middleware script |

## Pipeline Architecture

1. **Audio Capture** — mic input at 16 kHz, mono, 10-second window with real-time amplitude visualization
2. **Spectral Denoising** — noise floor sampling from first 500ms, spectral gate via STFT (signal < 2× noise zeroed), iSTFT reconstruction
3. **Feature Extraction** — zero-crossing rate, RMS energy, spectral centroid, flux, flatness, band energy distribution (low/mid/high/very-high), rolloff, kurtosis
4. **Classification** — deterministic multi-frame DCT-based feature scoring with temperature-scaled softmax normalization across 4 classes
5. **Risk Stratification & Report** — timestamped results with confidence scores, inference latency, waveform snapshot, and SQLite/Supabase persistence

## Expanded Health Features

- **Dashboard Pages**: `dashboard/page.tsx`, `DashboardClient.tsx`
- **Health Metrics**: `metrics`, `sleep-disruption`, `personal-baseline`, `rescue-inhaler-tracker`
- **Family Network**: `family-network/page.tsx`, `FamilyNetworkSettings`
- **Medication**: `medications-log`, `medication-history`, `medication-form`, `generate-prescription`
- **Reports & Export**: `export-csv`, `weekly-report`, `triage-trends-chart`, `voice-biomarker-sparklines`
- **Alerts & Exercises**: `alert-banner`, `breathing-exercise`

## Project Structure

```
respicore/
├── app/
│   ├── layout.tsx                  # Root layout (dark theme, Syne font, meta suppression script)
│   ├── page.tsx                    # Landing page (hero, triage, pipeline, tech, metrics, history)
│   ├── globals.css                 # Global styles
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Dashboard server component
│   │   │   └── DashboardClient.tsx # Client island
│   ├── about/page.tsx              # Multi-language (en / hi / bn) story page
│   ├── reviews/page.tsx            # Community reviews with replies
│   ├── family-network/page.tsx     # Group health settings
│   ├── api/
│   │   ├── triage-reports/route.ts
│   │   ├── health-metrics/route.ts
│   │   ├── medications/route.ts
│   │   ├── prescription/route.ts
│   │   ├── profiles/all/route.ts
│   │   ├── profiles/route.ts
│   │   ├── family-network/route.ts
│   │   ├── weekly-report/route.ts
│   │   ├── export/csv/route.ts
│   │   └── otp/route.ts
│   └── auth/callback/route.ts
├── components/
│   ├── auth/                       # LoginForm, SignupForm
│   ├── dashboard/                  # Metrics, charts, family, meds, alerts, exercises, reports
│   └── ui/                         # Button, Input
├── lib/
│   ├── alerts.ts
│   ├── baseline.ts
│   ├── inhaler_tracker.ts
│   ├── sleep_analysis.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   └── types/health.ts             # HealthMetric, MedicationLog, Profile types
├── sql/
│   ├── triage_reports.sql
│   ├── add_family_network_and_impact.sql
│   ├── add_family_network_role_otp.sql
│   ├── add_voice_biomarkers_and_medication_tracking.sql
│   └── add_waveform_to_triage_reports.sql
├── electron/
│   ├── main.js
│   └── preload.js
├── styles/
│   ├── globals.css
│   ├── landing.css
│   └── about.css
├── middleware.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── capacitor.config.json
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js 18+**
- A **Supabase project** with Auth enabled (Google OAuth provider configured)
- **Twilio account** (optional — only for SMS OTP / family network verification)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/THELASTARTIST/RESPICORE-V2.git
cd RESPICORE-V2/respicore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables — create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Cross-Platform Builds

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production web build |
| `npm run start` | Production server |
| `npm run lint` | Next.js linter |
| `npm run electron:dev` | Electron desktop (development) |
| `npm run electron:build` | Electron + build + NSIS package (Windows) |
| `npx cap sync` | Capacitor mobile sync |

## Database Schema

Core tables (managed via Supabase):

- `profiles` — user identity, avatar, role
- `triage_reports` — classification results, confidence, probabilities, waveform data, inference latency
- `health_metrics` — recorded health data per user
- `medications_log` — medication intake records
- `family_network` / `family_network_role_otp` — group settings and SMS verification
- `voice_biomarkers` — acoustic feature snapshots
- `waveform_data` — waveform arrays linked to reports

## Model Benchmarks

| Metric | Value |
|--------|-------|
| Accuracy | 89.2% (4-class, held-out test split) |
| AUC-ROC | 0.94 (macro-averaged, one-vs-rest) |
| Model Size | 4.2MB (INT8 quantized, vs 16.8MB float32) |
| Inference Latency | 38ms avg on Snapdragon 680 (P95 < 52ms) |

The underlying model is a MobileNetV2 backbone fine-tuned on the COUGHVID (EPFL, 25k samples) and Project Coswara (IISc) datasets.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/triage-reports` | POST | Save new triage report |
| `/api/health-metrics` | GET / POST | Health metric records |
| `/api/medications` | GET / POST | Medication logs |
| `/api/prescription` | POST | Generate prescription |
| `/api/profiles` | GET / PUT | User profile |
| `/api/profiles/all` | GET | List profiles |
| `/api/family-network` | GET / POST | Family group settings |
| `/api/weekly-report` | GET | Weekly aggregated report |
| `/api/export/csv` | GET | Export data to CSV |
| `/api/otp` | POST | SMS OTP verification |

## License

All rights reserved. This is a research prototype.
