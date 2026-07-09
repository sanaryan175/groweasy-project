export const CRM_FIELDS: { field: string; description: string; required: boolean }[] = [
  { field: 'created_at', description: 'Creation date', required: false },
  { field: 'name', description: 'Full name', required: true },
  { field: 'email', description: 'Email address', required: false },
  { field: 'country_code', description: 'Country code like +91', required: false },
  { field: 'mobile_without_country_code', description: 'Mobile number without country code', required: false },
  { field: 'company', description: 'Company name', required: false },
  { field: 'city', description: 'City', required: false },
  { field: 'state', description: 'State or region', required: false },
  { field: 'country', description: 'Country', required: false },
  { field: 'lead_owner', description: 'Assigned person', required: false },
  { field: 'crm_status', description: 'CRM pipeline status', required: false },
  { field: 'crm_note', description: 'Notes, follow-ups, extra contacts', required: false },
  { field: 'data_source', description: 'Lead source', required: false },
  { field: 'possession_time', description: 'Possession time', required: false },
  { field: 'description', description: 'General comments', required: false },
];

export const CRM_FIELD_NAMES = CRM_FIELDS.map(f => f.field);

export const DO_NOT_IMPORT = '__skip__';
