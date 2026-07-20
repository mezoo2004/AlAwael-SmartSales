import { getSupabase, isSupabaseConfigured, getSupabaseConfigWarning } from '../lib/supabase';
import { ContactInfo, CustomerSession, DepartmentId, PreferredContactMethod } from '../types';
import { CONSENT_TEXT_VERSION, LEAD_SOURCE } from '../constants/consent';
import { normalizeSaudiPhone } from '../utils/phone';

export class LeadPersistenceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'LeadPersistenceError';
  }
}

export interface SaveLeadResult {
  customerId: string;
  leadSessionId: string;
}

export interface IncompleteLeadRow {
  id: string;
  session_id: string;
  status: string;
  current_step: string;
  selected_department: string | null;
  started_at: string;
  last_activity_at: string;
  customers: {
    id: string;
    full_name: string;
    phone_e164: string;
    city: string | null;
    preferred_contact_method: PreferredContactMethod | null;
  };
  consent_records?: Array<{
    marketing_consent: boolean;
    privacy_accepted: boolean;
    recorded_at: string;
  }>;
}

export interface IncompleteLeadView {
  id: string;
  sessionId: string;
  customerId: string;
  fullName: string;
  phoneE164: string;
  city: string | null;
  preferredContactMethod: PreferredContactMethod | null;
  currentStep: string;
  startedAt: Date;
  lastActivityAt: Date;
  marketingConsent: boolean;
  status: 'incomplete';
}

const SAVE_ERROR_AR =
  'تعذر حفظ بياناتك حاليًا. تحقق من الاتصال وحاول مرة أخرى.';

function assertConfigured(): NonNullable<ReturnType<typeof getSupabase>> {
  const client = getSupabase();
  if (!client) {
    const warning = getSupabaseConfigWarning();
    throw new LeadPersistenceError(warning || SAVE_ERROR_AR, 'NOT_CONFIGURED');
  }
  return client;
}

function toContactMethod(
  method: PreferredContactMethod | undefined
): PreferredContactMethod | null {
  if (!method) return null;
  return method;
}

