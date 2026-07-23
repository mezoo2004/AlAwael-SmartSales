import { ContactInfo, CustomerSession, GeneratedDesign } from '../types';
import { getSupabase, getSupabaseConfigWarning } from '../lib/supabase';

export class ProjectPersistenceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ProjectPersistenceError';
  }
}

export interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  customer_id: string;
  department: string;
  budget_range: string | null;
  priority: string | null;
  dimensions: Record<string, unknown>;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  city: string | null;
  district: string | null;
  street: string | null;
  region: string | null;
  country: string | null;
  google_maps_url: string | null;
  status: string;
  created_at: string;
}

export interface CustomerProjectResult {
  customer: CustomerRow;
  project: ProjectRow;
}

export interface FinalizeProjectOrderResult {
  requestNumber: string;
  generatedDesignId: string | null;
}

interface GeneratedDesignRow {
  id: string;
  project_id: string;
  image_url: string | null;
  prompt: string | null;
  selected: boolean;
  created_at: string;
  storage_path?: string | null;
  source?: string | null;
  model?: string | null;
  status?: string | null;
}

export class ExistingCustomerProjectError extends ProjectPersistenceError {
  constructor(
    public readonly customer: CustomerRow,
    public readonly project: ProjectRow | null
  ) {
    super('يوجد عميل مسجل مسبقًا بهذا الرقم', 'PHONE_EXISTS');
    this.name = 'ExistingCustomerProjectError';
  }
}

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new ProjectPersistenceError(
      getSupabaseConfigWarning() || 'Supabase is not configured.',
      'NOT_CONFIGURED'
    );
  }
  return supabase;
}

function toPersistenceErrorMessage(action: string, error: { message?: string }): string {
  return error.message ? `${action}: ${error.message}` : action;
}

function getProjectLocationPatch(contact?: ContactInfo): Partial<ProjectRow> {
  return {
    latitude: contact?.latitude ?? null,
    longitude: contact?.longitude ?? null,
    accuracy: contact?.accuracy ?? null,
    city: contact?.city?.trim() || null,
    district: contact?.district?.trim() || contact?.neighborhood?.trim() || null,
    street: contact?.street?.trim() || null,
    region: contact?.region?.trim() || null,
    country: contact?.country?.trim() || null,
    google_maps_url: contact?.googleMapsUrl || (
      typeof contact?.latitude === 'number' && typeof contact.longitude === 'number'
        ? `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`
        : null
    ),
  };
}

async function getLatestProject(customerId: string): Promise<ProjectRow | null> {
  const supabase = assertSupabase();
  const response = await supabase
    .from('projects')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = response;

  if (error) {
    console.error('Supabase projects select response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر قراءة المشروع السابق', error),
      error.code
    );
  }

  return data as ProjectRow | null;
}

async function createProject(customerId: string, contact?: ContactInfo): Promise<ProjectRow> {
  const supabase = assertSupabase();
  const projectPayload = {
    customer_id: customerId,
    department: 'pending',
    status: 'draft',
    dimensions: {},
    ...getProjectLocationPatch(contact),
  };
  console.log('Supabase projects insert payload', projectPayload);

  const response = await supabase
    .from('projects')
    .insert(projectPayload)
    .select('*')
    .single();
  const { data, error } = response;
  console.log('Supabase projects insert response', response);

  if (error) {
    console.error('Supabase projects insert response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر إنشاء المشروع', error),
      error.code
    );
  }

  return data as ProjectRow;
}

export async function findCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  const supabase = assertSupabase();
  const response = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  const { data, error } = response;

  if (error) {
    console.error('Supabase customers select response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر التحقق من رقم الجوال', error),
      error.code
    );
  }

  return data as CustomerRow | null;
}

export async function createCustomerAndProject(contact: ContactInfo): Promise<CustomerProjectResult> {
  const existingCustomer = await findCustomerByPhone(contact.phone);
  if (existingCustomer) {
    throw new ExistingCustomerProjectError(existingCustomer, await getLatestProject(existingCustomer.id));
  }

  const supabase = assertSupabase();
  const response = await supabase
    .from('customers')
    .insert({
      full_name: contact.name,
      phone: contact.phone,
      city: contact.city?.trim() || null,
    })
    .select('*')
    .single();
  const { data: customer, error } = response;
  console.log('Supabase customers insert response', response);

  if (error) {
    console.error(error);
    console.error('Supabase customers insert response', response);

    if (error.code === '23505') {
      const customerRow = await findCustomerByPhone(contact.phone);
      if (customerRow) {
        throw new ExistingCustomerProjectError(customerRow, await getLatestProject(customerRow.id));
      }
    }

    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر إنشاء العميل', error),
      error.code
    );
  }

  const project = await createProject((customer as CustomerRow).id, contact);
  return {
    customer: customer as CustomerRow,
    project,
  };
}

