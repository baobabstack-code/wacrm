"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "./landing.css";

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.dataset.scrolled = window.scrollY > 20 ? "true" : "false";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.transitionDelay = `${(i % 3) * 80}ms`;
            el.classList.add("lp-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav ref={navRef} className="lp-nav" data-scrolled="false">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="lp-logo-text">WaCRM</span>
          </Link>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#how" className="lp-nav-link">How it works</a>
            <a href="#self-host" className="lp-nav-link">Self-host</a>
          </div>
          <div className="lp-nav-cta">
            <Link href="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
            <a href="https://github.com/ArnasDon/wacrm" className="lp-btn lp-btn-primary">
              <GithubIcon /> GitHub
            </a>
          </div>
        </div>
      </nav>

      <div className="lp-root">
        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />

          <div className="lp-badge">
            <span className="lp-badge-dot" aria-hidden="true" />
            Open source · MIT license · v0.2.2
          </div>

          <h1 className="lp-h1">
            The WhatsApp CRM<br />
            you <em className="lp-h1-em">actually own</em>
          </h1>

          <p className="lp-hero-sub">
            A complete, self-hostable CRM built for teams running WhatsApp Business.
            Shared inbox, pipelines, broadcasts, automations — fork it, brand it, ship it.
          </p>

          <div className="lp-hero-actions">
            <a href="https://github.com/ArnasDon/wacrm" className="lp-btn lp-btn-primary lp-btn-lg">
              <GithubIcon /> Clone the repo
            </a>
            <Link href="/signup" className="lp-btn lp-btn-outline lp-btn-lg">Try the demo</Link>
          </div>

          <div className="lp-frame-wrap lp-reveal">
            <div className="lp-frame-border" aria-hidden="true" />
            <div className="lp-frame">
              <div className="lp-frame-bar">
                <span className="lp-dot lp-dot-r" />
                <span className="lp-dot lp-dot-y" />
                <span className="lp-dot lp-dot-g" />
              </div>
              <div className="lp-app-layout">
                <AppSidebar />
                <InboxList />
                <ChatPane />
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF STRIP ── */}
        <div className="lp-proof">
          {PROOF.map(([bold, rest]) => (
            <div key={bold} className="lp-proof-item">
              <CheckIcon />
              <span><strong>{bold}</strong> {rest}</span>
            </div>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <div className="lp-features-intro lp-reveal">
              <div className="lp-section-label">Everything included</div>
              <h2 className="lp-section-title">Six modules. One coherent system.</h2>
              <p className="lp-section-sub">
                Not a framework — a working CRM. Every feature is already built, wired together, and ready to customise.
              </p>
            </div>
            <div className="lp-features-grid lp-reveal">
              {FEATURES.map((f) => (
                <div key={f.title} className="lp-feat-card">
                  <div className="lp-feat-icon"><f.Icon /></div>
                  <p className="lp-feat-title">{f.title}</p>
                  <p className="lp-feat-desc">{f.desc}</p>
                  <span className="lp-feat-tag">{f.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="lp-section lp-section--alt">
          <div className="lp-how-inner">
            <div className="lp-reveal">
              <div className="lp-section-label">Self-host in an afternoon</div>
              <h2 className="lp-section-title">Up and running<br />before lunch.</h2>
              <p className="lp-section-sub lp-section-sub--spaced">
                No DevOps ceremony. Clone, configure, deploy. The template handles the rest.
              </p>
              <div className="lp-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className="lp-step">
                    <div className="lp-step-num">{i + 1}</div>
                    <div>
                      <p className="lp-step-title">{s.title}</p>
                      <p className="lp-step-desc" dangerouslySetInnerHTML={{ __html: s.desc }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-terminal lp-reveal" id="self-host">
              <div className="lp-terminal-bar">
                <span className="lp-dot lp-dot-r" />
                <span className="lp-dot lp-dot-y" />
                <span className="lp-dot lp-dot-g" />
                <span className="lp-terminal-bar-label">bash — setup</span>
              </div>
              <div className="lp-terminal-body">
                <p><span className="t-comment"># 1. Clone</span></p>
                <p><span className="t-prompt">$ </span><span className="t-cmd">git clone</span> <span className="t-str">https://github.com/ArnasDon/wacrm</span></p>
                <p><span className="t-prompt">$ </span><span className="t-cmd">cd</span> wacrm <span className="t-cmd">&amp;&amp; npm install</span></p>
                <br />
                <p><span className="t-comment"># 2. Configure</span></p>
                <p><span className="t-prompt">$ </span><span className="t-cmd">cp</span> .env.example .env.local</p>
                <p><span className="t-key">NEXT_PUBLIC_SUPABASE_URL</span>=<span className="t-val">&quot;https://xyz.supabase.co&quot;</span></p>
                <p><span className="t-key">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=<span className="t-val">&quot;eyJ...&quot;</span></p>
                <p><span className="t-key">WHATSAPP_PHONE_ID</span>=<span className="t-val">&quot;1234567890&quot;</span></p>
                <p><span className="t-key">WHATSAPP_TOKEN</span>=<span className="t-val">&quot;EAAx...&quot;</span></p>
                <br />
                <p><span className="t-comment"># 3. Run migrations &amp; start</span></p>
                <p><span className="t-prompt">$ </span><span className="t-cmd">npx supabase db push</span></p>
                <p><span className="t-prompt">$ </span><span className="t-cmd">npm run dev</span></p>
                <br />
                <p><span className="t-ok">✓ Ready on http://localhost:3000</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* ── METRICS ── */}
        <section className="lp-section lp-section--center">
          <div className="lp-container">
            <div className="lp-reveal">
              <div className="lp-section-label lp-section-label--center">Why self-host</div>
              <h2 className="lp-section-title">Your data. Your rules.<br />No bill shock.</h2>
              <p className="lp-section-sub lp-section-sub--center">
                SaaS CRMs charge per seat, per message, per feature. With WaCRM you pay only for infrastructure you control.
              </p>
            </div>
            <div className="lp-metrics-grid lp-reveal">
              {METRICS.map((m) => (
                <div key={m.label} className="lp-metric-card">
                  <div className="lp-metric-value">{m.value}</div>
                  <div className="lp-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta-section">
          <div className="lp-container">
            <div className="lp-cta-box lp-reveal">
              <div className="lp-cta-glow" aria-hidden="true" />
              <h2 className="lp-cta-title">Ready to own your customer conversations?</h2>
              <p className="lp-cta-sub">
                Fork the repo, deploy in an hour, and start building the CRM that actually fits your team.
              </p>
              <div className="lp-cta-actions">
                <a href="https://github.com/ArnasDon/wacrm" className="lp-btn lp-btn-primary lp-btn-lg">
                  <GithubIcon /> View on GitHub
                </a>
                <Link href="/signup" className="lp-btn lp-btn-outline lp-btn-lg">Try the live demo</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-copy">© 2025 WaCRM · MIT License · Built with Next.js &amp; Supabase</p>
          <div className="lp-footer-links">
            <a href="https://github.com/ArnasDon/wacrm" className="lp-footer-link">GitHub</a>
            <a href="https://github.com/ArnasDon/wacrm/issues" className="lp-footer-link">Issues</a>
            <Link href="/login" className="lp-footer-link">Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function AppSidebar() {
  return (
    <nav className="lp-sidebar">
      <div className="lp-sidebar-section">Workspace</div>
      <div className="lp-sidebar-item">
        <GridIcon /> Dashboard
      </div>
      <div className="lp-sidebar-item lp-sidebar-item--active">
        <MsgIcon /> Inbox
        <span className="lp-sidebar-badge">12</span>
      </div>
      <div className="lp-sidebar-item"><UsersIcon /> Contacts</div>
      <div className="lp-sidebar-item"><PipelineIcon /> Pipelines</div>
      <div className="lp-sidebar-section">Messaging</div>
      <div className="lp-sidebar-item"><BroadcastIcon /> Broadcasts</div>
      <div className="lp-sidebar-item"><ZapIcon /> Automations</div>
    </nav>
  );
}

function InboxList() {
  return (
    <div className="lp-inbox">
      <div className="lp-inbox-header">
        Inbox <span>24 conversations</span>
      </div>
      {CONVOS.map((c) => (
        <div key={c.name} className={`lp-conv${c.active ? " lp-conv--active" : ""}`}>
          <div className="lp-avatar" style={{ "--lp-avatar-bg": c.bg } as React.CSSProperties}>{c.initials}</div>
          <div className="lp-conv-body">
            <div className="lp-conv-name">
              {c.name} <time className="lp-conv-time">{c.time}</time>
            </div>
            <div className="lp-conv-preview">{c.preview}</div>
          </div>
          {c.unread && <div className="lp-unread-dot" />}
        </div>
      ))}
    </div>
  );
}

function ChatPane() {
  return (
    <div className="lp-chat">
      <div className="lp-chat-header">
        <div className="lp-avatar lp-avatar--sm">MK</div>
        <div>
          <p className="lp-chat-name">Maria K.</p>
          <p className="lp-chat-status">Online</p>
        </div>
        <span className="lp-chat-chip">Open</span>
      </div>
      <div className="lp-chat-messages">
        <div className="lp-bubble lp-bubble--in">Hi, I saw your product listing. What&apos;s the delivery timeline for bulk orders?</div>
        <span className="lp-msg-time lp-msg-time--in">10:42</span>
        <div className="lp-bubble lp-bubble--out">Great question! For orders over 100 units, delivery is typically 5–7 business days. We also offer express shipping.</div>
        <span className="lp-msg-time lp-msg-time--out">10:44 ✓✓</span>
        <div className="lp-bubble lp-bubble--in">Perfect. Can you send me a formal quote?</div>
        <span className="lp-msg-time lp-msg-time--in">10:45</span>
      </div>
      <div className="lp-chat-input-row">
        <div className="lp-chat-input-field">Type a message…</div>
      </div>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────── */
const S = { width: 15, height: 15, fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const F = { width: 20, height: 20, fill: "none" as const, stroke: "#9d5ffa", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function GithubIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>;
}
function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9d5ffa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lp-check-icon"><polyline points="20 6 9 17 4 12"/></svg>;
}
function GridIcon()      { return <svg viewBox="0 0 24 24" {...S}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function MsgIcon()       { return <svg viewBox="0 0 24 24" {...S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function UsersIcon()     { return <svg viewBox="0 0 24 24" {...S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function PipelineIcon()  { return <svg viewBox="0 0 24 24" {...S}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function BroadcastIcon() { return <svg viewBox="0 0 24 24" {...S}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function ZapIcon()       { return <svg viewBox="0 0 24 24" {...S}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }

function FeatMsgIcon()       { return <svg viewBox="0 0 24 24" {...F}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function FeatUsersIcon()     { return <svg viewBox="0 0 24 24" {...F}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function FeatPipelineIcon()  { return <svg viewBox="0 0 24 24" {...F}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function FeatBroadcastIcon() { return <svg viewBox="0 0 24 24" {...F}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function FeatZapIcon()       { return <svg viewBox="0 0 24 24" {...F}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function FeatGridIcon()      { return <svg viewBox="0 0 24 24" {...F}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }

/* ─── Data ───────────────────────────────────────────────────── */

const PROOF: [string, string][] = [
  ["Next.js 15", "+ Supabase"],
  ["MIT licensed", "— fork freely"],
  ["Deploy on", "Vercel in minutes"],
  ["Works with", "Meta Cloud API"],
];

const CONVOS = [
  { initials: "MK", bg: "#7c3aed", name: "Maria K.",  time: "2m",  preview: "What's the delivery timeline for...", active: true  },
  { initials: "JR", bg: "#0891b2", name: "James R.",  time: "18m", preview: "Got your message, sounds good!",      unread: true  },
  { initials: "AL", bg: "#059669", name: "Amara L.",  time: "1h",  preview: "Can I get a quote for 500 units?",    unread: true  },
  { initials: "TN", bg: "#b45309", name: "Tom N.",    time: "3h",  preview: "Following up on the proposal..."                    },
  { initials: "SP", bg: "#be185d", name: "Sara P.",   time: "5h",  preview: "Thanks, looking forward to it!"                     },
];

const FEATURES = [
  { Icon: FeatMsgIcon,       title: "Shared Inbox",    desc: "Every WhatsApp conversation in one place. Assign threads to agents, track open/closed status, and see who's handling what in real time.",                                                               tag: "Team-ready"    },
  { Icon: FeatUsersIcon,     title: "Contacts",        desc: "A full customer database with tags, custom fields, CSV import, and smart deduplication. Every message thread links to a contact record.",                                                              tag: "CRM core"      },
  { Icon: FeatPipelineIcon,  title: "Sales Pipelines", desc: "Kanban boards with five default stages from New Lead to Won. Drag deals, track value, and see your entire funnel at a glance.",                                                                        tag: "Deals tracking"},
  { Icon: FeatBroadcastIcon, title: "Broadcasts",      desc: "Send approved WhatsApp templates to segmented contact lists. Per-recipient variable substitution, delivery tracking, read receipts.",                                                                  tag: "Bulk messaging"},
  { Icon: FeatZapIcon,       title: "Automations",     desc: "No-code workflow builder. Trigger on inbound messages, keywords, new contacts, or schedules. Branch on conditions, wait, tag, webhook.",                                                              tag: "No-code"       },
  { Icon: FeatGridIcon,      title: "Live Dashboard",  desc: "Metrics across every module: active conversations, new contacts, open deal value, response time trends, and a cross-module activity feed.",                                                            tag: "Analytics"     },
];

const STEPS = [
  { title: "Fork and clone",         desc: "Clone the repo and install dependencies. Everything is a standard Next.js project — no proprietary tooling required." },
  { title: "Connect Supabase",       desc: 'Create a free Supabase project, copy the API keys into <code class="lp-step-desc code">.env.local</code>, and run the migration. Schema ships with the repo.' },
  { title: "Wire WhatsApp Business", desc: "Paste your Meta Cloud API credentials and webhook URL. The app validates the connection and starts receiving messages immediately." },
  { title: "Deploy to Vercel",       desc: "Push to GitHub and connect the repo in Vercel. One click. Your team can start using it within the hour." },
];

const METRICS = [
  { value: "$0",   label: "Licensing cost — forever, MIT"           },
  { value: "6+",   label: "Built-in modules ready on day one"       },
  { value: "∞",    label: "Team seats — no per-user pricing"        },
  { value: "<1hr", label: "Time to deploy on Vercel + Supabase"     },
];
