import { useState, useRef, useCallback } from 'react';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '../../lib/organizations';
import { getOrganizationPhotos, createOrganizationPhoto, deleteOrganizationPhoto } from '../../lib/organization-photos';
import {
  useListings,
  useDeleteListing,
  getListings,
  listingKeys,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { Listing } from '../../lib/listings';
import { getForm } from '../../lib/forms';
import { getLatestAnswer, createAnswer, updateAnswer } from '../../lib/answers';
import { uploadFile } from '../../lib/uploads';
import { GoogleAddressAutocomplete } from '../../components/GoogleAddressAutocomplete';
import type { AddressData } from '../../components/GoogleAddressAutocomplete';
import { FieldError, FormError } from '../../components/FieldError';
import { KindSelect } from '../../components/KindSelect';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';
import { NaceCodeSelector } from '../../components/NaceCodeSelector';
import { FacilityTypeSelector } from '../../components/FacilityTypeSelector';
import {
  getAllChallenges,
  createGlobalChallenge,
  updateGlobalChallenge,
  deleteGlobalChallenge,
  getGlobalApplications,
  acceptGlobalApplication,
  rejectGlobalApplication,
  selectGlobalWinner,
} from '../../lib/community-challenges';
import type { Challenge, ChallengeApplication } from '../../lib/community-challenges';
import { challengeStateBadge, challengeAppStatusBadge } from '../../components/ChallengeShared';

// ─── Section nav ──────────────────────────────────────────────────────────────

type SectionId = 'informations' | 'data' | 'sustainability' | 'needs' | 'photos' | 'services' | 'materials' | 'products' | 'capacities' | 'challenges';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'informations', label: 'Information' },
  { id: 'data', label: 'Data' },
  // { id: 'sustainability', label: 'Sustainability & Community' },
  { id: 'needs', label: 'Needs & Opportunities' },
  { id: 'photos', label: 'Photos' },
  { id: 'services', label: 'Services' },
  { id: 'materials', label: 'Materials' },
  { id: 'capacities', label: 'Capacities' },
  { id: 'products', label: 'Products' },
  { id: 'challenges', label: 'Challenges' },
];

// ─── Informations section ─────────────────────────────────────────────────────

function InformationsSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;

  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setName(org.name || '');
    setKind(org.kind || '');
    setDescription(org.description || '');
    setWebsite(org.website || '');
    setEmail(org.email || '');
    setPhone(org.phone || '');
    setLinkedin(org.linkedin || '');
    setInstagram(org.instagram || '');
    if (org.address && org.lat && org.lon) {
      setAddressData({
        address: org.address,
        lat: org.lat,
        lon: org.lon,
        country_code: org.country_code || '',
      });
    }
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrganization(orgSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      name,
      kind: kind || null,
      description: description || null,
      website: website || null,
      email: email || null,
      phone: phone || null,
      linkedin: linkedin || null,
      instagram: instagram || null,
    };

    if (addressData) {
      data.address = addressData.address;
      data.lat = addressData.lat;
      data.lon = addressData.lon;
      data.country_code = addressData.country_code;
    }

    mutation.mutate(data);
  };

  if (!org) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError mutation={mutation} />

      {mutation.isSuccess && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Organization updated successfully.
        </p>
      )}

      {/* Name */}
      <div>
        <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="name" />
      </div>

      {/* Kind */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Organization type
        </label>
        <KindSelect value={kind} onChange={setKind} />
        <FieldError mutation={mutation} field="kind" />
      </div>

      {/* Address */}
      <div>
        <GoogleAddressAutocomplete
          onSelect={(data) => setAddressData(data)}
          initialLocation={addressData}
        />
        <FieldError mutation={mutation} field="address" />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="org-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="org-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="description" />
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org-website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            id="org-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="website" />
        </div>

        <div>
          <label htmlFor="org-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="org-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="email" />
        </div>
      </div>

      <div className="sm:w-1/2">
        <label htmlFor="org-phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          id="org-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="phone" />
      </div>

      {/* Social links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org-linkedin" className="block text-sm font-medium text-gray-700">
            LinkedIn
          </label>
          <input
            id="org-linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/company/..."
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="linkedin" />
        </div>

        <div>
          <label htmlFor="org-instagram" className="block text-sm font-medium text-gray-700">
            Instagram
          </label>
          <input
            id="org-instagram"
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/..."
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="instagram" />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// ─── Data section ─────────────────────────────────────────────────────────────

function DataSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const dataInfo = useFeatureInfo('data-privacy');

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;

  const [numberOfWorkers, setNumberOfWorkers] = useState('');
  const [turnover, setTurnover] = useState('');
  const [developmentStage, setDevelopmentStage] = useState('');
  const [naceCode, setNaceCode] = useState('');
  const [secondaryNaceCodes, setSecondaryNaceCodes] = useState<string[]>([]);
  const [selectedFacilityTypes, setSelectedFacilityTypes] = useState<string[]>([]);
  const [selectedProcessingTypes, setSelectedProcessingTypes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setNumberOfWorkers(org.number_of_workers != null ? String(org.number_of_workers) : '');
    setTurnover(org.turnover != null ? String(org.turnover) : '');
    setDevelopmentStage(org.development_stage || '');
    setNaceCode(org.nace_code || '');
    setSecondaryNaceCodes(org.secondary_nace_codes || []);
    setSelectedFacilityTypes(org.facility_types || []);
    setSelectedProcessingTypes(org.processing_types || []);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrganization(orgSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      number_of_workers: numberOfWorkers ? Number(numberOfWorkers) : null,
      turnover: turnover ? Number(turnover) : null,
      development_stage: developmentStage || null,
      nace_code: naceCode || null,
      secondary_nace_codes: secondaryNaceCodes,
      facility_types: selectedFacilityTypes,
      processing_types: selectedProcessingTypes,
    });
  };

  if (!org) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FeatureIntro
        info={dataInfo}
        title="Your data stays private"
        description="This information is never displayed on your public profile. It is used exclusively to produce anonymous, aggregated statistics that help researchers and policymakers optimize local textile ecosystems, improve access to funding, inform urban planning decisions, and shape better legislation for the circular economy."
      />

      <FormError mutation={mutation} />

      {mutation.isSuccess && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Data updated successfully.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org-workers" className="block text-sm font-medium text-gray-700">
            Number of employees
          </label>
          <input
            id="org-workers"
            type="number"
            min="0"
            value={numberOfWorkers}
            onChange={(e) => setNumberOfWorkers(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="number_of_workers" />
        </div>

        <div>
          <label htmlFor="org-turnover" className="block text-sm font-medium text-gray-700">
            Annual turnover
          </label>
          <div className="relative mt-1">
            <input
              id="org-turnover"
              type="number"
              min="0"
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
          </div>
          <FieldError mutation={mutation} field="turnover" />
        </div>
      </div>

      {/* Development stage */}
      <div>
        <label htmlFor="org-dev-stage" className="block text-sm font-medium text-gray-700">
          Development stage
        </label>
        <p className="text-xs text-gray-400 mb-1.5">Define the development maturity of your organization</p>
        <select
          id="org-dev-stage"
          value={developmentStage}
          onChange={(e) => setDevelopmentStage(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select...</option>
          <option value="startup">1-5 years (Start-up)</option>
          <option value="growth">2-10 years (Growth)</option>
          <option value="maturing">5-20 years (Maturing)</option>
          <option value="expansion">10 years + (Expansion or renewal)</option>
          <option value="succession">Succession or exit</option>
        </select>
        <FieldError mutation={mutation} field="development_stage" />
      </div>

      {/* NACE codes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Primary NACE code
        </label>
        <p className="text-xs text-gray-400 mb-1.5">The main economic activity of your organization</p>
        <NaceCodeSelector
          value={naceCode}
          onChange={(v) => setNaceCode(Array.isArray(v) ? v[0] || '' : v)}
          multiple={false}
          placeholder="Select primary NACE code..."
        />
        <FieldError mutation={mutation} field="nace_code" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Secondary NACE codes
        </label>
        <p className="text-xs text-gray-400 mb-1.5">Additional economic activities (optional)</p>
        <NaceCodeSelector
          value={secondaryNaceCodes}
          onChange={(v) => setSecondaryNaceCodes(Array.isArray(v) ? v : [v])}
          multiple={true}
          placeholder="Select additional NACE codes..."
        />
        <FieldError mutation={mutation} field="secondary_nace_codes" />
      </div>

      {/* Facility & Processing types */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Facility & Processing types
        </label>
        <p className="text-xs text-gray-400 mb-2">Select your facility categories and specific operations</p>
        <FacilityTypeSelector
          facilityTypes={selectedFacilityTypes}
          processingTypes={selectedProcessingTypes}
          onFacilityTypesChange={setSelectedFacilityTypes}
          onProcessingTypesChange={setSelectedProcessingTypes}
        />
        <FieldError mutation={mutation} field="facility_types" />
        <FieldError mutation={mutation} field="processing_types" />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// ─── Form section (Sustainability & Community / Needs & Opportunities) ───────

const SCALE_LABELS: Record<number, string> = {
  0: 'N/A',
  1: 'Not at all',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Very',
  5: 'Extremely',
};

function ScaleLegend({ scale }: { scale: number[] }) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-400 justify-end py-2">
      {scale.map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium ${s === 0
            ? 'border border-dashed border-gray-300 text-gray-400'
            : 'border border-gray-200 text-gray-500'
            }`}>
            {s === 0 ? '—' : s}
          </span>
          {SCALE_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

function TableRatingRow({
  label,
  value,
  scale,
  onChange,
}: {
  label: string;
  value: number | undefined;
  scale: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <p className="flex-1 text-sm text-gray-700 pt-0.5">{label}</p>
      <div className="flex gap-1.5 shrink-0">
        {scale.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${value === r
              ? r === 0
                ? 'bg-gray-400 text-white'
                : 'bg-primary text-white'
              : r === 0
                ? 'border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500'
                : 'border border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
              }`}
          >
            {r === 0 ? '—' : r}
          </button>
        ))}
      </div>
    </div>
  );
}

