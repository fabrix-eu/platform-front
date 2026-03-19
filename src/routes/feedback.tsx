import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BASE, ApiError } from '../lib/api';
import { FormError, FieldError } from '../components/FieldError';

const CATEGORIES = [
  { value: 'bug', label: 'Bug report', description: 'Something is broken or not working as expected' },
  { value: 'feature', label: 'Feature request', description: 'Suggest a new feature or improvement' },
  { value: 'question', label: 'Question', description: 'Ask a question about how something works' },
];

export function FeedbackPage() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('feedback[category]', category);
      formData.append('feedback[message]', message);
      if (file) {
        formData.append('screenshot', file);
      }

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE}/feedbacks`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new ApiError(res.status, json.errors || {}, json.error);
      }
      return json.data;
    },
  });

  const isPending = mutation.isPending;

  if (mutation.isSuccess) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your feedback!</h2>
        <p className="text-sm text-gray-500 mb-6">We read every submission and will use it to improve Fabrix.</p>
        <button
          onClick={() => {
            mutation.reset();
            setCategory('');
            setMessage('');
            setFile(null);
          }}
          className="text-sm text-primary hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">
          Help us improve Fabrix. Report a bug, suggest a feature, or ask a question.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-5"
      >
        <FormError mutation={mutation} />

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            What kind of feedback?
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  category === cat.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </label>
            ))}
          </div>
          <FieldError mutation={mutation} field="category" />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your feedback in detail..."
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-between mt-1">
            <FieldError mutation={mutation} field="message" />
            <p className="text-xs text-gray-400">{message.length} / 10 min</p>
          </div>
        </div>

        {/* Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Screenshot <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          {file ? (
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <svg className="h-6 w-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Click to attach a screenshot</p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5 MB</p>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && selected.size <= 5 * 1024 * 1024) {
                setFile(selected);
              }
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !category || message.length < 10}
          className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Sending...' : 'Send feedback'}
        </button>
      </form>
    </div>
  );
}
