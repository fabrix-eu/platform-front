import { useState } from 'react';
import { Link } from '@tanstack/react-router';

// ─── Types & Navigation ─────────────────────────────────────────────────

type Section =
  | 'home'
  | 'impact-compass'
  | 'community-ecosystem'
  | 'facilitator-tools'
  | 'getting-started'
  | 'directory-map'
  | 'organizations'
  | 'communities'
  | 'messaging';

interface NavGroup {
  title: string;
  items: { key: Section; label: string }[];
}

const NAV: NavGroup[] = [
  {
    title: 'Fabrix',
    items: [{ key: 'home', label: 'Home' }],
  },
  {
    title: 'Platform',
    items: [
      { key: 'impact-compass', label: 'Impact Compass' },
      { key: 'community-ecosystem', label: 'Community & Ecosystem' },
      { key: 'facilitator-tools', label: 'Facilitator Tools' },
    ],
  },
  {
    title: 'Guide',
    items: [
      { key: 'getting-started', label: 'Getting started' },
      { key: 'directory-map', label: 'Directory & Map' },
      { key: 'organizations', label: 'Organizations' },
      { key: 'communities', label: 'Communities' },
      { key: 'messaging', label: 'Messaging' },
    ],
  },
];

// ─── Shared components ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mb-4">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
      <p className="text-sm text-primary/90">{children}</p>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function CTA({ to, children, variant = 'primary' }: { to: string; children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────

function CompassIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 6 6.207-1.553A2.25 2.25 0 0 1 19.5 6.66v9.345a2.25 2.25 0 0 1-1.49 2.118l-.702.234a2.25 2.25 0 0 1-1.558-.043L12 16.5l-4.25 1.766a2.25 2.25 0 0 1-1.558.043l-.702-.234A2.25 2.25 0 0 1 4 15.916V6.572a2.25 2.25 0 0 1 2.793-2.185L10.5 6Z" />
    </svg>
  );
}

function NetworkIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

function WrenchIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.048.58.024 1.194-.14 1.743Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ─── Marketing: Home ────────────────────────────────────────────────────

