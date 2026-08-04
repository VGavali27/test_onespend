import * as reimbursementRepository from './reimbursement.repository.js';
import ApiError from '../../utils/ApiError.js';
import { decryptAmounts } from '../../utils/encryption.js';

// Decrypt the money fields on a reimbursement header + its items (in place)
const decrypt = (re) => {
  if (!re) return re;
  if (re.dataValues) decryptAmounts(re.dataValues);
  else if (re) decryptAmounts(re);
  (re.items || []).forEach((i) => {
    if (i.dataValues) decryptAmounts(i.dataValues);
    else decryptAmounts(i);
  });
  return re;
};

// Fetch a reimbursement by the associated expense UUID
export const getByExpenseUuid = async (expenseUuid) => {
  const re = await reimbursementRepository.findByExpenseUuid(expenseUuid);
  if (!re) throw ApiError.notFound('Reimbursement not found');
  return decrypt(re);
};

// Fetch a reimbursement by its own UUID
export const getByUuid = async (uuid) => {
  const re = await reimbursementRepository.findByUuid(uuid);
  if (!re) throw ApiError.notFound('Reimbursement not found');
  return decrypt(re);
};

// Update a reimbursement header and replace its line items (for drafts)
export const update = async (uuid, data) => {
  const existing = await reimbursementRepository.findByUuid(uuid);
  if (!existing) throw ApiError.notFound('Reimbursement not found');

  const { items, ...header } = data;
  await reimbursementRepository.update(uuid, header);
  if (items !== undefined) {
    await reimbursementRepository.replaceItems(existing.id, items);
  }
  return decrypt(await reimbursementRepository.findByUuid(uuid));
};
