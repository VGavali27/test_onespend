import api from '@/services/api';

// ── Expenses ──
// decrypt=true → the backend decrypts AES-encrypted amount fields before sending
// `config` (e.g. { signal }) is forwarded so the paginated DataTable can cancel stale requests
export const getExpenses = (params, config) =>
  api.get('/expenses', { ...config, params: { decrypt: 'true', ...params } });
// Expenses created by the logged-in user
export const getMyExpenses = (params, config) =>
  api.get('/expenses/my', { ...config, params: { decrypt: 'true', ...params } });
export const getExpenseById = (uuid) => api.get(`/expenses/${uuid}`, { params: { decrypt: 'true' } });
export const createExpense = (payload) => api.post('/expenses', payload);
export const updateExpense = (uuid, payload) => api.put(`/expenses/${uuid}`, payload);
export const deleteExpense = (uuid) => api.delete(`/expenses/${uuid}`);

// Expense documents & handovers — add here when the backend endpoints exist.

// ── Display normalization ──
// Map an API expense payload (snake_case, nested associations) into the shape the
// expenses pages render. Amounts arrive decrypted (numbers) because decrypt=true.
const num = (v) => (v == null || v === '' ? null : Number(v));

const mapSegment = (s) => ({
  travel_mode: s.travel_mode,
  from_location: s.from_location,
  to_location: s.to_location,
  departure_datetime: s.departure_datetime,
  arrival_datetime: s.arrival_datetime,
  estimated_amount: num(s.estimated_amount),
});

const mapAccommodation = (a) => ({
  hotel: a.property_name || a.city,
  city: a.city,
  check_in: a.check_in,
  check_out: a.check_out,
  estimated_amount: num(a.estimated_amount),
});

const mapForex = (f) => ({
  currency: f.currency_code,
  rate: num(f.exchange_rate),
  foreignAmount: num(f.estimated_foreign_amount),
  amount: num(f.estimated_amount),
});

const mapLocalTransport = (t) => ({
  mode: t.transport_type,
  fromLocation: t.from_location,
  toLocation: t.to_location,
  description: [t.from_location, t.to_location].filter(Boolean).join(' → '),
  travel_datetime: t.travel_datetime,
  estimated_amount: num(t.estimated_amount),
});

const mapMisc = (m) => ({
  description: m.expense_type,
  vendor_name: m.vendor_name,
  expense_date: m.expense_date,
  estimated_amount: num(m.estimated_amount),
});

// Group expense_documents by module + record id → [{ name, url }], so each sub-part
// item can be paired with its own attachments.
const buildDocGroups = (documents = []) => {
  const groups = { segment: new Map(), accommodation: new Map(), forex: new Map(), localTransport: new Map(), misc: new Map(), item: new Map() };
  const moduleKey = {
    travel_segment: 'segment',
    travel_accommodation: 'accommodation',
    travel_forex: 'forex',
    travel_local_transport: 'localTransport',
    travel_misc_expense: 'misc',
    reimbursement_item: 'item',
  };
  for (const d of documents || []) {
    const key = moduleKey[d.module_name];
    const map = key && groups[key];
    if (!map || d.module_record_id == null) continue;
    if (!map.has(d.module_record_id)) map.set(d.module_record_id, []);
    map.get(d.module_record_id).push({ name: d.original_file_name, url: d.file_path });
  }
  return groups;
};

export const normalizeExpense = (e) => {
  const docGroups = buildDocGroups(e.documents);

  const travel = e.travelExpense
    ? {
        travel_type: e.travelExpense.travel_type,
        purpose: e.travelExpense.purpose,
        travel_start_date: e.travelExpense.travel_start_date,
        travel_end_date: e.travelExpense.travel_end_date,
        total_travellers: e.travelExpense.total_travellers,
        notes: e.travelExpense.notes,
        segments: (e.travelExpense.segments || []).map((s) => ({ ...mapSegment(s), id: s.id, attachments: docGroups.segment.get(s.id) || [] })),
        accommodations: (e.travelExpense.accommodations || []).map((a) => ({ ...mapAccommodation(a), id: a.id, attachments: docGroups.accommodation.get(a.id) || [] })),
        forex: (e.travelExpense.forex || []).map((f) => ({ ...mapForex(f), id: f.id, attachments: docGroups.forex.get(f.id) || [] })),
        localTransports: (e.travelExpense.localTransports || []).map((t) => ({ ...mapLocalTransport(t), id: t.id, attachments: docGroups.localTransport.get(t.id) || [] })),
        miscExpenses: (e.travelExpense.miscExpenses || []).map((m) => ({ ...mapMisc(m), id: m.id, attachments: docGroups.misc.get(m.id) || [] })),
      }
    : null;

  const reimbursement = e.reimbursementExpense
    ? {
        advance_amount: num(e.reimbursementExpense.advance_amount),
        advance_date: e.reimbursementExpense.advance_date,
        payment_method: e.reimbursementExpense.payment_method,
        remarks: e.reimbursementExpense.remarks,
        items: (e.reimbursementExpense.items || []).map((i) => ({
          expense_date: i.expense_date,
          description: i.description,
          bill_number: i.bill_number,
          expense_type: i.expense_type,
          total_amount: num(i.total_amount),
          id: i.id,
          attachments: docGroups.item.get(i.id) || [],
        })),
      }
    : null;

  const employmentName = (emp) => {
    if (!emp) return null;
    const u = emp.user;
    if (u) return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
    return null;
  };

  return {
    id: e.uuid, // id = uuid so list links (/expenses/:uuid) work unchanged
    uuid: e.uuid,
    expense_number: e.expense_number,
    title: e.title,
    remarks: e.remarks,
    status: e.status,
    canEdit: e.canEdit === true, // DRAFT + owned by the logged-in user
    requestedByEmployment: e.requestedByEmployment || null,
    submitted_at: e.submitted_at,
    estimated_amount: num(e.estimated_amount),
    final_amount: num(e.final_amount),
    paid_amount: num(e.paid_amount),
    category: e.category ? { name: e.category.name } : null,
    company: e.company ? { name: e.company.name } : null,
    travel,
    reimbursement,
    handovers: (e.handovers || []).map((h) => ({
      action_type: h.action_type,
      remarks: h.remarks,
      from_role: h.fromRole?.name,
      to_role: h.toRole?.name,
      action_by: employmentName(h.actionBy),
      at: h.created_at,
    })),
    documents: (e.documents || []).map((d) => ({ name: d.original_file_name })),
  };
};

