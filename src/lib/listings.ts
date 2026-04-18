import { api, BASE } from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Types ────────────────────────────────────────────────────

export const LISTING_TYPES: Record<string, { label: string; badgeColor: string }> = {
  service: { label: 'Service', badgeColor: 'bg-blue-100 text-blue-800' },
  material: { label: 'Material', badgeColor: 'bg-emerald-100 text-emerald-800' },
  product: { label: 'Product', badgeColor: 'bg-rose-100 text-rose-800' },
  capacity: { label: 'Capacity', badgeColor: 'bg-amber-100 text-amber-800' },
};

export const LISTING_CATEGORIES: Record<string, { label: string; badgeColor: string }> = {
  // Service categories
  production_manufacturing: { label: 'Production & Manufacturing', badgeColor: 'bg-blue-100 text-blue-800' },
  sorting_processing: { label: 'Sorting & Processing', badgeColor: 'bg-cyan-100 text-cyan-800' },
  design_development: { label: 'Design & Development', badgeColor: 'bg-indigo-100 text-indigo-800' },
  logistics_collection: { label: 'Logistics & Collection', badgeColor: 'bg-orange-100 text-orange-800' },
  consulting_training: { label: 'Consulting & Training', badgeColor: 'bg-fuchsia-100 text-fuchsia-800' },
  // Material categories
  waste_streams: { label: 'Waste Streams', badgeColor: 'bg-lime-100 text-lime-800' },
  raw_materials: { label: 'Raw Materials', badgeColor: 'bg-emerald-100 text-emerald-800' },
  intermediate_materials: { label: 'Intermediate Materials', badgeColor: 'bg-teal-100 text-teal-800' },
  // Product categories
  apparel_accessories: { label: 'Apparel & Accessories', badgeColor: 'bg-rose-100 text-rose-800' },
  home_living: { label: 'Home & Living', badgeColor: 'bg-pink-100 text-pink-800' },
  technical_industrial: { label: 'Technical & Industrial', badgeColor: 'bg-slate-100 text-slate-800' },
  upcycled_circular: { label: 'Upcycled & Circular', badgeColor: 'bg-green-100 text-green-800' },
  // Capacity categories
  equipment: { label: 'Equipment', badgeColor: 'bg-amber-100 text-amber-800' },
  facilities: { label: 'Facilities', badgeColor: 'bg-violet-100 text-violet-800' },
  open_spaces: { label: 'Open Spaces', badgeColor: 'bg-sky-100 text-sky-800' },
  expertise_skills: { label: 'Expertise & Skills', badgeColor: 'bg-purple-100 text-purple-800' },
};

/** Categories grouped by listing type */
export const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  service: ['production_manufacturing', 'sorting_processing', 'design_development', 'logistics_collection', 'consulting_training'],
  material: ['waste_streams', 'raw_materials', 'intermediate_materials'],
  product: ['apparel_accessories', 'home_living', 'technical_industrial', 'upcycled_circular'],
  capacity: ['equipment', 'facilities', 'open_spaces', 'expertise_skills'],
};

