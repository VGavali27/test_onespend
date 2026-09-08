/**
 * Seeder: 5 real-world demo vendors
 *
 * Each vendor links to one of the seeded vendor_categories (ids 100-104) via the
 * vendor_category_mappings junction, and carries a primary contact, registered
 * address, and primary bank account. Bank account numbers are AES-encrypted here
 * with the same util the model hook uses (bulkInsert bypasses Sequelize hooks),
 * so the stored format matches what the app writes at runtime.
 */
import { encrypt } from '../../utils/encryption.js';

// Full valid RFC-4122 UUIDs: 8-4-4-4-12 groups (32 hex + 4 dashes). The tail group
// is padStart'd to 12 hex chars — earlier iterations concatenated a short tail and
// wrote 34-char strings that Joi's string().uuid() rejects.
const VENDOR_PREFIX = 'b4c5d6e7-f8a9-0123-9cde';
const CHILD_PREFIX = 'c4d5e6f7-f8a9-4123-9eab';

const vendors = [
  {
    id: 200,
    uuid: `${VENDOR_PREFIX}-000000000200`,
    code: 'MAKE_MY_TRIP',
    name: 'MakeMyTrip India Private Limited',
    vendor_type: 'VENDOR',
    website: 'https://www.makemytrip.com',
    gst_number: '07AACCM0186F1ZH',
    pan_number: 'AACCM0186F',
    cin_number: 'U63040DL2000PTC107321',
    payment_terms: 'Net 15',
    rating: 4.4,
    notes: 'Corporate travel agency & portal - flights, hotels, buses, cabs. Primary supplier for business travel bookings.',
    categoryId: 100,
    contact: {
      salutation: 'Mr.',
      first_name: 'Amit',
      last_name: 'Sharma',
      designation: 'Senior Account Manager (Corporate)',
      email: 'corporate.sales@makemytrip.com',
      phone: '+91-11-4000-1000',
      mobile: '+91-98100-10001',
    },
    address: {
      address_line_1: 'Building No. 14, Tower B, DLF Cyber City',
      address_line_2: 'Phase 2, Sector 24',
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
      pincode: '122002',
    },
    bank: {
      account_holder_name: 'MakeMyTrip India Private Limited',
      bank_name: 'HDFC Bank',
      bank_branch: 'DLF Cyber City, Gurugram',
      account_number: '51100012345678',
      ifsc: 'HDFC0001234',
      swift_code: 'HDFCINBB',
      currency_code: 'INR',
    },
  },
  {
    id: 201,
    uuid: `${VENDOR_PREFIX}-000000000201`,
    code: 'MSFT_INDIA',
    name: 'Microsoft Corporation India Pvt Ltd',
    vendor_type: 'VENDOR',
    website: 'https://www.microsoft.com/en-in',
    gst_number: '06AAACM6121B1ZC',
    pan_number: 'AAACM6121B',
    cin_number: 'U72200KA2006FTC040257',
    payment_terms: 'Net 30',
    rating: 4.7,
    notes: 'Cloud, software licensing (M365, Azure), hardware and enterprise support services.',
    categoryId: 101,
    contact: {
      salutation: 'Ms.',
      first_name: 'Priya',
      last_name: 'Rao',
      designation: 'Enterprise Account Executive',
      email: 'accounts-india@microsoft.com',
      phone: '+91-80-4906-2300',
      mobile: '+91-98450-20001',
    },
    address: {
      address_line_1: 'Vista Building, Embassy Golf Links Business Park',
      address_line_2: 'Challaghatta',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560071',
    },
    bank: {
      account_holder_name: 'Microsoft Corporation India Pvt Ltd',
      bank_name: 'Citibank N.A.',
      bank_branch: 'MG Road, Bengaluru',
      account_number: '09876543211234',
      ifsc: 'CITI0000003',
      swift_code: 'CITIINBX',
      currency_code: 'INR',
    },
  },
  {
    id: 202,
    uuid: `${VENDOR_PREFIX}-000000000202`,
    code: 'ACCENTURE_IND',
    name: 'Accenture Solutions Private Limited',
    vendor_type: 'SERVICE_VENDOR',
    website: 'https://www.accenture.com/in-en',
    gst_number: '27AABCB7826P1ZD',
    pan_number: 'AACCB7826P',
    cin_number: 'U74140MH2001FTC130344',
    payment_terms: 'Net 30',
    rating: 4.5,
    notes: 'Management, technology and business-process consulting engagements.',
    categoryId: 102,
    contact: {
      salutation: 'Mr.',
      first_name: 'Rahul',
      last_name: 'Deshpande',
      designation: 'Engagement Manager',
      email: 'engagements.in@accenture.com',
      phone: '+91-22-6732-5000',
      mobile: '+91-98200-20001',
    },
    address: {
      address_line_1: 'One International Center, Tower 3',
      address_line_2: 'Senapati Bapat Marg, Prabhadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400013',
    },
    bank: {
      account_holder_name: 'Accenture Solutions Private Limited',
      bank_name: 'ICICI Bank',
      bank_branch: 'Prabhadevi, Mumbai',
      account_number: '004701234567',
      ifsc: 'ICIC0000047',
      swift_code: 'ICICINBB',
      currency_code: 'INR',
    },
  },
  {
    id: 203,
    uuid: `${VENDOR_PREFIX}-000000000203`,
    code: '3M_INDIA',
    name: '3M India Limited',
    vendor_type: 'VENDOR',
    website: 'https://www.3mindia.co.in',
    gst_number: '29AAACB5018R1ZM',
    pan_number: 'AAACB5018R',
    cin_number: 'U21092KA1988PLC004890',
    payment_terms: 'Net 15',
    rating: 4.3,
    notes: 'Office supplies, stationery, post-it, tapes, labelling and workplace safety products.',
    categoryId: 103,
    contact: {
      salutation: 'Mr.',
      first_name: 'Suresh',
      last_name: 'Kulkarni',
      designation: 'Key Account Manager - Office Retail',
      email: 'office.supplies@3mindia.co.in',
      phone: '+91-80-4901-0000',
      mobile: '+91-98440-30001',
    },
    address: {
      address_line_1: 'No. 45, Ulsoor Road',
      address_line_2: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560042',
    },
    bank: {
      account_holder_name: '3M India Limited',
      bank_name: 'State Bank of India',
      bank_branch: 'Ulsoor, Bengaluru',
      account_number: '40212345678',
      ifsc: 'SBIN0007818',
      swift_code: 'SBININBB',
      currency_code: 'INR',
    },
  },
  {
    id: 204,
    uuid: `${VENDOR_PREFIX}-000000000204`,
    code: 'BLUE_DART',
    name: 'Blue Dart Express Limited',
    vendor_type: 'VENDOR',
    website: 'https://www.bluedart.com',
    gst_number: '24AABCB8294N1ZW',
    pan_number: 'AACCB8294N',
    cin_number: 'U63032MH1983PLC030447',
    payment_terms: 'Net 15',
    rating: 4.2,
    notes: 'Domestic and international air express, courier and cargo logistics. Corporate on-account billing available.',
    categoryId: 104,
    contact: {
      salutation: 'Ms.',
      first_name: 'Neha',
      last_name: 'Menon',
      designation: 'Corporate Sales Executive',
      email: 'corporate@bluedart.com',
      phone: '+91-22-4009-4009',
      mobile: '+91-99300-40001',
    },
    address: {
      address_line_1: 'Blue Dart Centre, Sahar Airport Road',
      address_line_2: 'Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400099',
    },
    bank: {
      account_holder_name: 'Blue Dart Express Limited',
      bank_name: 'Axis Bank',
      bank_branch: 'Andheri East, Mumbai',
      account_number: '911020012345678',
      ifsc: 'UTIB0000111',
      swift_code: 'AXISINBB',
      currency_code: 'INR',
    },
  },
];