function HomeContent() {
  return (
    <div className="-mx-8 -mt-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-primary/5 px-8 pt-12 pb-10 border-b border-border">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Circular Textile Platform
        </p>
        <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight mb-4">
          Build a sustainable textile<br />future, together.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed max-w-lg mb-6">
          Fabrix connects organizations, facilitators, and researchers across Europe
          to accelerate the transition to a circular textile economy.
        </p>
        <div className="flex items-center gap-3">
          <CTA to="/register">Join the platform <ArrowRightIcon /></CTA>
          <CTA to="/login" variant="secondary">Sign in</CTA>
        </div>
      </div>

      {/* Three pillars */}
      <div className="px-8 py-10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Three pillars
        </p>
        <div className="grid gap-4">
          <PillarCard
            icon={<CompassIcon className="w-5 h-5" />}
            color="bg-emerald-50 text-emerald-600 border-emerald-200"
            title="Impact Compass"
            description="Measure, improve, and certify your sustainability practices across 7 dimensions. Earn a label for your products."
          />
          <PillarCard
            icon={<NetworkIcon className="w-5 h-5" />}
            color="bg-blue-50 text-blue-600 border-blue-200"
            title="Community & Ecosystem"
            description="Find partners, materials, services, and equipment across the full circular textile value chain."
          />
          <PillarCard
            icon={<WrenchIcon className="w-5 h-5" />}
            color="bg-amber-50 text-amber-600 border-amber-200"
            title="Facilitator Tools"
            description="Track member needs, match organizations, manage communities, and accelerate the circular transition."
          />
        </div>
      </div>

      {/* For organizations */}
      <div className="px-8 py-10 border-t border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">For organizations</span>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mt-3 mb-2">
          Grow your circular business
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          Whether you design, produce, collect, sort, or recycle — Fabrix gives you
          the tools and connections to thrive in the circular textile ecosystem.
        </p>
        <div className="space-y-3">
          <BenefitRow text="Assess your sustainability maturity across eco-design, manufacturing, supply chain, social impact, and more" />
          <BenefitRow text="Discover and connect with complementary partners through the interactive map and marketplace" />
          <BenefitRow text="List your materials, services, capacities, and products on the marketplace" />
          <BenefitRow text="Join communities to access events, challenges, matchmaking, and facilitator support" />
          <BenefitRow text="Earn the Impact Compass label to showcase your commitment on your products" />
        </div>
      </div>

      {/* For facilitators */}
      <div className="px-8 py-10 border-t border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">For facilitators</span>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mt-3 mb-2">
          Empower your territory
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          As a community manager, you are the catalyst of the circular transition.
          Fabrix gives you a CRM built for textile ecosystems.
        </p>
        <div className="space-y-3">
          <BenefitRow text="Track every organization in your territory — needs, performance, opportunities" />
          <BenefitRow text="Oversee Impact Compass assessments and identify priority actions for each member" />
          <BenefitRow text="Auto-generate matchmaking between organizations based on proximity, capabilities, and roles" />
          <BenefitRow text="Organize events, challenges, and discussions to activate your community" />
          <BenefitRow text="Manage shared spaces, subsidies, and incubation programs" />
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-10 border-t border-border bg-gray-50/50">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-display font-bold text-primary">7</p>
            <p className="text-xs text-gray-500 mt-1">Assessment<br />dimensions</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-primary">150+</p>
            <p className="text-xs text-gray-500 mt-1">Marketplace<br />categories</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-primary">12</p>
            <p className="text-xs text-gray-500 mt-1">Organization<br />types</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-8 py-10 border-t border-border text-center">
        <h2 className="text-lg font-display font-bold text-gray-900 mb-2">
          Ready to join the circular textile ecosystem?
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Create your account in 2 minutes. Free for organizations and facilitators.
        </p>
        <CTA to="/register">Create your account <ArrowRightIcon /></CTA>
      </div>
    </div>
  );
}

function PillarCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-white hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircleIcon />
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Marketing: Impact Compass ──────────────────────────────────────────

function ImpactCompassContent() {
  return (
    <div className="-mx-8 -mt-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 px-8 pt-10 pb-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CompassIcon className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Impact Compass</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-3">
          Measure your impact.<br />Earn your label.
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-md">
          The Impact Compass evaluates your organization across 7 dimensions of
          circular economy, sustainability, and business innovation. Complete the
          assessments, get actionable recommendations, and earn a label you can
          display on your products.
        </p>
      </div>

      {/* 7 dimensions */}
      <div className="px-8 py-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          7 dimensions
        </p>
        <div className="space-y-4">
          <DimensionCard
            number="1"
            title="Ecodesign Decisions"
            description="Design for recyclability, material selection, hazardous substance elimination, and product longevity."
            color="bg-emerald-500"
          />
          <DimensionCard
            number="2"
            title="Environmental Management"
            description="Carbon footprint, renewable energy, ISO 14001 certification, and environmental supplier criteria."
            color="bg-teal-500"
          />
          <DimensionCard
            number="3"
            title="Manufacturing Efficiency"
            description="Waste minimization, energy and water reduction, industrial symbiosis, and lean manufacturing."
            color="bg-cyan-500"
          />
          <DimensionCard
            number="4"
            title="Supply Chain Management"
            description="Human rights, transparency, traceability, local engagement, and ethical sourcing."
            color="bg-blue-500"
          />
          <DimensionCard
            number="5"
            title="Distribution & Retail"
            description="Logistics optimization, repair services, product-as-a-service, take-back schemes, and EPR compliance."
            color="bg-indigo-500"
          />
          <DimensionCard
            number="6"
            title="Social Capital"
            description="Internal trust, external partnerships, community relationships, and shared sustainability vision."
            color="bg-violet-500"
          />
          <DimensionCard
            number="7"
            title="Innovation & Business Model"
            description="Technology adoption, absorptive capability, business model novelty, and resilience after disruption."
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="px-8 py-8 border-t border-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          How it works
        </p>
        <div className="space-y-5">
          <StepItem step="1" title="Complete the assessments" description="Answer questions at your own pace. Your progress is saved automatically — pause and come back anytime." />
          <StepItem step="2" title="Get your scores and recommendations" description="See your score (0–100%) for each dimension, with priority actions and feedback on every answer." />
          <StepItem step="3" title="Earn the Impact Compass label" description="Reach the threshold and display the Impact Compass label on your products, website, and communications." />
        </div>
      </div>

      {/* Scoring */}
      <div className="px-8 py-8 border-t border-border bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Scoring levels
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ScoreLevel color="bg-emerald-500" range="80–100%" label="Advanced" description="Strong circular practices" />
          <ScoreLevel color="bg-blue-500" range="60–79%" label="Progressing" description="Meaningful progress" />
          <ScoreLevel color="bg-amber-500" range="40–59%" label="Building" description="Foundations in place" />
          <ScoreLevel color="bg-gray-400" range="0–39%" label="Starting" description="Beginning the journey" />
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 py-8 border-t border-border text-center">
        <p className="text-sm text-gray-600 mb-4">
          Start measuring your impact today.
        </p>
        <CTA to="/register">Create your account <ArrowRightIcon /></CTA>
      </div>
    </div>
  );
}

function DimensionCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepItem({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ScoreLevel({
  color,
  range,
  label,
  description,
}: {
  color: string;
  range: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-white">
      <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />
      <div>
        <p className="text-xs font-semibold text-gray-900">
          {range} <span className="text-gray-500 font-normal">— {label}</span>
        </p>
        <p className="text-[11px] text-gray-400">{description}</p>
      </div>
    </div>
  );
}

// ─── Marketing: Community & Ecosystem ───────────────────────────────────

function CommunityEcosystemContent() {
  return (
    <div className="-mx-8 -mt-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 px-8 pt-10 pb-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
            <NetworkIcon className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Community & Ecosystem</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-3">
          Find your partners.<br />Build your network.
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-md">
          Fabrix maps the entire circular textile ecosystem — from raw materials to
          end-of-life. Discover organizations, browse the marketplace, and join
          communities to build meaningful partnerships.
        </p>
      </div>

      {/* Value chain */}
      <div className="px-8 py-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          The circular value chain
        </p>
        <div className="space-y-2.5">
          <ChainStage color="bg-emerald-500" label="Materials" description="Natural fibres, recycled fibres, yarns, fabrics, certified materials, waste streams" />
          <ChainArrow />
          <ChainStage color="bg-amber-500" label="Capacities" description="Equipment, facilities, shared spaces, workforce expertise, financing programs" />
          <ChainArrow />
          <ChainStage color="bg-blue-500" label="Services" description="Production, sorting, design, logistics, consulting, certification, end-of-life management" />
          <ChainArrow />
          <ChainStage color="bg-rose-500" label="Products" description="Apparel, home textiles, technical textiles, upcycled and zero-waste collections" />
          <ChainArrow />
          <ChainStage color="bg-violet-500" label="Distribution" description="Retail, wholesale, e-commerce, resale platforms, rental and subscription" />
        </div>
      </div>

      {/* Marketplace */}
      <div className="px-8 py-8 border-t border-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Marketplace
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          List and discover materials, services, capacities, and products from
          organizations across Europe. Filter by category, location, and type.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <MarketplaceStat number="40+" label="Material subcategories" />
          <MarketplaceStat number="37" label="Service types" />
          <MarketplaceStat number="24" label="Capacity categories" />
          <MarketplaceStat number="10+" label="Product categories" />
        </div>
      </div>

      {/* Community features */}
      <div className="px-8 py-8 border-t border-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Community features
        </p>
        <div className="space-y-3">
          <BenefitRow text="Join communities managed by local facilitators who support your territory" />
          <BenefitRow text="Participate in events — workshops, conferences, networking sessions" />
          <BenefitRow text="Apply to challenges — find partners for specific projects and win opportunities" />
          <BenefitRow text="Get matched with complementary organizations through smart matchmaking" />
          <BenefitRow text="Access discussion spaces to share knowledge and build relationships" />
        </div>
      </div>

      {/* Discovery */}
      <div className="px-8 py-8 border-t border-border bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Discover organizations
        </p>
        <div className="space-y-3">
          <BenefitRow text="Interactive map — see every organization in Europe, color-coded by type" />
          <BenefitRow text="Directory with search, filters by type, claimed status, and location radius" />
          <BenefitRow text="12 organization types: producers, recyclers, designers, collectors, brands, and more" />
          <BenefitRow text="Organization profiles with relations, assessments, communities, and contact" />
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 py-8 border-t border-border text-center">
        <p className="text-sm text-gray-600 mb-4">
          Your next partner is already on Fabrix.
        </p>
        <CTA to="/register">Join the ecosystem <ArrowRightIcon /></CTA>
      </div>
    </div>
  );
}

function ChainStage({ color, label, description }: { color: string; label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white">
      <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0 mt-1`} />
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ChainArrow() {
  return (
    <div className="flex justify-center">
      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
      </svg>
    </div>
  );
}

function MarketplaceStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-white text-center">
      <p className="text-lg font-display font-bold text-primary">{number}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Marketing: Facilitator Tools ───────────────────────────────────────

function FacilitatorToolsContent() {
  return (
    <div className="-mx-8 -mt-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 px-8 pt-10 pb-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
            <WrenchIcon className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Facilitator Tools</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-3">
          Your CRM for the<br />circular textile transition.
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-md">
          As a community manager, you need to see the big picture and act on the
          details. Fabrix gives you everything to track, support, and connect
          the organizations in your territory.
        </p>
      </div>

      {/* Member tracking */}
      <div className="px-8 py-8">
        <ToolSection
          title="Member tracking"
          description="A complete view of every organization in your community."
          features={[
            'Member directory with search, filters by type, and card/list views',
            'Detailed profiles with private facilitator notes',
            'Organization data — employees, turnover, NACE codes, specialties',
            'Needs & opportunities tracking to understand what members are looking for',
          ]}
        />
      </div>

      {/* Assessment oversight */}
      <div className="px-8 py-8 border-t border-border">
        <ToolSection
          title="Assessment oversight"
          description="Monitor every member's sustainability journey."
          features={[
            'See all 7 Impact Compass scores for each member at a glance',
            'Track assessment status — not started, in progress, or completed',
            'Read detailed answers and identify priority improvement areas',
            'Compare members and spot patterns across your community',
          ]}
        />
      </div>

      {/* Matchmaking */}
      <div className="px-8 py-8 border-t border-border">
        <ToolSection
          title="Smart matchmaking"
          description="Auto-generate connections between organizations."
          features={[
            'Matching engine based on proximity, capabilities, and roles',
            'Scored matches (0–100) with detailed breakdown',
            'Relation types: input/output, services, R&D, energy, shareholder',
            'Bulk regeneration of matches for your entire community',
          ]}
        />
      </div>

      {/* Community management */}
      <div className="px-8 py-8 border-t border-border">
        <ToolSection
          title="Community management"
          description="Activate your ecosystem with events, challenges, and spaces."
          features={[
            'Create and manage events — workshops, meetups, webinars',
            'Launch challenges to drive innovation and connect members',
            'Review challenge applications, accept, reject, and select winners',
            'Manage discussion spaces for community conversations',
            'Define your territory with geographic center and radius',
          ]}
        />
      </div>

      {/* Admin */}
      <div className="px-8 py-8 border-t border-border bg-gray-50/50">
        <ToolSection
          title="Administration"
          description="Manage access, invitations, and your facilitator team."
          features={[
            'Add and remove community members',
            'Invite new admins and manage facilitator roles',
            'Review join requests from organizations',
            'Send and track organization invitations',
          ]}
        />
      </div>

      {/* CTA */}
      <div className="px-8 py-8 border-t border-border text-center">
        <p className="text-sm text-gray-600 mb-4">
          Ready to manage your textile ecosystem?
        </p>
        <CTA to="/register-facilitator">Register as facilitator <ArrowRightIcon /></CTA>
      </div>
    </div>
  );
}

function ToolSection({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="space-y-2.5">
        {features.map((f, i) => (
          <BenefitRow key={i} text={f} />
        ))}
      </div>
    </div>
  );
}

// ─── Guide: Getting Started ─────────────────────────────────────────────

function GettingStartedContent() {
  return (
    <div>
      <SectionTitle>Getting started</SectionTitle>
      <P>
        Welcome to Fabrix! Here&apos;s how to get started on the platform.
      </P>

      <Feature title="1. Create your account">
        Register as an <strong>organization</strong> (SME, brand, recycler...),
        a <strong>facilitator</strong> (community manager), or a <strong>basic user</strong>.
        If your organization is already in the directory, you can claim it during registration.
      </Feature>

      <Feature title="2. Complete your profile">
        Add your address, activity type, description, and photos. A complete
        profile helps other organizations and facilitators find and connect with you.
      </Feature>

      <Feature title="3. Explore the ecosystem">
        Browse the directory and map to discover organizations in the circular
        textile space. Use the marketplace to find materials, services, and partners.
      </Feature>

      <Feature title="4. Join a community">
        Request to join a community managed by a local facilitator. Access events,
        challenges, matchmaking, and discussion spaces.
      </Feature>

      <Feature title="5. Take the Impact Compass">
        Complete the 7 sustainability assessments to understand your strengths,
        get recommendations, and earn the Impact Compass label.
      </Feature>

      <Tip>
        Use the sidebar on the left to navigate between your organizations,
        communities, and the global explorer.
      </Tip>
    </div>
  );
}

// ─── Guide: Directory & Map ─────────────────────────────────────────────

function DirectoryMapContent() {
  return (
    <div>
      <SectionTitle>Directory & Map</SectionTitle>
      <P>
        The directory and interactive map are the central discovery tools on Fabrix.
      </P>

      <Feature title="Directory">
        Browse all organizations with search, pagination, and filters. Toggle between
        list and card views. Filter by organization type, claimed status, country,
        or location radius.
      </Feature>

      <Feature title="Interactive map">
        See every organization in Europe on a color-coded map. Each organization type
        has a distinct color. Click markers to view profiles. Use the legend to toggle
        types on and off.
      </Feature>

      <Feature title="Organization profiles">
        Click any organization to see their public profile — description, location,
        communities, relations, and contact information. Use the Message button to
        start a conversation.
      </Feature>

      <Feature title="Value chain view">
        Visualize how organizations distribute across the circular value chain —
        materials, capacities, services, products, and distribution.
      </Feature>
    </div>
  );
}

// ─── Guide: Organizations ───────────────────────────────────────────────

function OrganizationsContent() {
  return (
    <div>
      <SectionTitle>Managing your organization</SectionTitle>
      <P>
        Your organization is your home on Fabrix. Manage your profile, relations,
        assessments, and team from the organization sidebar.
      </P>

      <Feature title="Dashboard">
        Overview of your activity — relations, completed assessments, and communities.
        Your communities are listed in the sidebar for quick access.
      </Feature>

      <Feature title="Profile">
        Multi-section management: Informations, Specialties, Data (employees, turnover),
        Sustainability practices, Needs & Opportunities, and Photos. A complete profile
        makes it easier for partners and facilitators to find you.
      </Feature>

      <Feature title="Relations">
        View your supply chain connections on an interactive map and searchable list.
        Relations represent partnerships — suppliers, clients, collaborators.
      </Feature>

      <Feature title="Impact Compass">
        Take all 7 assessments, track your scores over time, and view detailed
        recommendations. See the Impact Compass section for full details.
      </Feature>

      <Feature title="Listings">
        Manage your marketplace listings — materials, services, capacities, and
        products you offer or need.
      </Feature>

      <Feature title="Settings & Members">
        Manage team members, roles (Owner/Member), and invitations. Review join
        requests and control who has access to your organization.
      </Feature>

      <Tip>
        Switch between your organizations at any time using the dropdown in the
        top-left corner.
      </Tip>
    </div>
  );
}

// ─── Guide: Communities ─────────────────────────────────────────────────

function CommunitiesContent() {
  return (
    <div>
      <SectionTitle>Communities</SectionTitle>
      <P>
        Communities are groups of organizations managed by facilitators, focused
        on a geographic area or thematic topic in circular textile.
      </P>

      <Feature title="Joining a community">
        Browse public communities from the explorer. Request to join — facilitators
        will review your application. Once accepted, access all community features
        through your organization sidebar.
      </Feature>

      <Feature title="Overview">
        See a map of members, recent events, active challenges, and latest
        discussions at a glance.
      </Feature>

      <Feature title="Members">
        Browse community members with search and filters. Click a member to see
        their full profile in the community context.
      </Feature>

      <Feature title="Events">
        View upcoming and past events. RSVP with Going, Maybe, or Not Going.
        Community admins and event creators can manage events.
      </Feature>

      <Feature title="Challenges">
        Challenges are calls for participation. Browse active challenges, submit
        applications, and track outcomes. Any member can create a challenge.
      </Feature>

      <Feature title="Matchmaking">
        Get matched with complementary organizations based on proximity,
        capabilities, and roles. Facilitators can generate matches for the
        entire community.
      </Feature>
    </div>
  );
}

// ─── Guide: Messaging ───────────────────────────────────────────────────

function MessagingContent() {
  return (
    <div>
      <SectionTitle>Messaging</SectionTitle>
      <P>
        Fabrix has two types of messaging: personal (user-to-user) and
        organizational (user-to-organization).
      </P>

      <Feature title="Personal messages">
        Direct conversations between users. Access from the envelope icon in the
        top navigation or the Messages link in the explorer sidebar.
      </Feature>

      <Feature title="Organization messages">
        Contact an organization from their profile using the Message button. All
        organization members can see and reply to these conversations. Access from
        the Messages link in the organization sidebar.
      </Feature>

      <Feature title="Notifications">
        Stay informed with the notification bell — join requests, new events,
        challenge updates, and new community members. Mark as read individually
        or all at once.
      </Feature>

      <Tip>
        Personal messages are for direct conversations. Organization messages are
        for business inquiries visible to the whole team.
      </Tip>
    </div>
  );
}

// ─── Content map ────────────────────────────────────────────────────────

const CONTENT: Record<Section, () => React.ReactNode> = {
  home: HomeContent,
  'impact-compass': ImpactCompassContent,
  'community-ecosystem': CommunityEcosystemContent,
  'facilitator-tools': FacilitatorToolsContent,
  'getting-started': GettingStartedContent,
  'directory-map': DirectoryMapContent,
  organizations: OrganizationsContent,
  communities: CommunitiesContent,
  messaging: MessagingContent,
};

// ─── Page ───────────────────────────────────────────────────────────────

export function DocsPage() {
  const [active, setActive] = useState<Section>('home');
  const Content = CONTENT[active];

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex-shrink-0 flex flex-col min-h-[calc(100vh-56px)]">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            Documentation
          </h2>
        </div>

        <nav className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {NAV.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <button
                        onClick={() => setActive(item.key)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          active === item.key
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-2 border-t border-border bg-white sticky bottom-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to app
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <Content />
        </div>
      </div>
    </div>
  );
}