function OnboardingFormSection({ orgSlug, formKey, title, featureInfoId, featureInfoTitle, featureInfoDescription }: {
  orgSlug: string;
  formKey: string;
  title?: string;
  featureInfoId?: string;
  featureInfoTitle?: string;
  featureInfoDescription?: string;
}) {
  const queryClient = useQueryClient();
  const featureInfo = useFeatureInfo(featureInfoId ?? formKey);

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });
  const orgId = orgQuery.data?.id;

  const formQuery = useQuery({
    queryKey: ['forms', formKey],
    queryFn: () => getForm(formKey),
  });

  const answerQuery = useQuery({
    queryKey: ['answers', 'latest', orgId, formKey],
    queryFn: () => getLatestAnswer(orgId!, formKey),
    enabled: !!orgId,
  });

  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const answerId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initialize from existing answer
  if (answerQuery.data && !initialized) {
    setResponses(answerQuery.data.responses);
    answerId.current = answerQuery.data.id;
    setInitialized(true);
  }
  if (answerQuery.isFetched && !answerQuery.data && !initialized) {
    setInitialized(true);
  }

  const persistResponses = useCallback(
    async (next: Record<string, unknown>) => {
      if (!orgId || !formQuery.data) return;
      setSaving(true);
      setSaved(false);
      try {
        if (answerId.current) {
          await updateAnswer(answerId.current, { responses: next });
        } else {
          const created = await createAnswer({
            form_id: formQuery.data.id,
            organization_id: orgId,
            responses: next,
          });
          answerId.current = created.id;
        }
        queryClient.invalidateQueries({ queryKey: ['me'] });
        queryClient.invalidateQueries({ queryKey: ['answers', 'latest', orgId, formKey] });
        setSaved(true);
      } finally {
        setSaving(false);
      }
    },
    [orgId, formKey, formQuery.data, queryClient],
  );

  const handleTableChange = (questionKey: string, rowKey: string, value: number) => {
    const prev = (responses[questionKey] as Record<string, number>) || {};
    const next = { ...responses, [questionKey]: { ...prev, [rowKey]: value } };
    setResponses(next);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistResponses(next), 500);
  };

  const handleTextChange = (questionKey: string, value: string) => {
    const next = { ...responses, [questionKey]: value };
    setResponses(next);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistResponses(next), 800);
  };

  if (!formQuery.data || !initialized) {
    return <div className="py-6 text-sm text-gray-500">Loading...</div>;
  }

  const form = formQuery.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2 h-5 text-xs text-gray-400">
            {saving && 'Saving...'}
            {saved && !saving && 'Saved'}
          </div>
        </div>
      )}
      {!title && (
        <div className="flex items-center justify-end h-5 text-xs text-gray-400">
          {saving && 'Saving...'}
          {saved && !saving && 'Saved'}
        </div>
      )}

      {/* Feature intro */}
      {featureInfoTitle && featureInfoDescription && (
        <FeatureIntro info={featureInfo} title={featureInfoTitle} description={featureInfoDescription} />
      )}

      {form.sections.map((section) => {
        const tableQuestions = section.questions.filter(
          (q) => q.field_type === 'table' && q.options?.rows,
        );
        const firstScale = tableQuestions[0]?.options?.scale ?? [1, 2, 3, 4, 5];

        return (
          <div key={section.id}>
            <h3 className="text-base font-medium text-gray-900">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            )}

            {/* Scale legend */}
            {tableQuestions.length > 0 && (
              <ScaleLegend scale={firstScale} />
            )}

            <div className="divide-y divide-gray-100">
              {section.questions.map((question) => {
                // Table (rating rows)
                if (question.field_type === 'table' && question.options?.rows) {
                  const tableResp = (responses[question.key] as Record<string, number>) || {};
                  const scale = question.options.scale ?? [1, 2, 3, 4, 5];
                  return (
                    <div key={question.id}>
                      {section.questions.length > 1 && (
                        <p className="text-sm font-normal text-gray-900 pt-5 pb-1">{question.text}</p>
                      )}
                      {question.options.rows.map((row) => (
                        <TableRatingRow
                          key={row.value}
                          label={row.label}
                          value={tableResp[row.value]}
                          scale={scale}
                          onChange={(v) => handleTableChange(question.key, row.value, v)}
                        />
                      ))}
                    </div>
                  );
                }

                // Text / paragraph
                if (question.field_type === 'text') {
                  return (
                    <div key={question.id} className="pt-4 pb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {question.text}
                      </label>
                      <textarea
                        value={(responses[question.key] as string) || ''}
                        onChange={(e) => handleTextChange(question.key, e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Photos section ───────────────────────────────────────────────────────────

function PhotosSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const photosInfo = useFeatureInfo('profile-photos');

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const photosQuery = useQuery({
    queryKey: ['organizations', orgSlug, 'photos'],
    queryFn: () => getOrganizationPhotos(orgQuery.data!.id),
    enabled: !!orgQuery.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteOrganizationPhoto(orgQuery.data!.id, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !orgQuery.data) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, 'Organization', orgQuery.data.id);
        await createOrganizationPhoto(orgQuery.data.id, { url });
      }
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const photos = photosQuery.data ?? orgQuery.data?.organization_photos ?? [];

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
          <FeatureInfoTrigger info={photosInfo} />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add photos
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <FeatureIntro
        info={photosInfo}
        title="Showcase your workspace"
        description="Add photos of your facilities, equipment, and work to make your profile stand out. Organizations with photos feel more authentic and are more likely to attract partners."
      />

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No photos yet. Add photos to showcase your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-[4/3]">
              <img
                src={photo.url}
                alt={photo.caption || ''}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this photo?')) deleteMutation.mutate(photo.id);
                }}
                disabled={deleteMutation.isPending}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Listings section ─────────────────────────────────────────────────────────

function ListingMiniCard({ listing, onDelete, fromUrl }: { listing: Listing; onDelete: (id: string) => void; fromUrl: string }) {
  const categoryConfig = LISTING_CATEGORIES[listing.category];
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-border rounded-lg group">
      {listing.thumbnail_url ? (
        <img src={listing.thumbnail_url} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {categoryConfig && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${categoryConfig.badgeColor}`}>
              {categoryConfig.label}
            </span>
          )}
          {listing.subcategory && LISTING_SUBCATEGORIES[listing.category]?.[listing.subcategory] && (
            <span className="text-[10px] text-gray-500">
              {LISTING_SUBCATEGORIES[listing.category][listing.subcategory].label}
            </span>
          )}
          {listing.status === 'closed' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              Closed
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-gray-900 truncate">{listing.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to="/marketplace/$id/edit"
          params={{ id: listing.id }}
          search={{ from: fromUrl }}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        </Link>
        <button
          onClick={() => { if (confirm('Delete this listing?')) onDelete(listing.id); }}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const LISTING_INFO: Record<string, { title: string; description: string }> = {
  service: {
    title: 'Highlight the services you provide',
    description: 'List consulting, training, design, or other services your organization offers. This helps potential partners understand how you can work with them.',
  },
  material: {
    title: 'List your available materials',
    description: 'Share the raw fibers, fabrics, yarns, or recycled textiles you have available. This helps potential buyers find exactly what they need.',
  },
  product: {
    title: 'Showcase your finished products',
    description: 'Present the products you manufacture or sell. A visible catalog helps buyers discover your offerings and reach out.',
  },
  capacity: {
    title: 'Share your production capacity',
    description: 'Let others know about available machines, workspace, or workforce. This enables matchmaking with organizations looking for manufacturing partners.',
  },
};

function ListingsSection({ orgSlug, listingType, sectionId }: { orgSlug: string; listingType: string; sectionId: SectionId }) {
  const queryClient = useQueryClient();
  const listingInfo = useFeatureInfo(`profile-${sectionId}`);

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const orgId = orgQuery.data?.id;

  const listingsQuery = useListings({
    by_organization: orgId,
    by_type: listingType,
    per_page: 50,
  });

  const deleteMutation = useDeleteListing();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      },
    });
  };

  const listings = listingsQuery.data?.data ?? [];
  const typeConfig = LISTING_TYPES[listingType];
  const infoContent = LISTING_INFO[listingType];

  if (!orgId) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            {listingsQuery.isLoading ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
          <FeatureInfoTrigger info={listingInfo} />
        </div>
        <Link
          to="/marketplace/new"
          search={{ type: listingType, from: `/${orgSlug}/profile?section=${sectionId}` }}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add {typeConfig?.label?.toLowerCase() ?? listingType}
        </Link>
      </div>

      {infoContent && (
        <FeatureIntro
          info={listingInfo}
          title={infoContent.title}
          description={infoContent.description}
        />
      )}

      {listings.length === 0 && !listingsQuery.isLoading ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No {typeConfig?.label?.toLowerCase() ?? listingType} listings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingMiniCard key={listing.id} listing={listing} onDelete={handleDelete} fromUrl={`/${orgSlug}/profile?section=${sectionId}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Challenges section ──────────────────────────────────────────────────────

function ChallengeForm({
  orgId,
  challenge,
  onDone,
  onCancel,
}: {
  orgId: string;
  challenge?: Challenge;
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(challenge?.title || '');
  const [description, setDescription] = useState(challenge?.description || '');
  const [numberOfWinners, setNumberOfWinners] = useState(challenge?.number_of_winners?.toString() || '1');
  const [startOn, setStartOn] = useState(challenge?.start_on || '');
  const [endOn, setEndOn] = useState(challenge?.end_on || '');
  const [requiresAttachment, setRequiresAttachment] = useState(challenge?.requires_attachment || false);

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        title,
        description,
        number_of_winners: numberOfWinners ? parseInt(numberOfWinners, 10) : undefined,
        start_on: startOn || undefined,
        end_on: endOn || undefined,
        requires_attachment: requiresAttachment,
      };
      if (challenge) {
        return updateGlobalChallenge(challenge.id, data);
      }
      return createGlobalChallenge({ ...data, organization_id: orgId, state: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] });
      onDone();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 border border-border rounded-lg p-5 bg-gray-50/50">
      <h3 className="text-sm font-semibold text-gray-900">{challenge ? 'Edit challenge' : 'New challenge'}</h3>
      <FormError mutation={mutation} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Challenge title"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <FieldError mutation={mutation} field="title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the challenge..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <FieldError mutation={mutation} field="description" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Winners</label>
          <input type="number" min="1" value={numberOfWinners} onChange={(e) => setNumberOfWinners(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <input type="date" value={startOn} onChange={(e) => setStartOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={requiresAttachment} onChange={(e) => setRequiresAttachment(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring" />
        <span className="text-sm text-gray-700">Require attachment from applicants</span>
      </label>
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {mutation.isPending ? 'Saving...' : challenge ? 'Save changes' : 'Create challenge'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}

function ApplicationRow({ app, challengeId }: { app: ChallengeApplication; challengeId: string }) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['challenge_apps', challengeId] });
    queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] });
  };
  const acceptMut = useMutation({ mutationFn: () => acceptGlobalApplication(challengeId, app.id), onSuccess: invalidate });
  const rejectMut = useMutation({ mutationFn: () => rejectGlobalApplication(challengeId, app.id), onSuccess: invalidate });
  const winnerMut = useMutation({ mutationFn: () => selectGlobalWinner(challengeId, app.id), onSuccess: invalidate });
  const busy = acceptMut.isPending || rejectMut.isPending || winnerMut.isPending;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{app.organization?.name || 'Unknown'}</span>
          {challengeAppStatusBadge(app.status)}
        </div>
        {app.note && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{app.note}</p>}
        {app.attachment_url && (
          <a href={app.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 inline-block">
            View attachment
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {app.status === 'pending' && (
          <>
            <button onClick={() => acceptMut.mutate()} disabled={busy}
              className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">Accept</button>
            <button onClick={() => rejectMut.mutate()} disabled={busy}
              className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50">Reject</button>
          </>
        )}
        {app.status === 'accepted' && (
          <button onClick={() => winnerMut.mutate()} disabled={busy}
            className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50">Winner</button>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  orgId,
}: {
  challenge: Challenge;
  orgId: string;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const appsQuery = useQuery({
    queryKey: ['challenge_apps', challenge.id],
    queryFn: () => getGlobalApplications(challenge.id, { per_page: 50 }),
    enabled: expanded,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteGlobalChallenge(challenge.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }),
  });

  const activateMut = useMutation({
    mutationFn: () => updateGlobalChallenge(challenge.id, { state: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }),
  });

  const apps = appsQuery.data?.data ?? [];

  if (editing) {
    return (
      <ChallengeForm
        orgId={orgId}
        challenge={challenge}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-4 p-4 group">
        {challenge.image_url ? (
          <img src={challenge.image_url} alt="" className="w-14 h-14 rounded-md object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
            </svg>
          </div>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {challengeStateBadge(challenge.state)}
            {challenge.applications_count > 0 && (
              <span className="text-[10px] text-gray-500">
                {challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}
                {challenge.winners_count > 0 && ` · ${challenge.winners_count} winner${challenge.winners_count !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">{challenge.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{challenge.description}</p>
        </button>
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {challenge.state === 'draft' && (
            <button onClick={() => activateMut.mutate()} disabled={activateMut.isPending}
              className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">
              Activate
            </button>
          )}
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button onClick={() => { if (confirm('Delete this challenge?')) deleteMut.mutate(); }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-gray-50/50">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Applications ({apps.length})
          </h4>
          {appsQuery.isLoading ? (
            <p className="text-xs text-gray-400 py-2">Loading...</p>
          ) : apps.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No applications yet.</p>
          ) : (
            <div>
              {apps.map((app) => (
                <ApplicationRow key={app.id} app={app} challengeId={challenge.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChallengesSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const challengesInfo = useFeatureInfo('profile-challenges');

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const orgId = orgQuery.data?.id;

  const challengesQuery = useQuery({
    queryKey: ['challenges', 'by_organization', orgId],
    queryFn: () => getAllChallenges({ by_organization: orgId!, per_page: 50 }),
    enabled: !!orgId,
  });

  const challenges = challengesQuery.data?.data ?? [];

  if (!orgId) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <FeatureIntro
        info={challengesInfo}
        title="What are challenges?"
        description="Post a challenge to tell the community what you need: workspace, machinery, raw materials, expertise, services, and more. Challenges are also used for collaborative projects, funding opportunities, and calls for partners. Other organizations can apply, and you manage responses directly from here."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            {challengesQuery.isLoading ? 'Loading...' : `${challenges.length} challenge${challenges.length !== 1 ? 's' : ''}`}
          </p>
          <FeatureInfoTrigger info={challengesInfo} />
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create challenge
          </button>
        )}
      </div>

      {showForm && (
        <ChallengeForm
          orgId={orgId}
          onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {challenges.length === 0 && !challengesQuery.isLoading && !showForm ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No challenges yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create a challenge to find partners and drive innovation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OrgProfilePage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const { section } = useSearch({ strict: false }) as { section?: SectionId };
  const navigate = useNavigate();
  const activeSection: SectionId = section || 'informations';

  const setActiveSection = (id: SectionId) => {
    navigate({
      to: '/$orgSlug/profile',
      params: { orgSlug },
      search: id === 'informations' ? {} : { section: id },
    });
  };

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;
  const orgId = org?.id;

  // Listing counts per type (lightweight: per_page=1, only reading meta.total_count)
  const countParams = (type: string) => ({ by_organization: orgId!, by_type: type, per_page: 1 });
  const servicesCount = useQuery({
    queryKey: listingKeys.list(countParams('service')),
    queryFn: () => getListings(countParams('service')),
    enabled: !!orgId,
  });
  const materialsCount = useQuery({
    queryKey: listingKeys.list(countParams('material')),
    queryFn: () => getListings(countParams('material')),
    enabled: !!orgId,
  });
  const capacitiesCount = useQuery({
    queryKey: listingKeys.list(countParams('capacity')),
    queryFn: () => getListings(countParams('capacity')),
    enabled: !!orgId,
  });
  const productsCount = useQuery({
    queryKey: listingKeys.list(countParams('product')),
    queryFn: () => getListings(countParams('product')),
    enabled: !!orgId,
  });

  const challengesCount = useQuery({
    queryKey: ['challenges', 'by_organization', orgId, 'count'],
    queryFn: () => getAllChallenges({ by_organization: orgId!, per_page: 1 }),
    enabled: !!orgId,
  });

  const sectionCounts: Partial<Record<SectionId, number>> = {
    services: servicesCount.data?.meta.total_count,
    materials: materialsCount.data?.meta.total_count,
    capacities: capacitiesCount.data?.meta.total_count,
    products: productsCount.data?.meta.total_count,
    challenges: challengesCount.data?.meta.total_count,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization profile</p>
        </div>
        {org && (
          <Link
            to="/organizations/$id"
            params={{ id: org.slug || org.id }}
            search={{ from: 'profile' }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View public profile
          </Link>
        )}
      </div>

      {/* Section nav + content */}
      <div className="flex gap-6">
        {/* Sidebar section nav */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${activeSection === s.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {s.label}
                  {sectionCounts[s.id] != null && (
                    <span className="text-[11px] tabular-nums text-gray-400 font-normal">
                      {sectionCounts[s.id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-border p-6">
            {activeSection === 'informations' && (
              <InformationsSection orgSlug={orgSlug} />
            )}
            {activeSection === 'data' && <DataSection orgSlug={orgSlug} />}
            {activeSection === 'sustainability' && <OnboardingFormSection orgSlug={orgSlug} formKey="onboarding-form" />}
            {activeSection === 'needs' && (
              <OnboardingFormSection
                orgSlug={orgSlug}
                formKey="needs-opportunities"
                title="Needs & Opportunities"
                featureInfoId="profile-needs"
                featureInfoTitle="Help your facilitator help you"
                featureInfoDescription="By sharing your challenges and interests, you enable your community facilitator to provide tailored support, connect you with the right partners, and shape programs that address real needs across the ecosystem."
              />
            )}
            {activeSection === 'photos' && <PhotosSection orgSlug={orgSlug} />}
            {activeSection === 'services' && <ListingsSection orgSlug={orgSlug} listingType="service" sectionId="services" />}
            {activeSection === 'materials' && <ListingsSection orgSlug={orgSlug} listingType="material" sectionId="materials" />}
            {activeSection === 'capacities' && <ListingsSection orgSlug={orgSlug} listingType="capacity" sectionId="capacities" />}
            {activeSection === 'products' && <ListingsSection orgSlug={orgSlug} listingType="product" sectionId="products" />}
            {activeSection === 'challenges' && <ChallengesSection orgSlug={orgSlug} />}
          </div>
        </div>
      </div>
    </div>
  );
}