export const LISTING_SUBCATEGORIES: Record<string, Record<string, { label: string }>> = {
  // Service > Production & Manufacturing
  production_manufacturing: {
    cut_sew: { label: 'Cut & Sew' },
    knitting_weaving: { label: 'Knitting & Weaving' },
    embroidery_finishing: { label: 'Embroidery & Finishing' },
    dyeing_printing: { label: 'Dyeing & Printing' },
    upcycling_transformation: { label: 'Upcycling & Transformation' },
    repair_alteration: { label: 'Repair & Alteration' },
  },
  // Service > Sorting & Processing
  sorting_processing: {
    waste_sorting: { label: 'Waste Sorting & Grading' },
    fibre_recovery: { label: 'Fibre Recovery & Separation' },
    shredding_grinding: { label: 'Shredding & Grinding' },
    quality_assessment: { label: 'Quality Assessment' },
  },
  // Service > Design & Development
  design_development: {
    fashion_textile_design: { label: 'Fashion & Textile Design' },
    pattern_making: { label: 'Pattern Making' },
    prototype_development: { label: 'Prototype Development' },
    material_research: { label: 'Material Research & Development' },
  },
  // Service > Logistics & Collection
  logistics_collection: {
    waste_collection: { label: 'Waste Collection & Pick-up' },
    transport_delivery: { label: 'Transport & Delivery' },
    warehousing: { label: 'Warehousing' },
  },
  // Service > Consulting & Training
  consulting_training: {
    circular_economy_strategy: { label: 'Circular Economy Strategy' },
    life_cycle_assessment: { label: 'Life Cycle Assessment (LCA)' },
    certification_support: { label: 'Certification Support' },
    training_workshops: { label: 'Training & Workshops' },
    impact_measurement: { label: 'Impact Measurement' },
  },
  // Material > Waste Streams
  waste_streams: {
    post_industrial_waste: { label: 'Post-Industrial Waste' },
    post_consumer_waste: { label: 'Post-Consumer Waste' },
    deadstock: { label: 'Deadstock' },
    production_offcuts: { label: 'Production Off-cuts' },
  },
  // Material > Raw Materials
  raw_materials: {
    natural_fibres: { label: 'Natural Fibres' },
    recycled_fibres: { label: 'Recycled Fibres' },
    synthetic_fibres: { label: 'Synthetic Fibres' },
    yarns_threads: { label: 'Yarns & Threads' },
  },
  // Material > Intermediate Materials
  intermediate_materials: {
    greige_fabric: { label: 'Greige Fabric' },
    finished_fabric: { label: 'Finished Fabric' },
    trimmings_accessories: { label: 'Trimmings & Accessories' },
    technical_substrates: { label: 'Technical Substrates' },
  },
  // Product > Apparel & Accessories
  apparel_accessories: {
    garments: { label: 'Garments' },
    accessories: { label: 'Accessories' },
    footwear: { label: 'Footwear' },
    sportswear: { label: 'Sportswear' },
  },
  // Product > Home & Living
  home_living: {
    home_textiles: { label: 'Home Textiles' },
    interior_furnishings: { label: 'Interior Furnishings' },
    bedding_linen: { label: 'Bedding & Linen' },
  },
  // Product > Technical & Industrial
  technical_industrial: {
    technical_textiles: { label: 'Technical Textiles' },
    industrial_fabrics: { label: 'Industrial Fabrics' },
    geotextiles: { label: 'Geotextiles' },
    medical_textiles: { label: 'Medical Textiles' },
  },
  // Product > Upcycled & Circular
  upcycled_circular: {
    upcycled_products: { label: 'Upcycled Products' },
    repaired_restored: { label: 'Repaired / Restored Items' },
    zero_waste_collections: { label: 'Zero-waste Collections' },
  },
  // Capacity > Equipment
  equipment: {
    sewing_assembly: { label: 'Sewing & Assembly Machines' },
    cutting_spreading: { label: 'Cutting & Spreading Machines' },
    knitting_machines: { label: 'Knitting Machines' },
    weaving_looms: { label: 'Weaving Looms' },
    dyeing_finishing: { label: 'Dyeing & Finishing Equipment' },
    sorting_grading: { label: 'Sorting & Grading Equipment' },
    embroidery_machines: { label: 'Embroidery Machines' },
  },
  // Capacity > Facilities
  facilities: {
    production_workshop: { label: 'Production Workshop' },
    storage_warehouse: { label: 'Storage & Warehouse' },
    showroom: { label: 'Showroom' },
    collection_point: { label: 'Collection & Drop-off Point' },
    photography_studio: { label: 'Photography Studio' },
  },
  // Capacity > Open Spaces
  open_spaces: {
    fablab: { label: 'Fablab' },
    shared_atelier: { label: 'Shared Atelier / Makerspace' },
    coworking_space: { label: 'Coworking Space' },
  },
  // Capacity > Expertise & Skills
  expertise_skills: {
    traditional_craft: { label: 'Traditional Craft Techniques' },
    industrial_techniques: { label: 'Industrial Techniques' },
    material_expertise: { label: 'Material Expertise' },
    mentoring: { label: 'Mentoring & Knowledge Transfer' },
  },
};

