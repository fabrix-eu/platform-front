import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { searchOrganizations, ORG_KINDS } from '../lib/organizations';
import type { OrganizationBasic } from '../lib/organizations';
import { FormError, FieldError } from '../components/FieldError';
import {
  GoogleAddressAutocomplete,
  type AddressData,
} from '../components/GoogleAddressAutocomplete';

type Step = 'search' | 'org' | 'account';

interface OrgData {
  name: string;
  kind: string;
  address: string;
  country_code: string;
  lat?: number;
  lon?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'search', label: 'Find' },
    { key: 'org', label: 'Organization' },
    { key: 'account', label: 'Account' },
  ];
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
              i <= currentIndex
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${
              i <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px ${
                i < currentIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Search ──────────────────────────────────────────────────────────

function SearchStep({
  onCreateNew,
}: {
  onCreateNew: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrganizationBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationBasic | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const orgs = await searchOrganizations(q.trim());
      setResults(orgs);
      setHasSearched(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setSelectedOrg(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by company name..."
          autoFocus
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Loading */}
      {isSearching && (
        <p className="text-center text-sm text-gray-400 py-6">Searching...</p>
      )}

      {/* Results */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-1">
          {results.map((org) => {
            const kindInfo = ORG_KINDS[org.kind] || ORG_KINDS.other;
            return (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selectedOrg?.id === org.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {org.image_url ? (
                  <img
                    src={org.image_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                    {getInitials(org.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{org.name}</p>
                  {org.address && (
                    <p className="text-xs text-gray-500 truncate">
                      {org.address}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${kindInfo.color}`}
                >
                  {kindInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected org message */}
      {selectedOrg && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>{selectedOrg.name}</strong> already exists. You can claim it
            after registering your account.
          </p>
        </div>
      )}

      {/* No results */}
      {!isSearching && hasSearched && results.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          No organizations found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Create new CTA */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500 mb-3">
          Can&apos;t find your company?
        </p>
        <button
          onClick={() => onCreateNew(query)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create a new organization
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Organization details ────────────────────────────────────────────

function OrgStep({
  initialData,
  onBack,
  onContinue,
}: {
  initialData: OrgData;
  onBack: () => void;
  onContinue: (data: OrgData) => void;
}) {
  const [name, setName] = useState(initialData.name);
  const [kind, setKind] = useState(initialData.kind);
  const [addressData, setAddressData] = useState<AddressData | null>(
    initialData.address
      ? {
          address: initialData.address,
          lat: initialData.lat ?? 0,
          lon: initialData.lon ?? 0,
          country_code: initialData.country_code,
        }
      : null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      name,
      kind,
      address: addressData?.address ?? '',
      country_code: addressData?.country_code ?? '',
      lat: addressData?.lat,
      lon: addressData?.lon,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization name
        </label>
        <input
          id="org-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label
          htmlFor="org-kind"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Type
        </label>
        <select
          id="org-kind"
          required
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
        >
          <option value="">Select a type...</option>
          {Object.entries(ORG_KINDS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </select>
      </div>

      <GoogleAddressAutocomplete
        onSelect={setAddressData}
        initialAddress={initialData.address}
        initialLocation={addressData}
        showMap={true}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Account ─────────────────────────────────────────────────────────

function AccountStep({
  orgData,
  onBack,
}: {
  orgData: OrgData;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/registrations/with_organization', {
        user: {
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
          password_confirmation: formData.get('password_confirmation'),
        },
        organization: {
          name: orgData.name,
          kind: orgData.kind,
          address: orgData.address,
          country_code: orgData.country_code,
          lat: orgData.lat,
          lon: orgData.lon,
        },
      }),
    onSuccess: () => {
      navigate({ to: '/verify-instructions' });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <FormError mutation={mutation} />

      <div>
        <label
          htmlFor="user-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your name
        </label>
        <input
          id="user-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="name" />
      </div>

      <div>
        <label
          htmlFor="user-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="email" />
      </div>

      <div>
        <label
          htmlFor="user-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="password" />
      </div>

      <div>
        <label
          htmlFor="user-password-confirmation"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm password
        </label>
        <input
          id="user-password-confirmation"
          name="password_confirmation"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="password_confirmation" />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={mutation.isPending}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function RegisterWithOrgPage() {
  const [step, setStep] = useState<Step>('search');
  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    kind: '',
    address: '',
    country_code: '',
  });

  const subtitle: Record<Step, string> = {
    search: 'Search for your company to get started',
    org: 'Tell us about your organization',
    account: 'Create your account to finish',
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-12 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Register with your organization
        </h1>
        <p className="text-gray-500 mt-1 text-sm">{subtitle[step]}</p>
      </div>

      <StepIndicator current={step} />

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {step === 'search' && (
          <SearchStep
            onCreateNew={(query) => {
              setOrgData((prev) => ({ ...prev, name: query.trim() }));
              setStep('org');
            }}
          />
        )}
        {step === 'org' && (
          <OrgStep
            initialData={orgData}
            onBack={() => setStep('search')}
            onContinue={(data) => {
              setOrgData(data);
              setStep('account');
            }}
          />
        )}
        {step === 'account' && (
          <AccountStep orgData={orgData} onBack={() => setStep('org')} />
        )}
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
