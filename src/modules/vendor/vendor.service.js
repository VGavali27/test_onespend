import * as vendorRepository from './vendor.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { Vendor, VendorContact, VendorAddress, VendorBankAccount, VendorDocument, sequelize } = db;

// List + options
export const getAll = async () => vendorRepository.findAll();
export const getOptions = async () => vendorRepository.findOptions();

// Full vendor by UUID (with contacts/addresses/bank accounts/documents)
export const getByUuid = async (uuid) => {
  const vendor = await vendorRepository.findByUuid(uuid);
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
};

// Replace a vendor's child sets (contacts/addresses/bank accounts) in a transaction
const replaceChildren = async (vendorId, contacts = [], addresses = [], bankAccounts = [], t) => {
  await VendorContact.destroy({ where: { vendor_id: vendorId }, force: true, transaction: t });
  await VendorAddress.destroy({ where: { vendor_id: vendorId }, force: true, transaction: t });
  await VendorBankAccount.destroy({ where: { vendor_id: vendorId }, force: true, transaction: t });
  if (contacts.length) await VendorContact.bulkCreate(contacts.map((c) => ({ ...c, vendor_id: vendorId })), { transaction: t });
  if (addresses.length) await VendorAddress.bulkCreate(addresses.map((a) => ({ ...a, vendor_id: vendorId })), { transaction: t });
  if (bankAccounts.length) await VendorBankAccount.bulkCreate(bankAccounts.map((b) => ({ ...b, vendor_id: vendorId })), { transaction: t });
};

// Create a vendor + its children in one transaction
export const create = async (data) => {
  const { contacts = [], addresses = [], bank_accounts = [], ...vendorData } = data;

  if (vendorData.code) {
    const existing = await vendorRepository.findByCode(vendorData.code);
    if (existing) throw ApiError.conflict('Vendor code already exists');
  }

  return sequelize.transaction(async (t) => {
    const vendor = await vendorRepository.create(vendorData, t);
    await replaceChildren(vendor.id, contacts, addresses, bank_accounts, t);
    return vendorRepository.findByUuid(vendor.uuid, t);
  });
};

// Update a vendor — replaces child sets when provided
export const update = async (uuid, data) => {
  const vendor = await vendorRepository.findByUuid(uuid);
  if (!vendor) throw ApiError.notFound('Vendor not found');

  if (data.code && data.code !== vendor.code) {
    const existing = await vendorRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Vendor code already exists');
  }

  const { contacts, addresses, bank_accounts, ...vendorData } = data;

  return sequelize.transaction(async (t) => {
    await vendor.update(vendorData, { transaction: t });
    if (contacts !== undefined || addresses !== undefined || bank_accounts !== undefined) {
      await replaceChildren(vendor.id, contacts ?? [], addresses ?? [], bank_accounts ?? [], t);
    }
    return vendorRepository.findByUuid(uuid, t);
  });
};

// Soft delete a vendor by UUID
export const deleteRecord = async (uuid) => {
  const deleted = await vendorRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Vendor not found');
  return { message: 'Vendor deleted successfully' };
};

// ── Vendor documents (separate routes — files are attached/deleted individually) ──

export const addDocument = async (data) => {
  const vendor = await Vendor.findOne({ where: { uuid: data.vendor_uuid } });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  const { vendor_uuid, ...docData } = data;
  return VendorDocument.create({ ...docData, vendor_id: vendor.id });
};

export const deleteDocument = async (uuid) => {
  const doc = await VendorDocument.findOne({ where: { uuid } });
  if (!doc) throw ApiError.notFound('Document not found');
  await doc.destroy();
  return { message: 'Document deleted successfully' };
};