export async function saveCustomerAndIncompleteLead(params: {
  localSessionId: string;
  contact: ContactInfo;
  existingCustomerId?: string | null;
  existingLeadSessionId?: string | null;
}): Promise<SaveLeadResult> {
  const supabase = assertConfigured();

  const phoneE164 = normalizeSaudiPhone(params.contact.phone);
  if (!phoneE164) {
    throw new LeadPersistenceError('يرجى إدخال رقم جوال سعودي صحيح', 'INVALID_PHONE');
  }

  if (!params.contact.privacyAccepted) {
    throw new LeadPersistenceError('يجب الموافقة على سياسة الخصوصية', 'PRIVACY_REQUIRED');
  }

  const now = new Date().toISOString();
  const consentTimestamp = params.contact.consentTimestamp || now;

  // Upsert customer by normalized phone (avoid duplicates)
  let customerId = params.existingCustomerId || null;

  if (!customerId) {
    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone_e164', phoneE164)
      .maybeSingle();

    if (findError) {
      throw new LeadPersistenceError(SAVE_ERROR_AR, findError.code);
    }
    customerId = existing?.id ?? null;
  }

  if (customerId) {
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        full_name: params.contact.name.trim(),
        phone_e164: phoneE164,
        city: params.contact.city?.trim() || null,
        preferred_contact_method: toContactMethod(params.contact.preferredContactMethod),
        updated_at: now,
      })
      .eq('id', customerId);

    if (updateError) {
      throw new LeadPersistenceError(SAVE_ERROR_AR, updateError.code);
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('customers')
      .insert({
        full_name: params.contact.name.trim(),
        phone_e164: phoneE164,
        city: params.contact.city?.trim() || null,
        preferred_contact_method: toContactMethod(params.contact.preferredContactMethod),
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      throw new LeadPersistenceError(SAVE_ERROR_AR, insertError?.code);
    }
    customerId = inserted.id;
  }

  let leadSessionId = params.existingLeadSessionId || null;

  if (leadSessionId) {
    const { error: leadUpdateError } = await supabase
      .from('lead_sessions')
      .update({
        customer_id: customerId,
        current_step: 'customer_information_completed',
        status: 'incomplete',
        last_activity_at: now,
      })
      .eq('id', leadSessionId)
      .eq('status', 'incomplete');

    if (leadUpdateError) {
      throw new LeadPersistenceError(SAVE_ERROR_AR, leadUpdateError.code);
    }
  } else {
    const { data: lead, error: leadInsertError } = await supabase
      .from('lead_sessions')
      .insert({
        customer_id: customerId,
        session_id: params.localSessionId,
        source: LEAD_SOURCE,
        status: 'incomplete',
        current_step: 'customer_information_completed',
        started_at: now,
        last_activity_at: now,
      })
      .select('id')
      .single();

    if (leadInsertError || !lead) {
      throw new LeadPersistenceError(SAVE_ERROR_AR, leadInsertError?.code);
    }
    leadSessionId = lead.id;
  }

  // Always append a consent audit row (never silently flip marketing to true)
  const { error: consentError } = await supabase.from('consent_records').insert({
    customer_id: customerId,
    lead_session_id: leadSessionId,
    privacy_accepted: true,
    marketing_consent: Boolean(params.contact.marketingConsent),
    marketing_channels: params.contact.marketingConsent ? ['whatsapp', 'sms'] : [],
    consent_text_version: params.contact.consentTextVersion || CONSENT_TEXT_VERSION,
    source: LEAD_SOURCE,
    recorded_at: consentTimestamp,
  });

  if (consentError) {
    throw new LeadPersistenceError(SAVE_ERROR_AR, consentError.code);
  }

  return { customerId: customerId!, leadSessionId: leadSessionId! };
}

export async function updateLeadProgress(params: {
  leadSessionId: string;
  currentStep: string;
  selectedDepartment?: DepartmentId | null;
  answers?: Record<string, unknown>;
  measurements?: CustomerSession['measurements'];
  selectedDesignId?: string | null;
  sessionPayload?: Partial<CustomerSession>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = assertConfigured();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    current_step: params.currentStep,
    last_activity_at: now,
  };

  if (params.selectedDepartment !== undefined) {
    patch.selected_department = params.selectedDepartment;
  }
  if (params.answers !== undefined) {
    patch.answers = params.answers;
  }
  if (params.measurements !== undefined) {
    patch.measurements = params.measurements;
  }
  if (params.selectedDesignId !== undefined) {
    patch.selected_design_id = params.selectedDesignId;
  }
  if (params.sessionPayload !== undefined) {
    patch.session_payload = params.sessionPayload;
  }

  const { error } = await supabase
    .from('lead_sessions')
    .update(patch)
    .eq('id', params.leadSessionId)
    .eq('status', 'incomplete');

  if (error) {
    // Non-blocking for mid-journey progress; avoid crashing kiosk UX
    console.warn('Lead progress update failed');
  }
}