// ── Edit form conversion ──
// Map a raw API expense payload back into the create-form's defaultValues shape.
// Row field names already match the backend child schemas; amounts become strings.
const str = (v) => (v == null || v === '' ? '' : String(v));

const SEGMENT_KEYS = ['travel_mode', 'from_location', 'to_location', 'departure_datetime', 'arrival_datetime', 'estimated_amount'];
const ACCOMMODATION_KEYS = ['accommodation_type', 'city', 'property_name', 'check_in', 'check_out', 'estimated_amount'];
const FOREX_KEYS = ['currency_code', 'exchange_rate', 'estimated_foreign_amount', 'estimated_amount'];
const LOCAL_TRANSPORT_KEYS = ['transport_type', 'from_location', 'to_location', 'travel_datetime', 'estimated_amount'];
const MISC_KEYS = ['expense_type', 'expense_date', 'vendor_name', 'estimated_amount'];
const REIMBURSEMENT_ITEM_KEYS = ['expense_date', 'description', 'bill_number', 'expense_type', 'total_amount'];
const AMOUNT_KEYS = new Set(['estimated_amount', 'exchange_rate', 'estimated_foreign_amount', 'total_amount']);

const emptyTravel = {
  travel_type: 'DOMESTIC', purpose: '', travel_start_date: '', travel_end_date: '',
  total_travellers: 1, notes: '',
  segments: [], accommodations: [], forex: [], localTransports: [], miscExpenses: [],
};
const emptyReimbursement = {
  advance_amount: '', advance_date: '', payment_method: 'CASH', remarks: '', items: [],
};

// Same as pickRows but attaches any existing documents (from the detail response) so the
// edit form shows them as already-uploaded attachments.
const pickRowsWithDocs = (rows = [], keys, docMap) =>
  rows.map((r) => {
    const out = {};
    keys.forEach((k) => {
      out[k] = AMOUNT_KEYS.has(k) ? str(r[k]) : r[k] ?? '';
    });
    const docs = docMap.get(r.id);
    if (docs?.length) out.attachments = docs;
    return out;
  });

export const expenseToFormValues = (e) => {
  const docGroups = buildDocGroups(e.documents);

  const travel = e.travelExpense
    ? {
        travel_type: e.travelExpense.travel_type || 'DOMESTIC',
        purpose: e.travelExpense.purpose || '',
        travel_start_date: e.travelExpense.travel_start_date || '',
        travel_end_date: e.travelExpense.travel_end_date || '',
        total_travellers: e.travelExpense.total_travellers ?? 1,
        notes: e.travelExpense.notes || '',
        segments: pickRowsWithDocs(e.travelExpense.segments, SEGMENT_KEYS, docGroups.segment),
        accommodations: pickRowsWithDocs(e.travelExpense.accommodations, ACCOMMODATION_KEYS, docGroups.accommodation),
        forex: pickRowsWithDocs(e.travelExpense.forex, FOREX_KEYS, docGroups.forex),
        localTransports: pickRowsWithDocs(e.travelExpense.localTransports, LOCAL_TRANSPORT_KEYS, docGroups.localTransport),
        miscExpenses: pickRowsWithDocs(e.travelExpense.miscExpenses, MISC_KEYS, docGroups.misc),
      }
    : { ...emptyTravel };

  const reimbursement = e.reimbursementExpense
    ? {
        advance_amount: str(e.reimbursementExpense.advance_amount),
        advance_date: e.reimbursementExpense.advance_date || '',
        payment_method: e.reimbursementExpense.payment_method || 'CASH',
        remarks: e.reimbursementExpense.remarks || '',
        items: pickRowsWithDocs(e.reimbursementExpense.items, REIMBURSEMENT_ITEM_KEYS, docGroups.item),
      }
    : { ...emptyReimbursement };

  return {
    module: e.travelExpense ? 'travel' : e.reimbursementExpense ? 'reimbursement' : '',
    category: e.category?.uuid || '',
    title: e.title || '',
    company: e.company?.uuid || '',
    remarks: e.remarks || '',
    travel,
    reimbursement,
  };
};
