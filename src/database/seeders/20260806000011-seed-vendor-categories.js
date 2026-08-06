/**
 * Seeder: Insert demo vendor categories
 *
 * These are the business types a vendor can serve. Vendors link to them via
 * the vendor_category_mappings junction table (assigned on the vendor form).
 */
export async function up({ context }) {
  return context.bulkInsert('vendor_categories', [
    {
      id: 100,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567891',
      code: 'CORP_TRAVEL',
      name: 'Corporate Travel',
      description: 'Travel agencies, airlines, hotels and car rentals',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 101,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567892',
      code: 'IT_SERVICES',
      name: 'IT Services & Software',
      description: 'Software, hardware, cloud services and IT support',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 102,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567893',
      code: 'CONSULTING',
      name: 'Consulting',
      description: 'Management, financial and technical consultants',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 103,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567894',
      code: 'OFFICE_SUPPLIES',
      name: 'Office Supplies',
      description: 'Stationery, furniture and general office consumables',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 104,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567895',
      code: 'LOGISTICS',
      name: 'Logistics & Transportation',
      description: 'Courier, freight and local transport services',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('vendor_categories', { id: [100, 101, 102, 103, 104] }, {});
}
