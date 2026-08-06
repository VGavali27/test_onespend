import db from '../../database/models/index.js';
import { decrypt } from '../../utils/encryption.js';

const { Vendor, VendorContact, VendorAddress, VendorBankAccount, VendorDocument } = db;

// Children loaded with a single vendor (detail view)
const childInclude = [
  { model: VendorContact, as: 'contacts' },
  { model: VendorAddress, as: 'addresses' },
  { model: VendorBankAccount, as: 'bankAccounts' },
  { model: VendorDocument, as: 'documents' },
];

// Bank account numbers are encrypted at rest — decrypt them for display
const decryptBankAccounts = (vendor) => {
  (vendor?.bankAccounts || []).forEach((b) => {
    if (b.account_number) b.account_number = decrypt(b.account_number);
  });
  return vendor;
};

// Lightweight list — only the fields the vendors table renders
export const findAll = async () =>
  Vendor.findAll({
    order: [['createdAt', 'DESC']],
    attributes: ['uuid', 'name', 'code', 'vendor_type', 'logo_img', 'status', 'createdAt'],
  });

// Lightweight dropdown options — only uuid + name
export const findOptions = async () =>
  Vendor.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });

// Find a vendor by UUID — full detail with children (bank accounts decrypted).
// Accepts a transaction so reads inside create/update transactions see the new row.
export const findByUuid = async (uuid, transaction) =>
  decryptBankAccounts(
    Vendor.findOne({ where: { uuid }, include: childInclude, ...(transaction ? { transaction } : {}) })
  );

// Find a vendor by its unique code
export const findByCode = async (code) => Vendor.findOne({ where: { code } });

// Find a vendor by primary key ID
export const findById = async (id) => Vendor.findByPk(id);

// Create a vendor record (children handled in the service transaction)
export const create = async (data, transaction) => Vendor.create(data, transaction ? { transaction } : {});

// Update a vendor by UUID — returns null if not found
export const update = async (uuid, data) => {
  const vendor = await Vendor.findOne({ where: { uuid } });
  if (!vendor) return null;
  return vendor.update(data);
};

// Soft delete a vendor by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const vendor = await Vendor.findOne({ where: { uuid } });
  if (!vendor) return false;
  await vendor.destroy();
  return true;
};
