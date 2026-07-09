export interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  confidence: number;
}

export interface CSVAnalysis {
  csvType: string;
  csvTypeDescription: string;
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  missingRequiredFields: string[];
}

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

export const CSV_FORMAT_EXAMPLES = [
  { name: 'Facebook Lead Ads', description: 'Facebook lead gen export', columns: ['Full Name', 'Email', 'Phone Number', 'City', 'Company Name'] },
  { name: 'Google Ads Lead Form', description: 'Google Ads lead export', columns: ['Name', 'Email', 'Phone', 'Company Name', 'City'] },
  { name: 'Zoho CRM Export', description: 'Zoho CRM leads export', columns: ['First Name', 'Last Name', 'Email', 'Mobile', 'Account Name', 'Lead Status'] },
  { name: 'HubSpot CRM Export', description: 'HubSpot contacts export', columns: ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'City'] },
  { name: 'Excel Spreadsheet', description: 'Generic spreadsheet', columns: ['Name', 'Contact', 'Email ID', 'Address', 'Remarks'] },
];
