import { useParams, useSearch, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getForm, isQuestionVisible } from '../../lib/forms';
import type { Form, FormQuestion } from '../../lib/forms';
import { getAnswer, getLatestAnswer, getAnswers } from '../../lib/answers';
import type { Answer } from '../../lib/answers';
import type { User } from '../../lib/auth';
import { FormIcon } from '../../components/FormIcon';

// ── Score helpers (encouraging purple palette) ──────────────

function getScoreCategory(score: number) {
  if (score >= 80)
    return {
      label: 'Advanced',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      barColor: 'bg-purple-600',
      badgeBg: 'bg-purple-600',
      description:
        "You're demonstrating strong circular and sustainable practices. Keep leading the way!",
    };
  if (score >= 60)
    return {
      label: 'Progressing Well',
      textColor: 'text-violet-700',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      barColor: 'bg-violet-500',
      badgeBg: 'bg-violet-500',
      description:
        "You're making meaningful progress. Your efforts are building a solid foundation.",
    };
  if (score >= 40)
    return {
      label: 'Building Foundations',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      barColor: 'bg-indigo-400',
      badgeBg: 'bg-indigo-400',
      description:
        "You've taken important first steps on your sustainability journey. Every action counts.",
    };
  return {
    label: 'Getting Started',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    barColor: 'bg-slate-400',
    badgeBg: 'bg-slate-400',
    description:
      'This is the beginning of your journey. Use the feedback below as your roadmap for growth.',
  };
}

// ── Scoring (handles N/A options with null points) ──────────

function calcSectionScores(form: Form, answer: Answer) {
  return (form.sections || []).map((section) => {
    let points = 0;
    let maxPoints = 0;

    section.questions.forEach((q) => {
      if (!isQuestionVisible(q, answer.responses)) return;
      const resp = answer.responses[q.key];
      if (!q.options?.choices) return;

      // If user selected an N/A option (points is null), skip this question
      if (resp && !Array.isArray(resp)) {
        const selected = q.options.choices.find((ch) => ch.value === resp);
        if (selected && selected.points === null) return;
      }

      const validChoices = q.options.choices.filter((c) => c.points != null);
      if (validChoices.length === 0) return;
      const maxC = validChoices.reduce((mx, c) => Math.max(mx, c.points!, 0), 0);
      maxPoints += maxC;

      if (resp) {
        if (Array.isArray(resp)) {
          (resp as string[]).forEach((v) => {
            const c = q.options?.choices?.find((ch) => ch.value === v);
            if (c?.points != null) points += c.points;
          });
        } else {
          const c = q.options.choices.find((ch) => ch.value === resp);
          if (c?.points != null) points += c.points;
        }
      }
    });

    const score = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
    return { title: section.title, score, category: getScoreCategory(score) };
  });
}

// ── Per-question helpers ────────────────────────────────────

function getQuestionFeedback(question: FormQuestion, response: unknown): string | null {
  const feedback = question.options?.feedback;
  if (!feedback || !response || typeof response !== 'string') return null;
  return feedback[response] || null;
}

function getSelectedChoice(question: FormQuestion, response: unknown) {
  if (!question.options?.choices || !response || typeof response !== 'string') return null;
  const choice = question.options.choices.find((c) => c.value === response);
  if (!choice) return null;
  const maxPoints = question.options.choices
    .filter((c) => c.points != null)
    .reduce((mx, c) => Math.max(mx, c.points!, 0), 0);
  return { label: choice.label, points: choice.points, maxPoints, isNA: choice.points === null };
}

// ── Priority actions ────────────────────────────────────────

interface PriorityAction {
  feedback: string;
  questionText: string;
  points: number;
  maxPoints: number;
  gap: number;
  knowledgeLink?: string | null;
}

function getPriorityActions(form: Form, answer: Answer): PriorityAction[] {
  const actions: PriorityAction[] = [];

  for (const section of form.sections) {
    for (const q of section.questions) {
      if (!isQuestionVisible(q, answer.responses)) continue;
      const resp = answer.responses[q.key];
      if (!resp || typeof resp !== 'string') continue;

      const feedback = getQuestionFeedback(q, resp);
      if (!feedback) continue;

      const selected = getSelectedChoice(q, resp);
      if (!selected || selected.isNA || selected.maxPoints === 0) continue;
      if (selected.points === selected.maxPoints) continue;

      const gap = (selected.maxPoints - (selected.points || 0)) / selected.maxPoints;
      actions.push({
        feedback,
        questionText: q.text,
        points: selected.points || 0,
        maxPoints: selected.maxPoints,
        gap,
        knowledgeLink: q.options?.knowledge_link,
      });
    }
  }

  actions.sort((a, b) => b.gap - a.gap);
  return actions.slice(0, 4);
}

// ── Score circle ────────────────────────────────────────────