/** Get category options for a given listing type */
export function getCategoriesForType(type: string): { value: string; label: string; badgeColor: string }[] {
  const categoryKeys = CATEGORIES_BY_TYPE[type] ?? [];
  return categoryKeys.map((key) => ({
    value: key,
    label: LISTING_CATEGORIES[key]?.label ?? key,
    badgeColor: LISTING_CATEGORIES[key]?.badgeColor ?? '',
  }));
}

/** Get subcategory options for a given category */
export function getSubcategoriesForCategory(category: string): { value: string; label: string }[] {
  const subs = LISTING_SUBCATEGORIES[category] ?? {};
  return Object.entries(subs).map(([key, { label }]) => ({ value: key, label }));
}

export interface ListingImage {
  id: string;
  image_file_url: string;
  position: number;
}

export interface ListingOrganization {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface ListingCommunity {
  id: string;
  name: string;
  slug: string;
}

export interface Listing {
  id: string;
  listing_type: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  status: string;
  quantity: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  organization: ListingOrganization;
  community: ListingCommunity | null;
  // extended view only
  images?: ListingImage[];
}

interface ListingsResponse {
  data: Listing[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export interface ListingParams {
  page?: number;
  per_page?: number;
  search?: string;
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
  by_community?: string;
  by_community_id?: string;
  by_organization?: string;
}

export interface ListingPayload {
  organization_id: string;
  community_id?: string;
  listing_type: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  status?: string;
  quantity?: number;
  expires_at?: string;
}

// ── API functions ────────────────────────────────────────────

export async function getListings(params: ListingParams = {}): Promise<ListingsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.by_type) qs.set('by_type', params.by_type);
  if (params.by_category) qs.set('by_category', params.by_category);
  if (params.by_subcategory) qs.set('by_subcategory', params.by_subcategory);
  if (params.by_community) qs.set('by_community', params.by_community);
  if (params.by_community_id) qs.set('by_community_id', params.by_community_id);
  if (params.by_organization) qs.set('by_organization', params.by_organization);

  const query = qs.toString();
  // The API returns { data: [...], meta: {...} } — we need both, so raw fetch
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/listings${query ? `?${query}` : ''}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function getListing(id: string): Promise<Listing> {
  return api.get<Listing>(`/listings/${id}`);
}

export async function createListing(payload: ListingPayload): Promise<Listing> {
  return api.post<Listing>('/listings', { listing: payload });
}

export async function updateListing(id: string, payload: Partial<ListingPayload>): Promise<Listing> {
  return api.patch<Listing>(`/listings/${id}`, { listing: payload });
}

export async function deleteListing(id: string): Promise<void> {
  return api.delete(`/listings/${id}`);
}

export async function addListingImage(listingId: string, imageFileUrl: string): Promise<ListingImage> {
  return api.post<ListingImage>(`/listings/${listingId}/listing_images`, {
    listing_image: { image_file_url: imageFileUrl },
  });
}

export async function removeListingImage(listingId: string, imageId: string): Promise<void> {
  return api.delete(`/listings/${listingId}/listing_images/${imageId}`);
}

// ── Query keys ──────────────────────────────────────────────

export const listingKeys = {
  list: (params?: ListingParams) => ['listings', params ?? {}] as const,
  detail: (id: string) => ['listings', id] as const,
};

// ── Hooks ───────────────────────────────────────────────────

export function useListings(params: ListingParams = {}) {
  return useQuery({
    queryKey: listingKeys.list(params),
    queryFn: () => getListings(params),
  });
}

export function useListing(id: string | null) {
  return useQuery({
    queryKey: listingKeys.detail(id!),
    queryFn: () => getListing(id!),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ListingPayload> }) =>
      updateListing(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.id) });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useAddListingImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, imageFileUrl }: { listingId: string; imageFileUrl: string }) =>
      addListingImage(listingId, imageFileUrl),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.listingId) });
    },
  });
}

export function useRemoveListingImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, imageId }: { listingId: string; imageId: string }) =>
      removeListingImage(listingId, imageId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.listingId) });
    },
  });
}
