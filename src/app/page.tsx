"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "./landing.css";

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

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
            <a href="#pricing" className="lp-nav-link">Pricing</a>
          </div>
          <div className="lp-nav-cta">
            {isLoggedIn ? (
              <Link href="/dashboard" className="lp-btn lp-btn-primary">Go to dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
                <Link href="/signup" className="lp-btn lp-btn-primary">Start free trial</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="lp-root">
        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />

          <div className="lp-badge">
            <span className="lp-badge-dot" aria-hidden="true" />
            Now in early access · 14-day free trial · No credit card required
          </div>

          <h1 className="lp-h1">
            The WhatsApp CRM built for<br />
            <em className="lp-h1-em">teams that close deals</em>
          </h1>

          <p className="lp-hero-sub">
            Turn every WhatsApp conversation into a managed sales opportunity.
            Shared inbox, pipelines, broadcasts, and automations — all in one place, ready in minutes.
          </p>

          <div className="lp-hero-actions">
            {isLoggedIn ? (
              <Link href="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg">Go to dashboard</Link>
            ) : (
              <>
                <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">Start free trial</Link>
                <Link href="/login" className="lp-btn lp-btn-outline lp-btn-lg">Sign in</Link>
              </>
            )}
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

        {/* ── PROBLEM ── */}
        <section className="lp-section lp-section--alt">
          <div className="lp-container">
            <div className="lp-problem-grid lp-reveal">
              <div className="lp-problem-left">
                <div className="lp-section-label">Sound familiar?</div>
                <h2 className="lp-section-title">WhatsApp is where your customers are.<br />Your tools haven&apos;t caught up.</h2>
              </div>
              <div className="lp-problem-right">
                {PROBLEMS.map((p) => (
                  <div key={p.title} className="lp-problem-item">
                    <div className="lp-problem-icon"><p.Icon /></div>
                    <div>
                      <p className="lp-problem-title">{p.title}</p>
                      <p className="lp-problem-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <div className="lp-features-intro lp-reveal">
              <div className="lp-section-label">Everything included</div>
              <h2 className="lp-section-title">Six modules. One coherent system.</h2>
              <p className="lp-section-sub">
                Every tool your team needs to manage WhatsApp sales — built in, wired together, and ready on day one.
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
              <div className="lp-section-label">Get started in minutes</div>
              <h2 className="lp-section-title">Up and running<br />before lunch.</h2>
              <p className="lp-section-sub lp-section-sub--spaced">
                No engineers needed. Sign up, connect WhatsApp Business, and your team is live.
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
            <div className="lp-terminal lp-reveal" id="pricing">
              <div className="lp-terminal-bar">
                <span className="lp-dot lp-dot-r" />
                <span className="lp-dot lp-dot-y" />
                <span className="lp-dot lp-dot-g" />
                <span className="lp-terminal-bar-label">WaCRM — onboarding</span>
              </div>
              <div className="lp-terminal-body">
                <p><span className="t-comment"># Step 1 — Create your account</span></p>
                <p><span className="t-ok">✓ Sign up with your work email</span></p>
                <p><span className="t-ok">✓ Invite your team members</span></p>
                <br />
                <p><span className="t-comment"># Step 2 — Connect WhatsApp Business</span></p>
                <p><span className="t-ok">✓ Paste your Meta Cloud API credentials</span></p>
                <p><span className="t-ok">✓ Webhook configured automatically</span></p>
                <br />
                <p><span className="t-comment"># Step 3 — Start selling</span></p>
                <p><span className="t-ok">✓ Shared inbox live</span></p>
                <p><span className="t-ok">✓ Pipelines &amp; contacts ready</span></p>
                <br />
                <p><span className="t-ok">✓ Your team is live in under an hour</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* ── METRICS ── */}
        <section className="lp-section lp-section--center">
          <div className="lp-container">
            <div className="lp-reveal">
              <div className="lp-section-label lp-section-label--center">Built for revenue teams</div>
              <h2 className="lp-section-title">Everything your team needs.<br />Nothing they don&apos;t.</h2>
              <p className="lp-section-sub lp-section-sub--center">
                WaCRM is purpose-built for WhatsApp sales. No bloated feature sets, no complex onboarding — just a CRM that works.
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

        {/* ── WHY WACRM ── */}
        <section className="lp-section lp-section--alt">
          <div className="lp-container">
            <div className="lp-why-intro lp-reveal">
              <div className="lp-section-label">Why WaCRM</div>
              <h2 className="lp-section-title">Not just another CRM.</h2>
              <p className="lp-section-sub">
                Most CRMs bolt on a WhatsApp integration as an afterthought. WaCRM is designed around WhatsApp from the ground up — every feature exists to help your team respond faster, follow up consistently, and close more deals.
              </p>
            </div>
            <div className="lp-why-grid lp-reveal">
              {WHY.map((w) => (
                <div key={w.title} className="lp-why-card">
                  <div className="lp-why-icon"><w.Icon /></div>
                  <p className="lp-why-title">{w.title}</p>
                  <p className="lp-why-desc">{w.desc}</p>
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
              <h2 className="lp-cta-title">Start closing more deals on WhatsApp today.</h2>
              <p className="lp-cta-sub">
                14 days free. No credit card required. Your whole team up and running in under an hour.
              </p>
              <div className="lp-cta-actions">
                <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">Start free trial</Link>
                <Link href="/login" className="lp-btn lp-btn-outline lp-btn-lg">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-copy">© 2026 Vertex Software Labs t/a Baobab Stack · All rights reserved</p>
          <div className="lp-footer-links">
            <a href="#features" className="lp-footer-link">Features</a>
            <a href="#pricing" className="lp-footer-link">Pricing</a>
            <Link href="/login" className="lp-footer-link">Sign in</Link>
            <Link href="/signup" className="lp-footer-link">Get started</Link>
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

const P = { width: 22, height: 22, fill: "none" as const, stroke: "#f87171", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const W = { width: 22, height: 22, fill: "none" as const, stroke: "#34d399", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ProbChaosIcon()  { return <svg viewBox="0 0 24 24" {...P}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function ProbLeakIcon()   { return <svg viewBox="0 0 24 24" {...P}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function ProbSlowIcon()   { return <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }

function WhySpeedIcon()   { return <svg viewBox="0 0 24 24" {...W}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function WhyFocusIcon()   { return <svg viewBox="0 0 24 24" {...W}><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>; }
function WhySimpleIcon()  { return <svg viewBox="0 0 24 24" {...W}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function WhyTeamIcon()    { return <svg viewBox="0 0 24 24" {...W}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

/* ─── Data ───────────────────────────────────────────────────── */

const PROOF: [string, string][] = [
  ["14-day", "free trial, no card needed"],
  ["Setup in", "under an hour"],
  ["Unlimited", "team members"],
  ["Works with", "Meta Cloud API"],
];

const CONVOS = [
  { initials: "MK", bg: "#7c3aed", name: "Maria K.",  time: "2m",  preview: "What's the delivery timeline for...", active: true  },
  { initials: "JR", bg: "#0891b2", name: "James R.",  time: "18m", preview: "Got your message, sounds good!",      unread: true  },
  { initials: "AL", bg: "#059669", name: "Amara L.",  time: "1h",  preview: "Can I get a quote for 500 units?",    unread: true  },
  { initials: "TN", bg: "#b45309", name: "Tom N.",    time: "3h",  preview: "Following up on the proposal..."                    },
  { initials: "SP", bg: "#be185d", name: "Sara P.",   time: "5h",  preview: "Thanks, looking forward to it!"                     },
];

const PROBLEMS = [
  { Icon: ProbChaosIcon, title: "Conversations lost in personal phones", desc: "Leads message your sales reps directly. When that rep is unavailable, the lead goes cold — and you never even knew it happened." },
  { Icon: ProbLeakIcon,  title: "No visibility into your pipeline",      desc: "You can't manage what you can't see. Without a shared system, deals slip through the cracks and follow-ups never happen." },
  { Icon: ProbSlowIcon,  title: "Slow, inconsistent responses",          desc: "Customers expect replies within minutes on WhatsApp. A slow response is a lost sale — and there's no way to know who's falling behind." },
];

const WHY = [
  { Icon: WhySpeedIcon,  title: "Built for speed",         desc: "Every screen is designed for fast triage. Open a conversation, reply, assign, and move on — in seconds, not minutes." },
  { Icon: WhyFocusIcon,  title: "WhatsApp-first, not last", desc: "We didn't bolt WhatsApp onto a generic CRM. The entire product is designed around how WhatsApp conversations actually work." },
  { Icon: WhySimpleIcon, title: "No IT project required",  desc: "Connect your WhatsApp Business account and invite your team. There's nothing to install, configure, or maintain." },
  { Icon: WhyTeamIcon,   title: "Your whole team, one inbox", desc: "Agents see only what's assigned to them. Managers see everything. No double-replies, no missed messages, no confusion." },
];

const FEATURES = [
  { Icon: FeatMsgIcon,       title: "Shared Inbox",    desc: "Stop losing leads in personal phones. Every inbound WhatsApp message lands in one shared inbox — assigned, tracked, and visible to your whole team.",           tag: "Team-ready"    },
  { Icon: FeatUsersIcon,     title: "Contact Records", desc: "Every conversation is tied to a contact. Full history, tags, custom fields, and notes — so anyone on your team can pick up where the last person left off.",    tag: "CRM core"      },
  { Icon: FeatPipelineIcon,  title: "Sales Pipelines", desc: "Move deals from first message to closed-won on a visual Kanban board. Track value, spot stuck deals, and know exactly where your revenue is at any moment.",    tag: "Deal tracking" },
  { Icon: FeatBroadcastIcon, title: "Broadcasts",      desc: "Re-engage your contact list with targeted WhatsApp campaigns. Segment by tag, personalise each message, and track delivery and read receipts.",                tag: "Bulk messaging"},
  { Icon: FeatZapIcon,       title: "Automations",     desc: "Follow up automatically when a lead goes quiet, tag contacts based on keywords, or trigger a webhook when a deal is won — all without writing a line of code.", tag: "No-code"       },
  { Icon: FeatGridIcon,      title: "Live Dashboard",  desc: "Know your team's pulse at a glance. Open conversations, response times, new contacts, and deal value — all updating in real time.",                            tag: "Analytics"     },
];

const STEPS = [
  { title: "Create your account",      desc: "Sign up with your work email. Invite teammates and set roles — admin, agent, or viewer. No IT department required." },
  { title: "Connect WhatsApp Business", desc: "Paste your Meta Cloud API credentials. WaCRM auto-configures the webhook and validates the connection in seconds." },
  { title: "Import your contacts",     desc: "Upload a CSV or let contacts flow in automatically as your first messages arrive. Tags and custom fields are ready out of the box." },
  { title: "Start selling",            desc: "Assign conversations to agents, move deals through your pipeline, and send your first broadcast — all before lunch." },
];

const METRICS = [
  { value: "6+",   label: "Built-in modules ready on day one"       },
  { value: "∞",    label: "Conversations — no per-message fees"     },
  { value: "<1hr", label: "Average onboarding time for new teams"   },
  { value: "14d",  label: "Free trial, no credit card needed"       },
];
