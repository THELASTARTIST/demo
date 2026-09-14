'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Chart,
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

/* ────────────────────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────────────────────── */

interface NodeMetric {
  0: string;
  1: string;
}

interface NodeDetail {
  title: string;
  body: string;
  metrics: [string, string][];
}

const NODE_DATA: Record<string, NodeDetail> = {
  public: {
    title: 'General public',
    body: 'The top of the funnel. Anyone with a smartphone can run a free rapid screening in under 30 seconds — no signup friction, no hardware to buy. This is the volume engine that builds trust and word-of-mouth ahead of any paid tier.',
    metrics: [['Acquisition cost', '~$0'], ['Conversion to Pro', '~4–6%'], ['Time to first result', '<30s']],
  },
  chronic: {
    title: 'Chronic illness users',
    body: 'COPD and asthma patients need trend lines, not one-off snapshots. This segment is the natural upgrade path into the $4.99/mo Pro tier, where longitudinal tracking and flare-up early warning justify recurring payment.',
    metrics: [['Target ARPU', '$4.99/mo'], ['Retention driver', 'Trend tracking'], ['LTV multiple', '~8–10x CAC']],
  },
  clinicians: {
    title: 'Clinicians',
    body: "Primary-care and rural clinicians use RespiCore as a triage aid — a second opinion when a physical stethoscope or specialist referral isn't available. This relationship is the seed for hospital EMR integration deals.",
    metrics: [['Primary use', 'Triage support'], ['Sales motion', 'Land via pilot ward'], ['Path to', 'EMR contract']],
  },
  publichealth: {
    title: 'Public health bodies',
    body: "Municipal health departments and NGOs license the aggregated, anonymized surveillance dashboard to spot respiratory outbreak clusters early — without ever seeing an individual patient's raw data.",
    metrics: [['Data granularity', 'Aggregated only'], ['Contract type', 'Annual license'], ['Deployment', 'Low-bandwidth mobile field kits']],
  },
  edgeai: {
    title: 'Cloud AI engine',
    body: 'A Mel-spectrogram front-end feeds a quantized classifier hosted on an optimized cloud inference endpoint — sub-50ms round trip on standard mobile connectivity. This single hosted model powers every downstream product and channel, so the R&D cost is paid once.',
    metrics: [['Model size', '4.2 MB'], ['Inference time', '<50ms round trip'], ['Marginal cost / run', '$0.003']],
  },
  sandbox: {
    title: 'Secure cloud data pipeline',
    body: 'Audio is streamed over an encrypted TLS connection for inference and is never persisted — only the derived triage result is written back to the device. This zero-retention design turns a privacy requirement into a sales argument for hospitals and NGOs alike.',
    metrics: [['Audio retention', '0 seconds (transient)'], ['Transit encryption', 'TLS 1.3'], ['Compliance surface', 'Reduced']],
  },
  b2c: {
    title: 'B2C direct app',
    body: 'Freemium screening drives downloads; the $4.99/mo Pro tier monetizes chronic-illness users who want history and trend graphs. This channel is the adoption flywheel — proof at real-world scale that feeds every enterprise sales conversation.',
    metrics: [['Free → Pro conversion', '~5%'], ['Gross margin', '>85%'], ['Role', 'Trust & validation']],
  },
  sdk: {
    title: 'B2B telehealth SDK',
    body: 'Telemedicine platforms embed the RespiCore SDK to add acoustic triage without building ML in-house. Priced per API call or on a tiered monthly plan, this is the most predictable recurring line in the model.',
    metrics: [['Pricing', '$0.03/call or tiered'], ['Integration time', '2–4 weeks'], ['Revenue type', 'Recurring, usage-linked']],
  },
  emr: {
    title: 'Hospital EMR integration',
    body: 'FHIR-native triage data flows directly into hospital electronic medical records, with priority alert routing for high-risk classifications. This is the highest average contract value tier, sold on a per-facility license.',
    metrics: [['Avg. license', '$18k/yr'], ['Sales cycle', '3–6 months'], ['Standard', 'FHIR']],
  },
  surveillance: {
    title: 'Enterprise surveillance dashboard',
    body: 'Anonymized, aggregated screening trends across a region give public health agencies an early warning signal for respiratory outbreaks — without any individual patient data ever being centralized.',
    metrics: [['Data shared', 'Aggregated only'], ['Buyer', 'Municipal / NGO'], ['Contract term', 'Annual']],
  },
};

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_DATA: Record<string, FaqItem[]> = {
  'Clinical & Sound Capture': [
    {
      q: 'Why do I only need to record a cough instead of continuous breathing or speech?',
      a: 'A forced cough excites the same airway resonances a stethoscope listens for, concentrating the most diagnostically relevant acoustic information into a short, high-energy burst. A few cough cycles carry comparable classification signal to a much longer breathing or speech sample, while being faster and far more consistent to capture across users.',
    },
    {
      q: 'Can the model detect specific infections like COVID-19, Tuberculosis, or Pneumonia?',
      a: "No. RespiCore classifies acoustic patterns into broad triage categories — such as normal, wheeze-like, or crackle-like — not specific pathogens. Distinguishing between COVID-19, TB, and pneumonia requires clinical tests such as PCR, imaging, or sputum culture that acoustic signatures alone can't replace; the app's job is to flag when follow-up is warranted, not to name a disease.",
    },
    {
      q: 'If the triage output returns "Normal", does that guarantee complete respiratory health?',
      a: 'No. A "Normal" result means no acoustic anomaly was detected in that specific recording — it isn\'t a clean bill of health. Early-stage conditions or issues with no audible signature can still be present. The tool is a screening aid, and persistent symptoms should always be followed up with a clinician regardless of the result.',
    },
    {
      q: 'Can this screening tool be used reliably on infants and young children?',
      a: 'Not currently. The model is trained and validated on adult and adolescent cough and breath data; infant and pediatric airways produce acoustics that differ meaningfully in pitch and resonance, so accuracy hasn\'t been established for that population. Pediatric-specific training data is on the roadmap before that use case is supported.',
    },
    {
      q: 'Why is a 10-second recording window necessary for acoustic classification?',
      a: "Ten seconds reliably captures two to four full cough or breath cycles, including the onset and decay transients where much of the diagnostic spectral detail lives. It's long enough for the model to work with, while short enough to keep user compliance high and cloud processing quick.",
    },
  ],
  'Environment & Setup': [
    {
      q: 'Do I need to be in a completely silent room to take the test?',
      a: 'No, but a reasonably quiet environment improves reliability. Background noise like traffic, fans, or conversation can mask parts of the spectral signature the model relies on. The app runs a quick ambient noise-floor check before recording and will prompt you if the environment is too loud.',
    },
    {
      q: 'How far should the smartphone microphone be held from the mouth during a recording?',
      a: "Roughly 15–20 cm, about the width of a hand, is recommended — close enough for a strong signal-to-noise ratio without the microphone clipping or saturating from the cough's peak volume.",
    },
    {
      q: 'Is a dedicated digital stethoscope or external hardware add-on required?',
      a: 'No — this is a core design constraint, not an afterthought. RespiCore is built to work with the standard microphone already in any smartphone, deliberately avoiding proprietary hardware dependencies that would limit reach and add cost.',
    },
    {
      q: 'Will ambient echoes or room acoustics interfere with the spectral analysis?',
      a: "Highly reverberant spaces, like empty halls or bathrooms, can slightly smear the transient features of a cough, but the model's Mel-spectrogram preprocessing tolerates moderate reverb reasonably well. Very noisy or highly reflective environments are caught by the pre-recording noise check before the test begins.",
    },
  ],
  'Cloud AI & Privacy': [
    {
      q: 'How does the machine learning model run when it depends on an internet connection?',
      a: 'The classifier is hosted on an optimized cloud inference endpoint. Audio is captured on the phone, sent over an encrypted TLS connection, and processed on the server, with the triage result returned in well under a second on a typical mobile connection.',
    },
    {
      q: 'Are raw cough audio recordings ever uploaded, stored, or transmitted to the cloud?',
      a: "Yes — audio is transmitted securely to the cloud for inference, since that's where classification happens. It's processed transiently in server memory purely to generate a result and isn't persisted afterward; only the derived triage result, not the raw recording, is saved back to the device.",
    },
    {
      q: 'What happens to my local triage history if I clear app storage or lose my device?',
      a: "History is written to local storage on the device after each cloud inference call, so clearing app data or losing the phone erases it — there's no account-linked backup to recover from by default. It's worth backing up exported reports separately if history matters to you.",
    },
    {
      q: 'How does the app ensure patient anonymity without collecting personal identifiers?',
      a: "Reports and inference requests are keyed only to a randomly generated local UUID and a timestamp — no name, age, phone number, or location is ever requested or stored. There's simply no personally identifying data collected in the first place, so there's nothing to anonymize after the fact.",
    },
  ],
  'Accuracy & Usability': [
    {
      q: "Will a person's vocal pitch, dialect, or accent affect the accuracy of the triage?",
      a: 'The classifier works on cough and breath acoustics, not on speech content, so dialect and accent — which are speech phenomena — have no direct bearing on the result. Natural variation in cough pitch is part of what the training data already spans, though extreme outliers may see slightly reduced confidence.',
    },
    {
      q: 'How are confidence scores and classification probabilities calculated in real time?',
      a: 'The model produces a softmax probability across its trained classes in the same forward pass used for classification; the reported confidence score is simply the highest of those probabilities. This adds no meaningful extra latency beyond the classification itself.',
    },
    {
      q: 'Can the model differentiate between a dry cough and a productive (wet) cough?',
      a: 'Yes — dry and wet coughs carry measurably different spectral and temporal signatures, with wet coughs showing more low-frequency, moisture-related acoustic texture. That distinction is one of the features the model learns to separate during training.',
    },
    {
      q: 'What should a user do if the app indicates an anomalous or high-risk pattern?',
      a: 'The app directs them toward an in-person clinical evaluation. The result is explicitly framed as a prompt to see a doctor, never as a diagnosis or a treatment recommendation, and the app makes no medication or care suggestions of its own.',
    },
  ],
  'Business Model & Go-To-Market': [
    {
      q: 'How does the lean cloud architecture protect margins?',
      a: 'Because the classifier runs on a small, optimized inference endpoint rather than a heavyweight generic ML API, RespiCore keeps GPU time, bandwidth, and storage costs per screening low. Whether it\'s 1,000 screenings or 1,000,000, the marginal cloud cost stays a fraction of a cent, so most of every dollar of B2C or B2B revenue converts to gross margin instead of funding server bills.',
    },
    {
      q: 'How does monetization work in low-connectivity rural health camps?',
      a: 'Because each screening needs only a brief, low-bandwidth API call, the app works well even on intermittent mobile connections in the field — monetization there comes through upfront NGO or public-health licensing rather than per-use billing, with aggregated, anonymized outbreak metrics syncing whenever connectivity is available.',
    },
    {
      q: 'What is the B2B integration timeline for hospital EMRs?',
      a: "A typical rollout runs sandbox FHIR mapping and pilot-ward testing in the first one to two months, followed by a phased ward-by-ward go-live over the next quarter, and full EMR-integrated triage alerting by month six — timelines vary with each hospital's existing FHIR maturity.",
    },
  ],
  'Regulatory & Clinical Compliance': [
    {
      q: 'What is the regulatory roadmap — wellness tool vs SaMD / FDA Class II?',
      a: 'RespiCore launches as a general wellness and triage-support tool, explicitly not a diagnostic device, which keeps it outside FDA Software-as-a-Medical-Device (SaMD) jurisdiction at launch. The enterprise and hospital EMR tiers are the path toward a Class II SaMD submission, pursued once clinical validation data and a quality management system are in place — regulatory weight is added only where the revenue tier demands it.',
    },
    {
      q: 'How are training datasets (COUGHVID, Coswara, ICBHI) used legally and clinically?',
      a: 'These are publicly released, de-identified research datasets made available specifically for respiratory acoustic research, and RespiCore uses them only for model training under their published research terms — no raw dataset audio is redistributed in the shipped app, only the resulting model weights. Clinically, they provide the labeled diversity of coughs and breath sounds needed to generalize beyond any single population.',
    },
  ],
  'Defensibility & Competitive Moat': [
    {
      q: 'What prevents competitors from copying the cloud-hosted model?',
      a: 'The model architecture is straightforward to describe, but the moat is the curated, labeled dataset pipeline and the months of training iteration behind the 89.2% accuracy figure — that data-and-tuning loop compounds with every new deployment and is far harder to replicate than the inference code itself. Distribution relationships with telehealth platforms and hospitals add a second, slower-to-copy layer.',
    },
  ],
};