export async function updateCustomerContact(
  customerId: string,
  contact: ContactInfo
): Promise<CustomerRow> {
  const supabase = assertSupabase();
  const response = await supabase
    .from('customers')
    .update({
      full_name: contact.name,
      phone: contact.phone,
      city: contact.city?.trim() || null,
    })
    .eq('id', customerId)
    .select('*')
    .single();
  const { data, error } = response;

  if (error) {
    console.error('Supabase customers update response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر تحديث بيانات العميل', error),
      error.code
    );
  }

  return data as CustomerRow;
}

export async function createNewProjectForCustomer(customerId: string, contact?: ContactInfo): Promise<ProjectRow> {
  return createProject(customerId, contact);
}

export async function getOrCreatePreviousProject(customerId: string): Promise<ProjectRow> {
  return (await getLatestProject(customerId)) || createProject(customerId);
}

export async function updateProjectLocation(projectId: string, contact: ContactInfo): Promise<void> {
  const hasPreciseCoordinates = typeof contact.latitude === 'number' && typeof contact.longitude === 'number';
  const patch: Partial<ProjectRow> = {};

  if (hasPreciseCoordinates) {
    patch.latitude = contact.latitude!;
    patch.longitude = contact.longitude!;
    patch.accuracy = contact.accuracy ?? null;
    patch.google_maps_url = contact.googleMapsUrl ||
      `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`;
  }

  if (contact.city?.trim()) patch.city = contact.city.trim();
  if (contact.district?.trim() || contact.neighborhood?.trim()) {
    patch.district = contact.district?.trim() || contact.neighborhood?.trim() || null;
  }
  if (contact.street?.trim()) patch.street = contact.street.trim();
  if (contact.region?.trim()) patch.region = contact.region.trim();
  if (contact.country?.trim()) patch.country = contact.country.trim();

  if (Object.keys(patch).length === 0) {
    return;
  }

  const supabase = assertSupabase();
  const response = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId);
  const { error } = response;

  if (error) {
    console.error('Supabase project location update response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر تحديث موقع المشروع', error),
      error.code
    );
  }
}

export async function updateProjectMetadata(
  projectId: string,
  patch: Partial<Pick<ProjectRow, 'department' | 'budget_range' | 'priority' | 'dimensions' | 'status'>>
): Promise<void> {
  const supabase = assertSupabase();
  const response = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId);
  const { error } = response;

  if (error) {
    console.error('Supabase projects update response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر تحديث المشروع', error),
      error.code
    );
  }
}

export async function saveProjectAnswer(
  projectId: string,
  question: string,
  answer: unknown
): Promise<void> {
  const supabase = assertSupabase();
  const response = await supabase
    .from('project_answers')
    .upsert(
      {
        project_id: projectId,
        question,
        answer,
      },
      { onConflict: 'project_id,question' }
    );
  const { error } = response;

  if (error) {
    console.error('Supabase project_answers upsert response', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر حفظ الإجابة', error),
      error.code
    );
  }
}

function buildDesignPrompt(design: GeneratedDesign, requestNumber?: string): string {
  return [
    design.prompt,
    design.title,
    design.description,
    design.materials.length ? `materials: ${design.materials.join(', ')}` : null,
    design.colors.length ? `colors: ${design.colors.join(', ')}` : null,
    requestNumber ? `request_number: ${requestNumber}` : null,
  ].filter(Boolean).join('\n');
}

export async function persistGeneratedDesigns(
  projectId: string,
  designs: GeneratedDesign[]
): Promise<GeneratedDesign[]> {
  const supabase = assertSupabase();

  if (designs.length === 0) {
    return designs;
  }

  const payload = designs.map((design) => {
    const storagePath = design.storagePath?.trim() || null;
    const source = design.source || (storagePath ? 'openai' : 'demo');
    // storage_path is canonical for private designs; do not persist temporary signed URLs.
    const imageUrl = storagePath
      ? null
      : (design.imageUrl || design.thumbnailUrl || null);

    return {
      project_id: projectId,
      image_url: imageUrl,
      prompt: buildDesignPrompt(design),
      selected: false,
      storage_path: storagePath,
      source,
      model: storagePath ? 'gpt-image-1' : 'demo',
      status: 'completed',
      metadata: {
        title: design.title,
        has_storage_path: Boolean(storagePath),
      },
    };
  });
  console.log('Generated designs insert payload', payload);

  const response = await supabase
    .from('generated_designs')
    .insert(payload)
    .select('*');
  const { data, error } = response;
  console.log('Generated designs Supabase response', response);

  if (error || !data) {
    console.error('Generated designs Supabase error', response);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر حفظ التصاميم المنشأة', error || {}),
      error?.code
    );
  }

  const rows = data as GeneratedDesignRow[];
  return designs.map((design, index) => ({
    ...design,
    generatedDesignId: rows[index]?.id,
    prompt: payload[index].prompt,
    storagePath: rows[index]?.storage_path || design.storagePath,
    source: rows[index]?.source || design.source || payload[index].source,
    // Keep in-session display URL (fresh signed / demo) even when DB image_url is null.
    imageUrl: design.imageUrl || design.thumbnailUrl || '',
    thumbnailUrl: design.thumbnailUrl || design.imageUrl || '',
  }));
}