export async function completeLeadWithRequest(params: {
  customerId: string;
  leadSessionId: string;
  session: CustomerSession;
  contact: ContactInfo;
  requestNumber: string;
}): Promise<{ requestId: string; requestNumber: string }> {
  const supabase = assertConfigured();
  const now = new Date().toISOString();

  if (!params.session.departmentId) {
    throw new LeadPersistenceError('القسم غير محدد', 'NO_DEPARTMENT');
  }

  const phoneE164 = normalizeSaudiPhone(params.contact.phone);
  if (!phoneE164) {
    throw new LeadPersistenceError('يرجى إدخال رقم جوال سعودي صحيح', 'INVALID_PHONE');
  }

  const contactSnapshot = {
    name: params.contact.name,
    phone: phoneE164,
    city: params.contact.city || null,
    preferredContactMethod: params.contact.preferredContactMethod || null,
    privacyAccepted: params.contact.privacyAccepted,
    marketingConsent: params.contact.marketingConsent,
    consentTextVersion: params.contact.consentTextVersion,
  };

  const { data: request, error: requestError } = await supabase
    .from('sales_requests')
    .insert({
      request_number: params.requestNumber,
      customer_id: params.customerId,
      lead_session_id: params.leadSessionId,
      department_id: params.session.departmentId,
      contact_snapshot: contactSnapshot,
      answers: params.session.answers || {},
      measurements: params.session.measurements || null,
      uploaded_images: params.session.uploadedImages || [],
      generated_designs: params.session.generatedDesigns || [],
      selected_design_id: params.session.selectedDesignId,
      modification_history: params.session.modificationHistory || [],
      status: 'new',
      source: LEAD_SOURCE,
    })
    .select('id, request_number')
    .single();

  if (requestError || !request) {
    throw new LeadPersistenceError(SAVE_ERROR_AR, requestError?.code);
  }

  const { error: leadError } = await supabase
    .from('lead_sessions')
    .update({
      status: 'completed',
      current_step: 'request_submitted',
      completed_request_id: request.id,
      last_activity_at: now,
      selected_department: params.session.departmentId,
      answers: params.session.answers || {},
      measurements: params.session.measurements || null,
      selected_design_id: params.session.selectedDesignId,
    })
    .eq('id', params.leadSessionId);

  if (leadError) {
    throw new LeadPersistenceError(SAVE_ERROR_AR, leadError.code);
  }

  return { requestId: request.id, requestNumber: request.request_number };
}

export async function fetchIncompleteLeads(): Promise<IncompleteLeadView[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = assertConfigured();

  const { data, error } = await supabase
    .from('lead_sessions')
    .select(`
      id,
      session_id,
      status,
      current_step,
      selected_department,
      started_at,
      last_activity_at,
      customers (
        id,
        full_name,
        phone_e164,
        city,
        preferred_contact_method
      )
    `)
    .eq('status', 'incomplete')
    .order('last_activity_at', { ascending: false });

  if (error) {
    throw new LeadPersistenceError(SAVE_ERROR_AR, error.code);
  }

  const rows = (data || []) as unknown as IncompleteLeadRow[];

  // Fetch latest consent per lead in a second query for marketing flag
  const leadIds = rows.map((r) => r.id);
  const consentByLead = new Map<string, boolean>();

  if (leadIds.length > 0) {
    const { data: consents } = await supabase
      .from('consent_records')
      .select('lead_session_id, marketing_consent, recorded_at')
      .in('lead_session_id', leadIds)
      .order('recorded_at', { ascending: false });

    if (consents) {
      for (const c of consents) {
        if (c.lead_session_id && !consentByLead.has(c.lead_session_id)) {
          consentByLead.set(c.lead_session_id, Boolean(c.marketing_consent));
        }
      }
    }
  }

  return rows.map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    return {
      id: row.id,
      sessionId: row.session_id,
      customerId: customer?.id || '',
      fullName: customer?.full_name || '—',
      phoneE164: customer?.phone_e164 || '',
      city: customer?.city ?? null,
      preferredContactMethod: customer?.preferred_contact_method ?? null,
      currentStep: row.current_step,
      startedAt: new Date(row.started_at),
      lastActivityAt: new Date(row.last_activity_at),
      marketingConsent: consentByLead.get(row.id) ?? false,
      status: 'incomplete' as const,
    };
  });
}

export async function fetchIncompleteLeadById(id: string): Promise<IncompleteLeadView | null> {
  const leads = await fetchIncompleteLeads();
  return leads.find((l) => l.id === id) || null;
}

export { SAVE_ERROR_AR, getSupabaseConfigWarning, isSupabaseConfigured };
