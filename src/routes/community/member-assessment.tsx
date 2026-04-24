import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { getForm, isQuestionVisible } from '../../lib/forms';
import type { FormQuestion } from '../../lib/forms';
import { getLatestAnswer } from '../../lib/answers';
import { getCommunityOrganization } from '../../lib/community-organizations';
import { useFacilitatorPanel } from '../../components/FacilitatorPanel';

function formatResponse(question: FormQuestion, value: unknown): string {
  if (value == null || value === '') return '—';

  if (question.field_type === 'select' && question.options?.choices) {
    const choice = question.options.choices.find((c) => c.value === value);
    return choice?.label || String(value);
  }

  if (question.field_type === 'multiselect' && Array.isArray(value) && question.options?.choices) {
    return (value as string[])
      .map((v) => question.options?.choices?.find((c) => c.value === v)?.label || v)
      .join(', ') || '—';
  }

  if (question.field_type === 'rating') {
    const max = question.options?.scale ? Math.max(...question.options.scale) : 5;
    return `${value} / ${max}`;
  }

  if (question.field_type === 'table' && typeof value === 'object' && question.options?.rows) {
    const entries = question.options.rows
      .filter((r) => (value as Record<string, unknown>)[r.value] != null)
      .map((r) => `${r.label}: ${(value as Record<string, unknown>)[r.value]}`);
    return entries.length > 0 ? entries.join('\n') : '—';
  }

  return String(value);
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-yellow-700';
  if (score >= 40) return 'text-orange-700';
  return 'text-red-700';
}

export function CommunityMemberAssessmentPage() {
  const { orgSlug, communitySlug, memberId, formKey } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    memberId: string;
    formKey: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const membershipQuery = useQuery({
    queryKey: ['community_organization', communitySlug, memberId],
    queryFn: () => getCommunityOrganization(communitySlug, memberId),
  });

  const orgId = membershipQuery.data?.organization_id;
  const orgName = membershipQuery.data?.organization.name;

  const formQuery = useQuery({
    queryKey: ['forms', formKey],
    queryFn: () => getForm(formKey),
  });

  const answerQuery = useQuery({
    queryKey: ['answers', 'latest', orgId, formKey],
    queryFn: () => getLatestAnswer(orgId!, formKey),
    enabled: !!orgId,
  });

  useFacilitatorPanel(
    isAdmin && orgName ? (
      <div className="space-y-3">
        <div className="bg-white/80 rounded-lg p-3">
          <p className="text-xs text-gray-400">Viewing assessment for</p>
          <p className="text-sm font-medium text-gray-700">{orgName}</p>
        </div>
      </div>
    ) : null,
  );

  if (formQuery.isLoading || answerQuery.isLoading || membershipQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const form = formQuery.data;
  const answer = answerQuery.data;

  if (!form) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">Assessment not found</p>
      </div>
    );
  }

  const backLink = (
    <Link
      to="/$orgSlug/communities/$communitySlug/members/$memberId"
      params={{ orgSlug, communitySlug, memberId }}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Back to {orgName || 'member'}
    </Link>
  );

  const score = answer ? Math.round(answer.normalized_score || 0) : null;
  const responses = answer?.responses ?? {};

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {backLink}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-gray-500 mt-1">{form.description}</p>
          )}
        </div>
        {score != null && (
          <div className="text-right">
            <p className={`text-2xl font-bold font-display ${getScoreColor(score)}`}>{score}%</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{answer!.status}</p>
          </div>
        )}
      </div>

      {!answer ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">This organization has not submitted this assessment yet.</p>
        </div>
      ) : (
        form.sections.map((section) => {
          const visibleQuestions = section.questions.filter((q) =>
            isQuestionVisible(q, responses),
          );
          if (visibleQuestions.length === 0) return null;

          return (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                {section.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {visibleQuestions.map((question) => {
                  const value = responses[question.key];
                  const hasAnswer = value != null && value !== '' &&
                    !(Array.isArray(value) && value.length === 0);
                  const formatted = formatResponse(question, value);

                  return (
                    <div key={question.id} className="px-5 py-3">
                      <p className="text-sm text-gray-600">{question.text}</p>
                      <p className={`text-sm mt-1 whitespace-pre-line ${hasAnswer ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                        {formatted}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
