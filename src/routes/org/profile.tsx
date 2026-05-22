import { useState, useRef, useCallback } from 'react';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '../../lib/organizations';
import { getOrganizationPhotos, createOrganizationPhoto, deleteOrganizationPhoto } from '../../lib/organization-photos';
import { getForm } from '../../lib/forms';
import { getLatestAnswer, createAnswer, updateAnswer } from '../../lib/answers';
import { uploadFile } from '../../lib/uploads';
import { PhotonAddressAutocomplete } from '../../components/PhotonAddressAutocomplete';
import type { AddressData } from '../../components/PhotonAddressAutocomplete';
import { FieldError, FormError } from '../../components/FieldError';
import { KindSelect } from '../../components/KindSelect';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';
import { NaceCodeSelector } from '../../components/NaceCodeSelector';
import { FacilityTypeSelector } from '../../components/FacilityTypeSelector';
import { SpecialtySelector } from '../../components/SpecialtySelector';

// ─── Section nav ──────────────────────────────────────────────────────────────

type SectionId = 'informations' | 'specialties' | 'data' | 'sustainability' | 'needs' | 'photos';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'informations', label: 'Information' },
  { id: 'specialties', label: 'Specialties' },
  { id: 'data', label: 'Data' },
  // { id: 'sustainability', label: 'Sustainability & Community' },
  { id: 'needs', label: 'Needs & Opportunities' },
  { id: 'photos', label: 'Photos' },
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
        <PhotonAddressAutocomplete
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

// ─── Specialties section ─────────────────────────────────────────────────────

function SpecialtiesSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync local state when org loads
  if (org && !initialized) {
    setSpecialties(org.specialties ?? []);
    setInitialized(true);
  }

  const isDirty = initialized && JSON.stringify(specialties) !== JSON.stringify(org?.specialties ?? []);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setSuccess(false);
    try {
      await updateOrganization(org.id, { specialties });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!org) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-gray-900">Specialties</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Select the value chain categories that describe your activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {success && <span className="text-sm text-green-600">Saved</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <SpecialtySelector value={specialties} onChange={setSpecialties} />
    </div>
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

  const sectionCounts: Partial<Record<SectionId, number>> = {};

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
            {activeSection === 'specialties' && <SpecialtiesSection orgSlug={orgSlug} />}
          </div>
        </div>
      </div>
    </div>
  );
}
