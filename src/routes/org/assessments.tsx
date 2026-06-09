import { useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getFormsWithAnswers } from '../../lib/forms';
import type { Form, FormWithAnswers } from '../../lib/forms';
import type { User } from '../../lib/auth';
import { FormIcon } from '../../components/FormIcon';

// ── Score helpers ────────────────────────────────────────────

type AssessmentStatus = 'completed' | 'pending' | 'not_started';

interface AnswerSummary {
  id: string;
  responses: Record<string, unknown>;
  normalized_score: number;
  status: string;
}

interface AssessmentData {
  form: Form;
  latestAnswer: AnswerSummary | null;
  status: AssessmentStatus;
  score: number | null;
  completionPct: number;
}

function computeStatus(answer: AnswerSummary | null): { status: AssessmentStatus; completionPct: number } {
  if (!answer) return { status: 'not_started', completionPct: 0 };
  switch (answer.status) {
    case 'completed':
      return { status: 'completed', completionPct: 100 };
    case 'in_progress':
      return { status: 'pending', completionPct: 50 };
    default:
      return { status: 'not_started', completionPct: 0 };
  }
}

function buildAssessments(formsWithAnswers: FormWithAnswers[]): AssessmentData[] {
  return formsWithAnswers.map((fw) => {
    // Latest answer = last in array (sorted by created_at desc from backend, or first)
    const sorted = [...fw.answers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const latestAnswer = sorted[0] ?? null;
    const { status, completionPct } = computeStatus(latestAnswer);
    const score =
      status === 'completed' && latestAnswer?.normalized_score != null
        ? Math.round(latestAnswer.normalized_score)
        : null;
    return { form: fw, latestAnswer, status, score, completionPct };
  });
}

// ── Radar chart ──────────────────────────────────────────────

function ImpactRadar({ assessments }: { assessments: AssessmentData[] }) {
  const data = assessments.map((a) => ({
    dimension: a.form.title,
    current: a.score ?? 0,
    target: 100,
  }));

  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="mx-auto aspect-square max-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500 }}
              className="text-gray-700"
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: 'currentColor', fontSize: 10 }}
              tickFormatter={(v) => `${v}`}
              angle={90}
              className="text-gray-400"
            />
            <Radar
              dataKey="target"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.08}
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Target"
            />
            <Radar
              dataKey="current"
              stroke="hsl(262.1 83.3% 57.8%)"
              fill="hsl(262.1 83.3% 57.8%)"
              fillOpacity={0.25}
              strokeWidth={2}
              name="Current"
            />
            <Legend
              iconType="line"
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const current = payload.find((p) => p.dataKey === 'current')?.value;
                return (
                  <div className="rounded-lg border bg-white p-2 shadow-md text-sm">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-primary">Score: {current}%</p>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Assessment card ──────────────────────────────────────────

function AssessmentCard({
  assessment,
  orgSlug,
}: {
  assessment: AssessmentData;
  orgSlug: string;
}) {
  const { form, status, score, completionPct } = assessment;

  const statusColors = {
    completed: 'bg-green-100 text-green-600',
    pending: 'bg-amber-100 text-amber-600',
    not_started: 'bg-gray-100 text-gray-400',
  };

  const statusText =
    status === 'completed'
      ? `Score: ${score}%`
      : status === 'pending'
        ? `In progress — ${completionPct}%`
        : 'Not started';

  const buttonText = status === 'completed' ? 'View Results' : status === 'pending' ? 'Continue' : 'Start';

  const href =
    status === 'completed'
      ? `/${orgSlug}/assessments/${form.key}/results`
      : `/${orgSlug}/assessments/${form.key}`;

  return (
    <div
      className={`bg-white border rounded-lg p-4 flex items-center justify-between gap-4 ${
        status === 'pending' ? 'border-amber-300 bg-amber-50/30' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${statusColors[status]}`}>
          <FormIcon iconName={form.icon_name} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{form.title}</p>
          <p className="text-xs text-gray-500">{statusText}</p>
        </div>
      </div>
      <Link
        to={href}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          status === 'completed'
            ? 'border border-border text-gray-700 hover:bg-gray-50'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function OrgAssessmentsPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const qc = useQueryClient();
  const me = qc.getQueryData<User>(['me']);

  // Find the org ID for this slug
  const orgId = me?.organizations.find((o) => o.organization_slug === orgSlug)?.organization_id;

  // Single call: GET /forms?organization_id=UUID returns forms + embedded answers
  const query = useQuery({
    queryKey: ['assessments', orgId],
    queryFn: async () => {
      const formsWithAnswers = await getFormsWithAnswers(orgId!);
      return buildAssessments(formsWithAnswers);
    },
    enabled: !!orgId,
  });

  const assessments = query.data ?? [];
  const hasCompleted = assessments.some((a) => a.status === 'completed');
  const isLoading = query.isLoading;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Impact Compass</h1>
        <p className="text-sm text-gray-500 mt-1">Assess your sustainability performance</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
          <p className="text-gray-500">No assessments available yet.</p>
        </div>
      ) : (
        <>
          {hasCompleted && <ImpactRadar assessments={assessments} />}

          <div className="space-y-3">
            {assessments.map((a) => (
              <AssessmentCard key={a.form.id} assessment={a} orgSlug={orgSlug} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
