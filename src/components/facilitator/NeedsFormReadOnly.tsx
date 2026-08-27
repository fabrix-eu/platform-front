import { useQuery } from '@tanstack/react-query';
import { getForm, getVisibleQuestions, type FormQuestion } from '../../lib/forms';
import { getLatestAnswer } from '../../lib/answers';

const RATING_LABELS: Record<number, string> = {
  1: 'Not at all',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Very',
  5: 'Extremely',
};

function RatingChip({ value }: { value: unknown }) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!n || Number.isNaN(n)) {
    return <span className="text-xs text-gray-300 shrink-0">—</span>;
  }
  return (
    <span
      className="shrink-0 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full"
      title={RATING_LABELS[n]}
    >
      {n} · {RATING_LABELS[n] ?? ''}
    </span>
  );
}

function QuestionReadOnly({ question, response }: { question: FormQuestion; response: unknown }) {
  if (question.field_type === 'table') {
    const values = (response as Record<string, unknown>) ?? {};
    const rows = question.options?.rows ?? [];
    const answered = rows.filter((row) => {
      const v = values[row.value];
      return v !== undefined && v !== null && Number(v) > 0;
    });

    if (answered.length === 0) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{question.text}</p>
        <ul className="space-y-1">
          {answered.map((row) => (
            <li key={row.value} className="flex items-center justify-between gap-3 text-sm text-gray-700">
              <span className="min-w-0">{row.label}</span>
              <RatingChip value={values[row.value]} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const text = typeof response === 'string' ? response.trim() : '';
  if (!text) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{question.text}</p>
      <p className="text-sm text-gray-700 whitespace-pre-line">{text}</p>
    </div>
  );
}

/**
 * Read-only view of the organization's "Needs & Opportunities" onboarding
 * form — facilitators can consult it but only the organization edits it.
 * Only answered items are shown.
 */
export function NeedsFormReadOnly({ orgId }: { orgId: string }) {
  const formQuery = useQuery({
    queryKey: ['forms', 'needs-opportunities'],
    queryFn: () => getForm('needs-opportunities'),
  });

  const answerQuery = useQuery({
    queryKey: ['answers', 'latest', orgId, 'needs-opportunities'],
    queryFn: () => getLatestAnswer(orgId, 'needs-opportunities'),
    retry: false,
  });

  if (formQuery.isLoading || answerQuery.isLoading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  const form = formQuery.data;
  const responses = answerQuery.data?.responses as Record<string, unknown> | undefined;

  if (!form || !responses || Object.keys(responses).length === 0) {
    return (
      <p className="text-sm text-gray-400">
        The organization hasn't filled in their needs form yet.
      </p>
    );
  }

  const blocks = getVisibleQuestions(form, responses).map((question) => ({
    question,
    response: responses[question.key],
  }));

  return (
    <div className="space-y-5">
      {blocks.map(({ question, response }) => (
        <QuestionReadOnly key={question.id} question={question} response={response} />
      ))}
    </div>
  );
}