const now = () => new Date();

export async function up({ context }) {
  const vendorsRows = vendors.map((v) => ({
    id: v.id,
    uuid: v.uuid,
    name: v.name,
    code: v.code,
    vendor_type: v.vendor_type,
    website: v.website,
    gst_number: v.gst_number,
    pan_number: v.pan_number,
    cin_number: v.cin_number,
    payment_terms: v.payment_terms,
    rating: v.rating,
    notes: v.notes,
    status: 'ACTIVE',
    created_at: now(),
    updated_at: now(),
  }));

  await context.bulkInsert('vendors', vendorsRows);

  const contactsRows = [];
  const addressesRows = [];
  const banksRows = [];
  const mappingsRows = [];

  vendors.forEach((v, i) => {
    contactsRows.push({
      uuid: `${CHILD_PREFIX}-${String(v.id).padStart(12, '0')}`,
      vendor_id: v.id,
      contact_type: 'PRIMARY',
      salutation: v.contact.salutation,
      first_name: v.contact.first_name,
      last_name: v.contact.last_name,
      designation: v.contact.designation,
      email: v.contact.email,
      phone: v.contact.phone,
      mobile: v.contact.mobile,
      is_primary: true,
      status: 'ACTIVE',
      created_at: now(),
      updated_at: now(),
    });

    addressesRows.push({
      uuid: `${CHILD_PREFIX}-${String(v.id).padStart(12, '0')}`,
      vendor_id: v.id,
      address_type: 'REGISTERED',
      address_line_1: v.address.address_line_1,
      address_line_2: v.address.address_line_2 || null,
      city: v.address.city,
      state: v.address.state,
      country: v.address.country,
      pincode: v.address.pincode,
      is_primary: true,
      status: 'ACTIVE',
      created_at: now(),
      updated_at: now(),
    });

    banksRows.push({
      uuid: `${CHILD_PREFIX}-${String(v.id).padStart(12, '0')}`,
      vendor_id: v.id,
      account_type: 'PRIMARY',
      account_holder_name: v.bank.account_holder_name,
      bank_name: v.bank.bank_name,
      bank_branch: v.bank.bank_branch,
      account_number: encrypt(v.bank.account_number),
      ifsc: v.bank.ifsc,
      swift_code: v.bank.swift_code,
      currency_code: v.bank.currency_code,
      is_primary: true,
      status: 'ACTIVE',
      created_at: now(),
      updated_at: now(),
    });

    mappingsRows.push({
      vendor_id: v.id,
      vendor_category_id: v.categoryId,
      created_at: now(),
      updated_at: now(),
    });
  });

  await context.bulkInsert('vendor_contacts', contactsRows);
  await context.bulkInsert('vendor_addresses', addressesRows);
  await context.bulkInsert('vendor_bank_accounts', banksRows);
  await context.bulkInsert('vendor_category_mappings', mappingsRows);
}

export async function down({ context }) {
  const ids = vendors.map((v) => v.id);
  await context.bulkDelete('vendor_category_mappings', { vendor_id: ids }, {});
  await context.bulkDelete('vendor_bank_accounts', { vendor_id: ids }, {});
  await context.bulkDelete('vendor_addresses', { vendor_id: ids }, {});
  await context.bulkDelete('vendor_contacts', { vendor_id: ids }, {});
  await context.bulkDelete('vendors', { id: ids }, {});
}