export async function selectGeneratedDesign(params: {
  projectId: string;
  generatedDesignId: string;
}): Promise<void> {
  const supabase = assertSupabase();

  const clearResponse = await supabase
    .from('generated_designs')
    .update({ selected: false })
    .eq('project_id', params.projectId)
    .eq('selected', true);
  console.log('Design selection clear Supabase response', clearResponse);

  if (clearResponse.error) {
    console.error('Design selection clear Supabase error', clearResponse);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر تحديث اختيار التصميم السابق', clearResponse.error),
      clearResponse.error.code
    );
  }

  const selectResponse = await supabase
    .from('generated_designs')
    .update({ selected: true })
    .eq('id', params.generatedDesignId)
    .eq('project_id', params.projectId)
    .select('id, project_id, image_url, prompt, selected')
    .single();
  console.log('Design selection Supabase response', selectResponse);

  if (selectResponse.error || !selectResponse.data) {
    console.error('Design selection Supabase error', selectResponse);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر حفظ التصميم المختار', selectResponse.error || {}),
      selectResponse.error?.code
    );
  }
}

export async function finalizeProjectOrder(params: {
  customerId: string;
  projectId: string;
  session: CustomerSession;
  requestNumber: string;
}): Promise<FinalizeProjectOrderResult> {
  const supabase = assertSupabase();

  const selectedDesign = params.session.generatedDesigns.find(
    design => design.id === params.session.selectedDesignId
  );

  if (!selectedDesign) {
    throw new ProjectPersistenceError('التصميم المختار غير متوفر', 'NO_SELECTED_DESIGN');
  }

  if (!selectedDesign.generatedDesignId) {
    throw new ProjectPersistenceError(
      'التصميم المختار غير محفوظ في Supabase. يرجى الرجوع وإنشاء التصاميم مرة أخرى.',
      'NO_REMOTE_GENERATED_DESIGN'
    );
  }

  const projectResponse = await supabase
    .from('projects')
    .select('id, customer_id')
    .eq('id', params.projectId)
    .eq('customer_id', params.customerId)
    .single();
  console.log('Final project/customer verification response', projectResponse);

  if (projectResponse.error || !projectResponse.data) {
    console.error('Final project/customer verification error', projectResponse);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر التحقق من المشروع المرتبط بالعميل', projectResponse.error || {}),
      projectResponse.error?.code
    );
  }

  const selectedDesignResponse = await supabase
    .from('generated_designs')
    .select('id, project_id, image_url, prompt, selected')
    .eq('id', selectedDesign.generatedDesignId)
    .eq('project_id', params.projectId)
    .single();
  console.log('Final selected generated design Supabase response', selectedDesignResponse);

  if (selectedDesignResponse.error || !selectedDesignResponse.data) {
    console.error('Final selected generated design Supabase error', selectedDesignResponse);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر قراءة التصميم النهائي المحفوظ', selectedDesignResponse.error || {}),
      selectedDesignResponse.error?.code
    );
  }

  if (!selectedDesignResponse.data.selected) {
    await selectGeneratedDesign({
      projectId: params.projectId,
      generatedDesignId: selectedDesign.generatedDesignId,
    });
  }

  const projectUpdatePayload = {
    department: params.session.departmentId || 'pending',
    budget_range: typeof params.session.answers?.budget_intelligence === 'string'
      ? params.session.answers.budget_intelligence
      : null,
    priority: typeof params.session.answers?.budgetPriority === 'string'
      ? params.session.answers.budgetPriority
      : null,
    dimensions: params.session.measurements as unknown as Record<string, unknown>,
    status: 'submitted',
  };
  console.log('Final project update payload', projectUpdatePayload);

  const projectUpdateResponse = await supabase
    .from('projects')
    .update(projectUpdatePayload)
    .eq('id', params.projectId)
    .eq('customer_id', params.customerId)
    .select('id, customer_id, status')
    .single();
  console.log('Final project update Supabase response', projectUpdateResponse);

  if (projectUpdateResponse.error || !projectUpdateResponse.data) {
    console.error('Final project update Supabase error', projectUpdateResponse);
    throw new ProjectPersistenceError(
      toPersistenceErrorMessage('تعذر إرسال الطلب النهائي', projectUpdateResponse.error || {}),
      projectUpdateResponse.error?.code
    );
  }

  return {
    requestNumber: params.requestNumber,
    generatedDesignId: selectedDesign.generatedDesignId,
  };
}