function ScoreCircle({ score, textColor }: { score: number; textColor: string }) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={textColor}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-4xl font-bold font-display ${textColor}`}>{score}%</span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────

export function AssessmentResultsPage() {
  const { orgSlug, formId } = useParams({ strict: false }) as { orgSlug: string; formId: string };
  const { answerId } = useSearch({ strict: false }) as { answerId?: string };
  const qc = useQueryClient();
  const me = qc.getQueryData<User>(['me']);
  const orgId = me?.organizations.find((o) => o.organization_slug === orgSlug)?.organization_id;

  const formQuery = useQuery({
    queryKey: ['forms', formId],
    queryFn: () => getForm(formId),
  });

  const answerQuery = useQuery({
    queryKey: answerId ? ['answers', answerId] : ['answers', 'latest', orgId, formId],
    queryFn: () => (answerId ? getAnswer(answerId) : getLatestAnswer(orgId!, formId)),
    enabled: answerId ? true : !!orgId,
    staleTime: 0,
  });

  const historyQuery = useQuery({
    queryKey: ['answers', 'history', orgId, formQuery.data?.id],
    queryFn: () => getAnswers(orgId!, formQuery.data!.id),
    enabled: !!orgId && !!formQuery.data,
    staleTime: 0,
  });

  if (formQuery.isLoading || answerQuery.isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const form = formQuery.data;
  const answer = answerQuery.data;

  if (!form || !answer) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">
            No results available yet. Complete the assessment first.
          </p>
          <Link
            to="/$orgSlug/assessments/$formId"
            params={{ orgSlug, formId }}
            className="inline-block mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  const score = Math.round(answer.normalized_score || 0);
  const category = getScoreCategory(score);
  const sectionScores = calcSectionScores(form, answer);
  const allAnswers = historyQuery.data ?? [];
  const priorityActions = getPriorityActions(form, answer);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        to="/$orgSlug/assessments"
        params={{ orgSlug }}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to assessments
      </Link>

      {/* Main score card */}
      <div className={`border-2 rounded-lg p-8 ${category.borderColor} ${category.bgColor}`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreCircle score={score} textColor={category.textColor} />
          <div className="flex-1 text-center md:text-left">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-2 ${category.badgeBg}`}
            >
              {category.label}
            </span>
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-2 flex items-center gap-2">
              <FormIcon iconName={form.icon_name} className="w-6 h-6 text-primary shrink-0" />
              {form.title}
            </h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Priority actions */}
      {priorityActions.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
            Priority Actions
          </h3>
          <div className="space-y-4">
            {priorityActions.map((action, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{action.feedback}</p>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {action.questionText.length > 80
                        ? action.questionText.slice(0, 80) + '...'
                        : action.questionText}
                    </span>
                    <span className="text-xs font-medium text-purple-500">
                      {action.points}/{action.maxPoints} pts
                    </span>
                    {action.knowledgeLink && (
                      <a
                        href={action.knowledgeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Learn more
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section breakdown */}
      {sectionScores.length > 1 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
              />
            </svg>
            Score by Section
          </h3>
          <div className="space-y-4">
            {sectionScores.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{s.title}</span>
                  <span className={`text-sm font-bold ${s.category.textColor}`}>{s.score}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.category.barColor}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers detail by section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          Your Answers
        </h3>

          {form.sections.map((section) => {
            const answeredQuestions = section.questions.filter(
              (q) =>
                isQuestionVisible(q, answer.responses) &&
                answer.responses[q.key] != null &&
                answer.responses[q.key] !== '',
            );
            if (answeredQuestions.length === 0) return null;

            return (
              <div
                key={section.id}
                className="bg-white border border-border rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-border">
                  <h4 className="font-semibold text-gray-900">{section.title}</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {answeredQuestions.map((q) => {
                    const selected = getSelectedChoice(q, answer.responses[q.key]);
                    const feedback = getQuestionFeedback(q, answer.responses[q.key]);
                    const knowledgeLink = q.options?.knowledge_link;

                    return (
                      <div key={q.id} className="px-6 py-4">
                        <p className="text-sm text-gray-700">{q.text}</p>

                        {selected && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                              {selected.label}
                              {!selected.isNA && selected.maxPoints > 0 && (
                                <span className="text-purple-400">
                                  ({selected.points}/{selected.maxPoints})
                                </span>
                              )}
                              {selected.isNA && <span className="text-purple-400">N/A</span>}
                            </span>
                          </div>
                        )}

                        {feedback && (
                          <div className="mt-3 text-sm text-gray-600 bg-slate-50 rounded-lg p-3 border-l-2 border-purple-200">
                            {feedback}
                          </div>
                        )}

                        {knowledgeLink && (
                          <a
                            href={knowledgeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                              />
                            </svg>
                            Learn more
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* History */}
      {allAnswers.length > 1 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
            Assessment History
          </h3>
          <div className="space-y-2">
            {allAnswers.slice(0, 5).map((a) => {
              const aScore = Math.round(a.normalized_score || 0);
              const aCat = getScoreCategory(aScore);
              const isCurrent = a.id === answer.id;
              return (
                <Link
                  key={a.id}
                  to="/$orgSlug/assessments/$formId/results"
                  params={{ orgSlug, formId }}
                  search={{ answerId: a.id }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isCurrent ? 'bg-primary/10' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${aCat.barColor}`} />
                    <span className="text-sm text-gray-700">
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-200 text-gray-600">
                        Current
                      </span>
                    )}
                  </div>
                  <span className={`font-bold text-sm ${aCat.textColor}`}>{aScore}%</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/$orgSlug/assessments/$formId"
          params={{ orgSlug, formId }}
          search={{ new: true }}
          className="flex-1 text-center border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Retake Assessment
        </Link>
        <Link
          to="/$orgSlug/assessments"
          params={{ orgSlug }}
          className="flex-1 text-center bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to All Assessments
        </Link>
      </div>
    </div>
  );
}