const FAQ_CATEGORIES = Object.keys(FAQ_DATA);

/* ────────────────────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────────────────────── */

export default function RespiCoreBusinessModel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const flowDetailRef = useRef<HTMLDivElement>(null);
  const fdTitleRef = useRef<HTMLDivElement>(null);
  const fdBodyRef = useRef<HTMLDivElement>(null);
  const fdMetricsRef = useRef<HTMLDivElement>(null);

  const faqCatTriggerRef = useRef<HTMLButtonElement>(null);
  const faqCatLabelRef = useRef<HTMLSpanElement>(null);
  const faqCatMenuRef = useRef<HTMLDivElement>(null);
  const faqListRef = useRef<HTMLDivElement>(null);

  const marginCanvasRef = useRef<HTMLCanvasElement>(null);
  const revCanvasRef = useRef<HTMLCanvasElement>(null);
  const marginChartRef = useRef<Chart | null>(null);
  const revChartRef = useRef<Chart | null>(null);

  const b2cSliderRef = useRef<HTMLInputElement>(null);
  const entSliderRef = useRef<HTMLInputElement>(null);
  const b2cValRef = useRef<HTMLElement>(null);
  const entValRef = useRef<HTMLElement>(null);
  const arrTotalRef = useRef<HTMLDivElement>(null);
  const bdB2cRef = useRef<HTMLElement>(null);
  const bdEntRef = useRef<HTMLElement>(null);
  const bdSdkRef = useRef<HTMLElement>(null);

  const activeFaqCategoryRef = useRef<string>(FAQ_CATEGORIES[0]);

  /* ── formatting helper ── */
  const fmtMoney = (n: number): string => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + Math.round(n);
  };

  /* ── particles ── */
  useEffect(() => {
    const container = particleContainerRef.current;
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left:${Math.random() * 100}%;
        --dx:${(Math.random() - 0.5) * 60}px;
        animation-duration:${6 + Math.random() * 8}s;
        animation-delay:${Math.random() * 6}s;
        width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;
        opacity:0;
      `;
      container.appendChild(p);
    }
    return () => {
      container.innerHTML = '';
    };
  }, []);

  /* ── scroll reveal observer ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const el = entry.target as HTMLElement;
            if (el.id === 'chart1' && !el.dataset.drawn) {
              el.dataset.drawn = '1';
              setTimeout(drawMarginChart, 150);
            }
            if (el.id === 'chart2' && !el.dataset.drawn) {
              el.dataset.drawn = '1';
              setTimeout(drawRevChart, 150);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    root
      .querySelectorAll('.flow-node,.rev-card,.arr-calc,.chart-card,.moat-table-wrap,.faq-item')
      .forEach((el) => obs.observe(el));

    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── flow node click handling ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>('.flow-node');

    const handlers: { el: HTMLElement; fn: () => void }[] = [];

    nodes.forEach((node) => {
      const fn = () => {
        const key = node.dataset.node || '';
        const d = NODE_DATA[key];
        if (!d) return;
        const alreadyActive = node.classList.contains('active');
        nodes.forEach((n) => n.classList.remove('active'));

        if (alreadyActive) {
          flowDetailRef.current?.classList.remove('open');
          return;
        }
        node.classList.add('active');
        if (fdTitleRef.current) fdTitleRef.current.innerHTML = d.title;
        if (fdBodyRef.current) fdBodyRef.current.innerHTML = d.body;
        if (fdMetricsRef.current) {
          fdMetricsRef.current.innerHTML = d.metrics
            .map((m) => `<div class="fd-metric">${m[0]}<b>${m[1]}</b></div>`)
            .join('');
        }
        flowDetailRef.current?.classList.add('open');
      };
      node.addEventListener('click', fn);
      handlers.push({ el: node, fn });
    });

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    };
  }, []);

  /* ── ARR calculator ── */
  useEffect(() => {
    const update = () => {
      const b2cUsers = parseInt(b2cSliderRef.current?.value || '0', 10);
      const entLicenses = parseInt(entSliderRef.current?.value || '0', 10);

      if (b2cValRef.current) b2cValRef.current.textContent = b2cUsers.toLocaleString();
      if (entValRef.current) entValRef.current.textContent = entLicenses.toLocaleString();

      const b2cArr = b2cUsers * 4.99 * 12;
      const entArr = entLicenses * 18000;
      const baseArr = b2cArr + entArr;
      const sdkArr = baseArr * (0.15 / 0.85); // SDK modeled as ~15% of total mix
      const totalArr = baseArr + sdkArr;

      if (arrTotalRef.current) arrTotalRef.current.textContent = fmtMoney(totalArr);
      if (bdB2cRef.current) bdB2cRef.current.textContent = fmtMoney(b2cArr);
      if (bdEntRef.current) bdEntRef.current.textContent = fmtMoney(entArr);
      if (bdSdkRef.current) bdSdkRef.current.textContent = fmtMoney(sdkArr);
    };

    const b2cSlider = b2cSliderRef.current;
    const entSlider = entSliderRef.current;
    b2cSlider?.addEventListener('input', update);
    entSlider?.addEventListener('input', update);
    update();

    return () => {
      b2cSlider?.removeEventListener('input', update);
      entSlider?.removeEventListener('input', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── FAQ dropdown + accordion ── */
  const renderFaqList = () => {
    const list = faqListRef.current;
    if (!list) return;
    const items = FAQ_DATA[activeFaqCategoryRef.current];

    list.innerHTML = items
      .map(
        (item, i) => `
      <div class="faq-item visible${i === 0 ? ' open' : ''}">
        <div class="faq-q"><span>${item.q}</span>
          <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></div>
        <div class="faq-a"><div class="faq-a-inner">${item.a}</div></div>
      </div>
    `
      )
      .join('');

    list.querySelectorAll<HTMLElement>('.faq-item').forEach((item) => {
      const q = item.querySelector('.faq-q');
      q?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        list.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  };

  const renderFaqCategoryMenu = () => {
    const menu = faqCatMenuRef.current;
    if (!menu) return;

    menu.innerHTML = FAQ_CATEGORIES.map(
      (cat) => `
      <div class="faq-cat-option${cat === activeFaqCategoryRef.current ? ' active' : ''}" data-cat="${cat}">
        <span>${cat}</span>
        <span class="faq-cat-count">${FAQ_DATA[cat].length} Q</span>
      </div>
    `
    ).join('');

    menu.querySelectorAll<HTMLElement>('.faq-cat-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        activeFaqCategoryRef.current = opt.dataset.cat || FAQ_CATEGORIES[0];
        if (faqCatLabelRef.current) faqCatLabelRef.current.textContent = activeFaqCategoryRef.current;
        closeFaqMenu();
        renderFaqCategoryMenu();
        renderFaqList();
      });
    });
  };

  const openFaqMenu = () => {
    faqCatMenuRef.current?.classList.add('open');
    faqCatTriggerRef.current?.classList.add('open');
    faqCatTriggerRef.current?.setAttribute('aria-expanded', 'true');
  };
  const closeFaqMenu = () => {
    faqCatMenuRef.current?.classList.remove('open');
    faqCatTriggerRef.current?.classList.remove('open');
    faqCatTriggerRef.current?.setAttribute('aria-expanded', 'false');
  };

  useEffect(() => {
    renderFaqCategoryMenu();
    renderFaqList();

    const trigger = faqCatTriggerRef.current;
    const onTriggerClick = (e: MouseEvent) => {
      e.stopPropagation();
      const isOpen = faqCatMenuRef.current?.classList.contains('open');
      if (isOpen) closeFaqMenu();
      else openFaqMenu();
    };
    trigger?.addEventListener('click', onTriggerClick);

    const onDocClick = (e: MouseEvent) => {
      const wrap = rootRef.current?.querySelector('.faq-cat-wrap');
      if (wrap && !wrap.contains(e.target as Node)) closeFaqMenu();
    };
    document.addEventListener('click', onDocClick);

    return () => {
      trigger?.removeEventListener('click', onTriggerClick);
      document.removeEventListener('click', onDocClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── charts ── */
  const drawMarginChart = () => {
    const ctx = marginCanvasRef.current;
    if (!ctx) return;
    if (marginChartRef.current) marginChartRef.current.destroy();

    const volumes = ['1K', '10K', '100K', '500K', '1M'];
    marginChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: volumes,
        datasets: [
          {
            label: 'Cloud API cost/test ($)',
            data: [0.06, 0.06, 0.058, 0.055, 0.05],
            borderColor: '#6b6a7d',
            backgroundColor: 'rgba(107,106,125,0.08)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#6b6a7d',
          },
          {
            label: 'RespiCore cloud cost/test ($)',
            data: [0.012, 0.008, 0.005, 0.004, 0.003],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168,85,247,0.15)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#a855f7',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#7aa8cc', font: { size: 11, family: "'DM Mono', monospace" }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: '#131319',
            borderColor: 'rgba(168,85,247,0.25)',
            borderWidth: 1,
            titleColor: '#9a99ab',
            bodyColor: '#eeeef2',
            callbacks: { label: (c) => ` ${c.dataset.label}: $${c.raw}` },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Cumulative screenings',
              color: '#57566b',
              font: { size: 10, family: "'DM Mono', monospace" },
            },
            ticks: { color: '#57566b', font: { size: 11, family: "'DM Mono', monospace" } },
            grid: { display: false },
          },
          y: {
            ticks: {
              color: '#57566b',
              font: { size: 10, family: "'DM Mono', monospace" },
              callback: (v) => '$' + v,
            },
            grid: { color: 'rgba(120,200,255,0.06)' },
          },
        },
      },
    });
  };

  const drawRevChart = () => {
    const ctx = revCanvasRef.current;
    if (!ctx) return;
    if (revChartRef.current) revChartRef.current.destroy();

    revChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Year 1', 'Year 2', 'Year 3'],
        datasets: [
          { label: 'B2C subscriptions', data: [180000, 620000, 1450000], backgroundColor: 'rgba(168,85,247,0.8)', borderRadius: 4 },
          { label: 'B2B SDK', data: [60000, 340000, 980000], backgroundColor: 'rgba(163,174,189,0.8)', borderRadius: 4 },
          { label: 'Enterprise licenses', data: [40000, 260000, 1120000], backgroundColor: 'rgba(255,184,48,0.75)', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#7aa8cc', font: { size: 11, family: "'DM Mono', monospace" }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: '#131319',
            borderColor: 'rgba(168,85,247,0.25)',
            borderWidth: 1,
            titleColor: '#9a99ab',
            bodyColor: '#eeeef2',
            callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtMoney(c.raw as number)}` },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#57566b', font: { size: 11, family: "'DM Mono', monospace" } },
            grid: { display: false },
          },
          y: {
            stacked: true,
            ticks: {
              color: '#57566b',
              font: { size: 10, family: "'DM Mono', monospace" },
              callback: (v) => fmtMoney(v as number),
            },
            grid: { color: 'rgba(120,200,255,0.06)' },
          },
        },
      },
    });
  };

  useEffect(() => {
    return () => {
      marginChartRef.current?.destroy();
      revChartRef.current?.destroy();
    };
  }, []);

  /* ────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────── */
  return (
    <div ref={rootRef} className="respicore-business-page">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* NAV */}
      <nav>
        <Link className="nav-logo" href="/">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="logo-text">
            Respi<span>Core</span>
          </span>
        </Link>
        <div className="nav-right">
          <span className="nav-tag">BUSINESS &amp; ECOSYSTEM</span>
          <Link className="btn-back" href="/">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to App
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="particles" ref={particleContainerRef} />
        <span className="hero-chip">Strategy &amp; monetization</span>
        <h1 className="hero-title">
          Business Model &amp; <em>Ecosystem</em> Blueprint
        </h1>
        <p className="hero-sub">
          Democratizing respiratory triage through secure, cloud-powered AI, high-margin SaaS, and institutional
          enterprise licensing.
        </p>

        <div className="ticker-wrap">
          <div className="ticker-grid">
            <div className="tick">
              <div className="tick-num">&lt;50ms</div>
              <div className="tick-lbl">Cloud inference latency</div>
            </div>
            <div className="tick">
              <div className="tick-num">256-bit</div>
              <div className="tick-lbl">Encrypted in transit</div>
            </div>
            <div className="tick">
              <div className="tick-num">4</div>
              <div className="tick-lbl">Tiered revenue channels</div>
            </div>
            <div className="tick">
              <div className="tick-num">89.2%</div>
              <div className="tick-lbl">Screening accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM FLOW */}
      <section id="flow">
        <div className="section-inner">
          <span className="section-label">The ecosystem</span>
          <h2 className="section-title">One cloud engine, four ways to monetize</h2>
          <p className="section-sub">
            Every screening runs once, in the cloud — then the same signal fans out into consumer, clinical, and
            institutional value streams. Click a node to see how each stage earns its keep.
          </p>

          <div className="flow-board">
            <div className="flow-cols">
              <div className="flow-col">
                <div className="flow-col-lbl">Customer inputs</div>
                <div className="flow-node" data-node="public">
                  <div className="fn-title">General public</div>
                  <div className="fn-sub">Self-screening &amp; symptom checks</div>
                </div>
                <div className="flow-node" data-node="chronic">
                  <div className="fn-title">Chronic illness users</div>
                  <div className="fn-sub">COPD / asthma longitudinal tracking</div>
                </div>
                <div className="flow-node" data-node="clinicians">
                  <div className="fn-title">Clinicians</div>
                  <div className="fn-sub">Rural &amp; primary-care triage support</div>
                </div>
                <div className="flow-node" data-node="publichealth">
                  <div className="fn-title">Public health bodies</div>
                  <div className="fn-sub">Municipal &amp; NGO surveillance programs</div>
                </div>
              </div>

              <div className="flow-arrows">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <div className="flow-line" />
              </div>

              <div className="flow-col">
                <div className="flow-col-lbl">Core value engine</div>
                <div className="flow-node fn-core" data-node="edgeai" style={{ marginTop: '36px' }}>
                  <div className="fn-title">Cloud AI engine</div>
                  <div className="fn-sub">Mel-spectrogram + hosted inference API</div>
                </div>
                <div className="flow-node fn-core" data-node="sandbox">
                  <div className="fn-title">Secure cloud data pipeline</div>
                  <div className="fn-sub">Encrypted transit, zero-retention audio</div>
                </div>
              </div>

              <div className="flow-arrows">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <div className="flow-line" />
              </div>

              <div className="flow-col">
                <div className="flow-col-lbl">Distribution &amp; revenue</div>
                <div className="flow-node" data-node="b2c">
                  <div className="fn-title">B2C direct app</div>
                  <div className="fn-sub">Freemium → Pro subscription</div>
                </div>
                <div className="flow-node" data-node="sdk">
                  <div className="fn-title">B2B telehealth SDK</div>
                  <div className="fn-sub">Per-call / tiered licensing</div>
                </div>
                <div className="flow-node" data-node="emr">
                  <div className="fn-title">Hospital EMR integration</div>
                  <div className="fn-sub">FHIR-native triage feed</div>
                </div>
                <div className="flow-node" data-node="surveillance">
                  <div className="fn-title">Enterprise surveillance dashboard</div>
                  <div className="fn-sub">Anonymized outbreak analytics</div>
                </div>
              </div>
            </div>

            <div className="flow-detail" ref={flowDetailRef}>
              <div className="fd-title" ref={fdTitleRef} />
              <div className="fd-body" ref={fdBodyRef} />
              <div className="fd-metrics" ref={fdMetricsRef} />
            </div>
          </div>
        </div>
      </section>

      {/* REVENUE MODEL */}
      <section id="revenue" className="alt-bg">
        <div className="section-inner">
          <span className="section-label">Multi-stream revenue</span>
          <h2 className="section-title">Four tiers, one cloud deployment</h2>
          <p className="section-sub">
            The same cloud-hosted model underwrites every tier — margins stay high because optimized inference keeps
            the per-screening bill low even at scale.
          </p>

          <div className="rev-grid">
            <div className="rev-card">
              <span className="rev-tag">B2C Freemium</span>
              <div className="rev-name">Free rapid screening</div>
              <div className="rev-price">
                $0<span> /forever</span>
              </div>
              <p className="rev-desc">
                Single-session cough &amp; breath classification via secure cloud API, no account required. The
                adoption flywheel.
              </p>
              <ul className="rev-list">
                <li>Unlimited single-test screenings</li>
                <li>4-class triage result</li>
                <li>Local report, 7-day history</li>
              </ul>
            </div>

            <div className="rev-card featured">
              <span className="rev-tag">B2C Pro</span>
              <div className="rev-name">Longitudinal tracking</div>
              <div className="rev-price">
                $4.99<span> /mo</span>
              </div>
              <p className="rev-desc">For chronic illness users who need trend lines, not one-off snapshots.</p>
              <ul className="rev-list">
                <li>Unlimited history &amp; trend graphs</li>
                <li>Symptom-flare early warning</li>
                <li>Exportable PDF for clinicians</li>
              </ul>
            </div>

            <div className="rev-card">
              <span className="rev-tag">B2B SDK</span>
              <div className="rev-name">Telehealth licensing</div>
              <div className="rev-price">
                $0.03<span> /call or tiered</span>
              </div>
              <p className="rev-desc">
                Drop-in SDK for telemedicine apps that need acoustic triage without building it themselves.
              </p>
              <ul className="rev-list">
                <li>Per-call or monthly tier pricing</li>
                <li>White-label result payload</li>
                <li>SLA-backed integration support</li>
              </ul>
            </div>

            <div className="rev-card">
              <span className="rev-tag">Enterprise</span>
              <div className="rev-name">Hospital &amp; NGO systems</div>
              <div className="rev-price">
                Custom<span> /license</span>
              </div>
              <p className="rev-desc">Dedicated cloud instance with priority alerting and EHR/FHIR integration.</p>
              <ul className="rev-list">
                <li>Dedicated cloud instance</li>
                <li>Priority triage alert routing</li>
                <li>Anonymized surveillance dashboard</li>
              </ul>
            </div>
          </div>

          <div className="arr-calc" id="arrCalc">
            <div className="arr-head">
              <div>
                <div className="chart-title" style={{ marginBottom: '4px' }}>
                  ARR projection estimator
                </div>
                <div className="chart-sub" style={{ marginBottom: 0 }}>
                  DRAG TO MODEL YOUR OWN SCENARIO
                </div>
              </div>
              <div className="arr-result">
                <div className="arr-result-lbl">Projected ARR</div>
                <div className="arr-result-num" ref={arrTotalRef}>
                  $0
                </div>
              </div>
            </div>
            <div className="arr-sliders">
              <div className="slider-group">
                <label>
                  B2C Pro subscribers <b ref={b2cValRef}>50,000</b>
                </label>
                <input type="range" ref={b2cSliderRef} min={0} max={2000000} step={5000} defaultValue={50000} />
              </div>
              <div className="slider-group">
                <label>
                  Enterprise / hospital licenses <b ref={entValRef}>25</b>
                </label>
                <input type="range" ref={entSliderRef} min={0} max={500} step={1} defaultValue={25} />
              </div>
            </div>
            <div className="arr-breakdown">
              <div className="arr-bd-item">
                B2C Pro ($4.99/mo)
                <b ref={bdB2cRef}>$0</b>
              </div>
              <div className="arr-bd-item">
                Enterprise (avg $18k/yr license)
                <b ref={bdEntRef}>$0</b>
              </div>
              <div className="arr-bd-item">
                B2B SDK (est. 15% of ARR mix)
                <b ref={bdSdkRef}>$0</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section id="charts">
        <div className="section-inner">
          <span className="section-label">Unit economics</span>
          <h2 className="section-title">Why optimized cloud AI wins on margin</h2>
          <p className="section-sub">
            Unoptimized competitors pay a growing server bill on every single test. RespiCore's optimized cloud
            inference pipeline keeps cost per screening low and predictable, even as volume scales.
          </p>

          <div className="chart-grid">
            <div className="chart-card" id="chart1">
              <div className="chart-title">Marginal cost per screening at scale</div>
              <div className="chart-sub">Optimized cloud pipeline vs standard cloud API</div>
              <div className="chart-wrap">
                <canvas ref={marginCanvasRef} />
              </div>
              <p className="chart-note">
                At 1,000,000 screenings, RespiCore's optimized cloud pipeline holds at <b>~$0.003</b> marginal cost,
                while unoptimized cloud-dependent tools stay pinned to <b>$0.02–$0.10</b> per call — the gap that
                funds a &gt;85% gross margin.
              </p>
            </div>

            <div className="chart-card" id="chart2">
              <div className="chart-title">Projected revenue distribution</div>
              <div className="chart-sub">3-year multi-stream breakdown</div>
              <div className="chart-wrap">
                <canvas ref={revCanvasRef} />
              </div>
              <p className="chart-note">
                B2C drives early <b>volume &amp; trust</b>; B2B SDK and enterprise licensing scale as the recurring,
                high-ACV backbone by year three.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MOAT */}
      <section id="moat" className="alt-bg">
        <div className="section-inner">
          <span className="section-label">Competitive advantage</span>
          <h2 className="section-title">The moat matrix</h2>
          <p className="section-sub">
            Every structural advantage traces back to one decision: run a lean, purpose-built cloud pipeline instead
            of a bolted-on generic API.
          </p>

          <div className="moat-table-wrap" id="moatTable">
            <table className="moat-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th className="ours">RespiCore</th>
                  <th>Cloud API competitors</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="moat-feat">Inference pipeline</span>
                    <span className="moat-sub">Purpose-built cloud model vs generic API</span>
                  </td>
                  <td className="ours">Dedicated, optimized cloud model</td>
                  <td>Round-trip to generic third-party API</td>
                </tr>
                <tr>
                  <td>
                    <span className="moat-feat">Patient data exposure</span>
                    <span className="moat-sub">Zero-retention cloud vs storage liability</span>
                  </td>
                  <td className="ours">Audio processed transiently, never stored</td>
                  <td>Audio &amp; results stored indefinitely in cloud DBs</td>
                </tr>
                <tr>
                  <td>
                    <span className="moat-feat">Marginal cost per test</span>
                    <span className="moat-sub">At scale, per screening</span>
                  </td>
                  <td className="ours">$0.003</td>
                  <td>$0.02 – $0.10 in compute</td>
                </tr>
                <tr>
                  <td>
                    <span className="moat-feat">Hardware requirement</span>
                    <span className="moat-sub">Accessibility &amp; deployment cost</span>
                  </td>
                  <td className="ours">Standard phone microphone</td>
                  <td>Proprietary Bluetooth stethoscope</td>
                </tr>
                <tr>
                  <td>
                    <span className="moat-feat">Inference latency</span>
                    <span className="moat-sub">Rural &amp; field deployment over mobile networks</span>
                  </td>
                  <td className="ours">&lt;50ms round trip on an optimized endpoint</td>
                  <td>200–500ms on generic, unoptimized APIs</td>
                </tr>
                <tr>
                  <td>
                    <span className="moat-feat">Regulatory liability surface</span>
                    <span className="moat-sub">Data breach / compliance exposure</span>
                  </td>
                  <td className="ours">Reduced — zero-retention, encrypted-in-transit pipeline</td>
                  <td>High — centralized PHI store retained indefinitely</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="section-inner">
          <span className="section-label">Questions &amp; answers</span>
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-sub">
            Pick a topic to see its questions — clinical basics, setup, privacy, accuracy, business, regulatory, and
            moat.
          </p>

          <div className="faq-cat-wrap">
            <button className="faq-cat-trigger" ref={faqCatTriggerRef} aria-expanded="false">
              <span ref={faqCatLabelRef}>{FAQ_CATEGORIES[0]}</span>
              <svg className="faq-cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="faq-cat-menu" ref={faqCatMenuRef} />
          </div>

          <div className="faq-list" ref={faqListRef} />
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <h2 className="cta-title">One cloud model. Four revenue lines. Fractions-of-a-cent marginal cost.</h2>
        <p className="cta-sub">
          RespiCore turns a privacy constraint into a margin advantage — see the full clinical story or take the
          model for a spin.
        </p>
        <div className="cta-btns">
          <Link className="btn-primary" href="/">
            Back to app
          </Link>
          <Link className="btn-secondary" href="/about">
            Read our story
          </Link>
        </div>
      </section>

      <footer>
        <span className="footer-note">© 2026 RespiCore. All rights reserved.</span>
        <span className="footer-warning">⚠ Research prototype — not a clinical diagnostic device</span>
      </footer>

      {/* MOBILE BOTTOM BACK BAR */}
      <div className="mobile-back-bar">
        <Link className="mobile-back-btn" href="/">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ pointerEvents: 'none', flexShrink: 0 }}
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to App</span>
        </Link>
      </div>

      <style>{`
.respicore-business-page {
  --bg:#0a0a0d;--bg2:#0e0e13;--bg3:#15151d;
  --card:#131319;--card2:#191922;
  --border:rgba(180,175,200,0.08);--border2:rgba(180,175,200,0.18);
  --accent:#a855f7;--accent2:#7c3aed;
  --accent-dim:rgba(168,85,247,0.12);--accent-glow:rgba(168,85,247,0.28);
  --green:#a3aebd;--green-dim:rgba(163,174,189,0.14);
  --amber:#ffb830;--amber-dim:rgba(255,184,48,0.1);
  --red:#ff4d6a;--red-dim:rgba(255,77,106,0.1);
  --coral:#c4b5fd;
  --text:#eeeef2;--text2:#9a99ab;--text3:#57566b;
  --mono:'DM Mono',monospace;--serif:'DM Serif Display',serif;--sans:'Syne',sans-serif;
  --r:12px;--r2:20px;
  font-family:var(--sans);background:var(--bg);color:var(--text);overflow-x:hidden;position:relative;
}
.respicore-business-page *,.respicore-business-page *::before,.respicore-business-page *::after{box-sizing:border-box;margin:0;padding:0;}
.respicore-business-page{scroll-behavior:smooth;}

.respicore-business-page::before{content:'';position:fixed;inset:0;
  background-image:linear-gradient(rgba(168,85,247,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.03) 1px,transparent 1px);
  background-size:48px 48px;pointer-events:none;z-index:0;}

/* ── NAV ── */
.respicore-business-page nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;
  display:flex;align-items:center;justify-content:space-between;padding:0 40px;
  background:rgba(5,13,20,0.9);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);}
.respicore-business-page .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.respicore-business-page .logo-icon{width:32px;height:32px;border:1.5px solid var(--accent);border-radius:8px;
  display:flex;align-items:center;justify-content:center;}
.respicore-business-page .logo-text{font-size:17px;font-weight:700;letter-spacing:0.04em;color:var(--text);}
.respicore-business-page .logo-text span{color:var(--accent);}
.respicore-business-page .nav-right{display:flex;align-items:center;gap:20px;}
.respicore-business-page .nav-tag{font-family:var(--mono);font-size:10px;letter-spacing:0.15em;color:var(--text3);
  border:1px solid var(--border2);padding:6px 12px;border-radius:100px;}
.respicore-business-page .btn-back{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text2);
  text-decoration:none;border:1px solid var(--border2);padding:8px 18px;
  border-radius:var(--r);transition:all 0.2s;display:flex;align-items:center;gap:6px;}
.respicore-business-page .btn-back:hover{border-color:var(--accent);color:var(--accent);}

/* ── HERO ── */
.respicore-business-page #hero{position:relative;z-index:1;min-height:92vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:120px 40px 60px;text-align:center;overflow:hidden;}

.respicore-business-page .particles{position:absolute;inset:0;pointer-events:none;}
.respicore-business-page .particle{position:absolute;width:2px;height:2px;background:var(--accent);border-radius:50%;opacity:0;
  animation:float-particle linear infinite;}
@keyframes float-particle{
  0%{opacity:0;transform:translateY(100vh) translateX(0);}
  10%{opacity:0.6;}90%{opacity:0.2;}
  100%{opacity:0;transform:translateY(-20px) translateX(var(--dx,20px));}
}

.respicore-business-page .hero-chip{font-family:var(--mono);font-size:10px;letter-spacing:0.2em;color:var(--accent);
  text-transform:uppercase;border:1px solid rgba(168,85,247,0.35);padding:6px 16px;
  border-radius:100px;margin-bottom:32px;display:inline-block;
  opacity:0;animation:fadeUp 0.8s ease 0.2s forwards;}

.respicore-business-page .hero-title{font-family:var(--serif);font-size:clamp(38px,6vw,72px);line-height:1.08;
  margin-bottom:22px;max-width:920px;opacity:0;animation:fadeUp 0.8s ease 0.35s forwards;}
.respicore-business-page .hero-title em{font-style:italic;color:var(--accent);}

.respicore-business-page .hero-sub{font-size:clamp(14px,2vw,17px);color:var(--text2);max-width:640px;
  line-height:1.7;margin:0 auto 56px;opacity:0;animation:fadeUp 0.8s ease 0.5s forwards;}

/* Stats ticker */
.respicore-business-page .ticker-wrap{width:100%;max-width:1040px;overflow:hidden;position:relative;
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  padding:28px 0;opacity:0;animation:fadeUp 0.8s ease 0.7s forwards;}
.respicore-business-page .ticker-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.respicore-business-page .tick{padding:0 20px;border-right:1px solid var(--border);}
.respicore-business-page .tick:last-child{border-right:none;}
.respicore-business-page .tick-num{font-family:var(--serif);font-size:clamp(24px,3vw,36px);color:var(--accent);line-height:1;
  display:flex;align-items:baseline;justify-content:center;gap:2px;}
.respicore-business-page .tick-lbl{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.08em;
  margin-top:8px;text-transform:uppercase;}

/* ── SECTION shared ── */
.respicore-business-page section{position:relative;z-index:1;}
.respicore-business-page .section-inner{max-width:1160px;margin:0 auto;padding:100px 40px;}
.respicore-business-page .section-label{font-family:var(--mono);font-size:10px;letter-spacing:0.2em;color:var(--accent);
  text-transform:uppercase;margin-bottom:12px;display:block;}
.respicore-business-page .section-title{font-family:var(--serif);font-size:clamp(30px,4vw,48px);line-height:1.15;max-width:760px;}
.respicore-business-page .section-sub{font-size:15px;color:var(--text2);line-height:1.7;margin-top:12px;max-width:640px;}
.respicore-business-page .alt-bg{background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}

/* ── ECOSYSTEM FLOW ── */
.respicore-business-page #flow .section-inner{padding-bottom:60px;}
.respicore-business-page .flow-board{position:relative;margin-top:64px;}
.respicore-business-page .flow-cols{display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;align-items:stretch;gap:0;}
.respicore-business-page .flow-col{display:flex;flex-direction:column;gap:16px;}
.respicore-business-page .flow-col-lbl{font-family:var(--mono);font-size:10px;letter-spacing:0.14em;color:var(--text3);
  text-transform:uppercase;margin-bottom:6px;text-align:center;}
.respicore-business-page .flow-arrows{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:8px;position:relative;}
.respicore-business-page .flow-arrows svg{width:32px;height:32px;color:var(--accent);opacity:0.5;}
.respicore-business-page .flow-line{width:2px;flex:1;background:linear-gradient(to bottom,transparent,var(--accent),transparent);opacity:0.3;
  animation:pulse-line 2.4s ease-in-out infinite;}
@keyframes pulse-line{0%,100%{opacity:0.15;}50%{opacity:0.55;}}

.respicore-business-page .flow-node{background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:16px 18px;cursor:pointer;transition:all 0.25s ease;position:relative;
  opacity:0;transform:translateY(16px);}
.respicore-business-page .flow-node.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .flow-node:hover{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 0 24px var(--accent-glow);transform:translateY(-3px);}
.respicore-business-page .flow-node.active{border-color:var(--accent);background:var(--card2);box-shadow:0 0 0 1px var(--accent),0 0 24px var(--accent-glow);}
.respicore-business-page .fn-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;}
.respicore-business-page .fn-sub{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.04em;}
.respicore-business-page .fn-core{border-color:rgba(163,174,189,0.35);}
.respicore-business-page .fn-core:hover,.respicore-business-page .fn-core.active{border-color:var(--green);box-shadow:0 0 0 1px var(--green),0 0 24px rgba(163,174,189,0.28);}

.respicore-business-page .flow-detail{margin-top:28px;background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);
  padding:0;max-height:0;overflow:hidden;opacity:0;transition:all 0.4s ease;}
.respicore-business-page .flow-detail.open{max-height:400px;opacity:1;padding:28px 32px;}
.respicore-business-page .fd-title{font-size:16px;font-weight:700;color:var(--accent);margin-bottom:10px;}
.respicore-business-page .fd-body{font-size:13px;color:var(--text2);line-height:1.75;}
.respicore-business-page .fd-metrics{display:flex;gap:24px;margin-top:16px;flex-wrap:wrap;}
.respicore-business-page .fd-metric{font-family:var(--mono);font-size:11px;color:var(--text3);}
.respicore-business-page .fd-metric b{color:var(--green);font-size:14px;display:block;font-family:var(--serif);font-style:italic;}

/* ── PRICING CARDS ── */
.respicore-business-page .rev-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:56px;}
.respicore-business-page .rev-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);
  padding:28px 24px;display:flex;flex-direction:column;
  opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease,border-color 0.3s;}
.respicore-business-page .rev-card.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .rev-card:hover{border-color:var(--border2);transform:translateY(-4px)!important;}
.respicore-business-page .rev-card.featured{border-color:rgba(163,174,189,0.4);}
.respicore-business-page .rev-tag{font-family:var(--mono);font-size:9px;letter-spacing:0.1em;color:var(--accent);
  background:var(--accent-dim);border:1px solid rgba(168,85,247,0.25);
  padding:3px 9px;border-radius:4px;display:inline-block;width:fit-content;margin-bottom:16px;text-transform:uppercase;}
.respicore-business-page .rev-card.featured .rev-tag{color:var(--green);background:var(--green-dim);border-color:rgba(163,174,189,0.3);}
.respicore-business-page .rev-name{font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;}
.respicore-business-page .rev-price{font-family:var(--serif);font-size:30px;color:var(--text);margin-bottom:4px;}
.respicore-business-page .rev-price span{font-family:var(--mono);font-size:11px;color:var(--text3);}
.respicore-business-page .rev-desc{font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:18px;flex:1;}
.respicore-business-page .rev-list{list-style:none;display:flex;flex-direction:column;gap:9px;}
.respicore-business-page .rev-list li{font-size:12px;color:var(--text2);display:flex;gap:8px;align-items:flex-start;}
.respicore-business-page .rev-list li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;}

/* ARR calculator */
.respicore-business-page .arr-calc{margin-top:40px;background:var(--card);border:1px solid var(--border);border-radius:var(--r2);
  padding:36px;opacity:0;transform:translateY(20px);transition:all 0.6s ease;}
.respicore-business-page .arr-calc.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .arr-head{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;margin-bottom:32px;}
.respicore-business-page .arr-result{text-align:right;}
.respicore-business-page .arr-result-lbl{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;}
.respicore-business-page .arr-result-num{font-family:var(--serif);font-size:clamp(30px,4vw,44px);color:var(--green);line-height:1.1;}
.respicore-business-page .arr-sliders{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
.respicore-business-page .slider-group label{display:flex;justify-content:space-between;font-size:13px;color:var(--text2);margin-bottom:10px;}
.respicore-business-page .slider-group label b{color:var(--text);font-family:var(--mono);font-weight:500;}
.respicore-business-page input[type=range]{width:100%;height:4px;-webkit-appearance:none;appearance:none;background:var(--bg3);
  border-radius:2px;outline:none;}
.respicore-business-page input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;
  background:var(--accent);cursor:pointer;box-shadow:0 0 0 4px var(--accent-dim);}
.respicore-business-page input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;border:none;
  background:var(--accent);cursor:pointer;box-shadow:0 0 0 4px var(--accent-dim);}
.respicore-business-page .arr-breakdown{display:flex;gap:24px;margin-top:28px;flex-wrap:wrap;padding-top:24px;border-top:1px solid var(--border);}
.respicore-business-page .arr-bd-item{font-family:var(--mono);font-size:11px;color:var(--text3);}
.respicore-business-page .arr-bd-item b{display:block;color:var(--accent);font-size:16px;font-family:var(--serif);font-style:italic;margin-top:2px;}

/* ── CHARTS ── */
.respicore-business-page .chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:56px;}
.respicore-business-page .chart-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:32px;
  opacity:0;transform:translateY(24px);transition:opacity 0.7s ease,transform 0.7s ease;}
.respicore-business-page .chart-card.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .chart-card:hover{border-color:var(--border2);}
.respicore-business-page .chart-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;}
.respicore-business-page .chart-sub{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.08em;margin-bottom:24px;text-transform:uppercase;}
.respicore-business-page .chart-wrap{position:relative;height:280px;}
.respicore-business-page .chart-note{margin-top:16px;font-size:12px;color:var(--text2);line-height:1.6;}
.respicore-business-page .chart-note b{color:var(--green);}

/* ── MOAT TABLE ── */
.respicore-business-page .moat-table-wrap{margin-top:56px;background:var(--card);border:1px solid var(--border);
  border-radius:var(--r2);padding:32px;overflow-x:auto;
  opacity:0;transform:translateY(24px);transition:all 0.7s ease;}
.respicore-business-page .moat-table-wrap.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .moat-table{width:100%;border-collapse:collapse;min-width:640px;}
.respicore-business-page .moat-table th{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;color:var(--text3);
  text-transform:uppercase;text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);}
.respicore-business-page .moat-table th.ours{color:var(--green);}
.respicore-business-page .moat-table td{padding:16px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border);vertical-align:top;}
.respicore-business-page .moat-table tr:last-child td{border-bottom:none;}
.respicore-business-page .moat-table td.ours{color:var(--green);font-weight:600;}
.respicore-business-page .moat-table tr:hover td{background:rgba(168,85,247,0.03);}
.respicore-business-page .moat-feat{color:var(--text);font-weight:600;}
.respicore-business-page .moat-sub{display:block;font-size:11px;color:var(--text3);font-weight:400;margin-top:2px;}

/* ── FAQ ── */
.respicore-business-page .faq-cat-wrap{position:relative;margin-top:40px;max-width:420px;}
.respicore-business-page .faq-cat-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:var(--card);border:1px solid var(--border2);border-radius:var(--r);
  padding:16px 20px;cursor:pointer;font-family:var(--sans);font-size:15px;font-weight:700;
  color:var(--text);transition:border-color 0.2s,box-shadow 0.2s;}
.respicore-business-page .faq-cat-trigger:hover{border-color:var(--accent);}
.respicore-business-page .faq-cat-trigger.open{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 0 20px var(--accent-glow);}
.respicore-business-page .faq-cat-chevron{width:18px;height:18px;color:var(--accent);flex-shrink:0;transition:transform 0.25s ease;}
.respicore-business-page .faq-cat-trigger.open .faq-cat-chevron{transform:rotate(180deg);}

.respicore-business-page .faq-cat-menu{position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:20;
  background:var(--card2);border:1px solid var(--border2);border-radius:var(--r);
  padding:6px;display:none;box-shadow:0 20px 48px rgba(0,0,0,0.5);
  max-width:420px;min-width:100%;}
.respicore-business-page .faq-cat-menu.open{display:block;}
.respicore-business-page .faq-cat-option{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:12px 14px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--text2);
  transition:background 0.15s,color 0.15s;white-space:nowrap;}
.respicore-business-page .faq-cat-option:hover{background:var(--accent-dim);color:var(--text);}
.respicore-business-page .faq-cat-option.active{background:var(--accent-dim);color:var(--accent);font-weight:700;}
.respicore-business-page .faq-cat-count{font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.05em;flex-shrink:0;}
.respicore-business-page .faq-cat-option.active .faq-cat-count{color:var(--accent);}

.respicore-business-page .faq-list{margin-top:24px;max-width:820px;}
.respicore-business-page .faq-item{border-bottom:1px solid var(--border);
  opacity:0;transform:translateY(14px);transition:opacity 0.5s ease,transform 0.5s ease;}
.respicore-business-page .faq-item.visible{opacity:1;transform:translateY(0);}
.respicore-business-page .faq-q{display:flex;justify-content:space-between;align-items:center;gap:20px;
  padding:24px 4px;cursor:pointer;font-size:15px;font-weight:600;color:var(--text);}
.respicore-business-page .faq-q:hover{color:var(--accent);}
.respicore-business-page .faq-icon{width:20px;height:20px;flex-shrink:0;color:var(--accent);transition:transform 0.3s ease;}
.respicore-business-page .faq-item.open .faq-icon{transform:rotate(45deg);}
.respicore-business-page .faq-a{max-height:0;overflow:hidden;transition:max-height 0.4s ease;}
.respicore-business-page .faq-item.open .faq-a{max-height:300px;}
.respicore-business-page .faq-a-inner{padding:0 4px 26px;font-size:13px;color:var(--text2);line-height:1.75;max-width:720px;}

/* ── CTA / FOOTER ── */
.respicore-business-page #cta{padding:100px 40px;text-align:center;}
.respicore-business-page .cta-title{font-family:var(--serif);font-size:clamp(28px,4vw,44px);max-width:640px;margin:0 auto 20px;}
.respicore-business-page .cta-sub{color:var(--text2);font-size:14px;max-width:520px;margin:0 auto 32px;line-height:1.7;}
.respicore-business-page .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.respicore-business-page .btn-primary{font-family:var(--sans);font-weight:700;font-size:14px;color:var(--bg);
  background:var(--accent);padding:14px 28px;border-radius:var(--r);text-decoration:none;
  transition:all 0.2s;border:1px solid var(--accent);}
.respicore-business-page .btn-primary:hover{background:var(--accent2);border-color:var(--accent2);}
.respicore-business-page .btn-secondary{font-family:var(--sans);font-weight:700;font-size:14px;color:var(--text);
  background:transparent;padding:14px 28px;border-radius:var(--r);text-decoration:none;
  border:1px solid var(--border2);transition:all 0.2s;}
.respicore-business-page .btn-secondary:hover{border-color:var(--accent);color:var(--accent);}

.respicore-business-page footer{position:relative;z-index:1;border-top:1px solid var(--border);
  padding:40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.respicore-business-page .footer-note{font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:0.06em;}
.respicore-business-page .footer-warning{font-size:11px;color:var(--amber);background:var(--amber-dim);
  border:1px solid rgba(255,184,48,0.2);padding:6px 14px;border-radius:6px;
  font-family:var(--mono);}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}

/* ── MOBILE BOTTOM BACK BAR ── */
.respicore-business-page .mobile-back-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9000;
  background:rgba(10,21,32,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-top:1px solid rgba(120,200,255,0.15);padding:10px 20px calc(10px + env(safe-area-inset-bottom,0px));
  box-shadow:0 -8px 32px rgba(0,0,0,0.5);}
.respicore-business-page .mobile-back-btn{display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);
  font-size:13px;font-weight:600;color:var(--text2);text-decoration:none;border:1px solid rgba(120,200,255,0.2);
  padding:12px 18px;border-radius:10px;background:transparent;-webkit-tap-highlight-color:transparent;}
.respicore-business-page .mobile-back-btn:active{background:var(--card);color:var(--accent);}

/* Responsive */
@media(max-width:900px){
  .respicore-business-page .flow-cols{grid-template-columns:1fr;gap:20px;}
  .respicore-business-page .flow-arrows{flex-direction:row;height:40px;}
  .respicore-business-page .flow-arrows svg{transform:rotate(90deg);}
  .respicore-business-page .flow-line{display:none;}
  .respicore-business-page .rev-grid{grid-template-columns:1fr 1fr;}
  .respicore-business-page .chart-grid{grid-template-columns:1fr;}
  .respicore-business-page .arr-sliders{grid-template-columns:1fr;}
}
@media(max-width:768px){
  .respicore-business-page nav{padding:0 16px;height:56px;}
  .respicore-business-page .nav-tag{display:none;}
  .respicore-business-page .btn-back{display:none;}
  .respicore-business-page .mobile-back-bar{display:block;}
  .respicore-business-page{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px));}
  .respicore-business-page #hero{padding:90px 20px 40px;min-height:auto;}
  .respicore-business-page .ticker-grid{grid-template-columns:1fr 1fr;gap:20px 0;}
  .respicore-business-page .tick{border-right:none;border-bottom:1px solid var(--border);padding-bottom:16px;}
  .respicore-business-page .section-inner{padding:64px 20px;}
  .respicore-business-page .rev-grid{grid-template-columns:1fr;}
  .respicore-business-page .arr-calc{padding:24px 20px;}
  .respicore-business-page .arr-head{flex-direction:column;}
  .respicore-business-page .arr-result{text-align:left;}
  .respicore-business-page .moat-table-wrap{padding:20px 16px;}
  .respicore-business-page footer{flex-direction:column;text-align:center;padding:28px 20px calc(28px + env(safe-area-inset-bottom,0px));}
}
      `}</style>
    </div>
  );
}