import * as procurementService from './procurement.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getAllProcurements = async (req, res, next) => {
  try {
    const result = await procurementService.getVisible(req.user, req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    return ApiResponse.paginated(res, result.rows, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
};

export const getProcurementByUuid = async (req, res, next) => {
  try {
    const doc = await procurementService.getByUuid(req.params.uuid, req.user);
    return ApiResponse.success(res, doc, 'Procurement document fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createProcurement = async (req, res, next) => {
  try {
    const doc = await procurementService.create(req.user, req.body);
    return ApiResponse.created(res, doc, 'Procurement request created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProcurement = async (req, res, next) => {
  try {
    const doc = await procurementService.update(req.params.uuid, req.user, req.body);
    return ApiResponse.success(res, doc, 'Procurement request updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProcurementItems = async (req, res, next) => {
  try {
    const doc = await procurementService.updateItems(req.params.uuid, req.user, req.body.items);
    return ApiResponse.success(res, doc, 'Procurement line items updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProcurement = async (req, res, next) => {
  try {
    const result = await procurementService.deleteRecord(req.params.uuid, req.user);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

// ── Workflow actions ──

export const submitProcurement = async (req, res, next) => {
  try {
    const doc = await procurementService.submit(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, doc, 'Procurement request submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const approveProcurement = async (req, res, next) => {
  try {
    const doc = await procurementService.approve(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, doc, 'Procurement request approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectProcurement = async (req, res, next) => {
  try {
    const doc = await procurementService.reject(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, doc, 'Procurement request rejected');
  } catch (error) {
    next(error);
  }
};

export const createPr = async (req, res, next) => {
  try {
    const doc = await procurementService.createPr(req.params.uuid, req.user);
    return ApiResponse.created(res, doc, 'Purchase request created from the PI');
  } catch (error) {
    next(error);
  }
};

export const createPo = async (req, res, next) => {
  try {
    const doc = await procurementService.createPo(req.params.uuid, req.user);
    return ApiResponse.created(res, doc, 'Purchase order created from the PR');
  } catch (error) {
    next(error);
  }
};

export const convertToExpense = async (req, res, next) => {
  try {
    const doc = await procurementService.convertToExpense(req.params.uuid, req.user);
    return ApiResponse.created(res, doc, 'Expense created from the approved quotation');
  } catch (error) {
    next(error);
  }
};

export const markReceived = async (req, res, next) => {
  try {
    const doc = await procurementService.received(req.params.uuid, req.user);
    return ApiResponse.success(res, doc, 'Purchase order marked as received');
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (req, res, next) => {
  try {
    const doc = await procurementService.pay(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, doc, 'Purchase order payment processed');
  } catch (error) {
    next(error);
  }
};

// ── Quotations ──

export const addQuotation = async (req, res, next) => {
  try {
    const quotation = await procurementService.addQuotation(req.params.uuid, req.user, req.body);
    return ApiResponse.created(res, quotation, 'Quotation added successfully');
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await procurementService.updateQuotation(req.params.uuid, req.params.quotationUuid, req.user, req.body);
    return ApiResponse.success(res, quotation, 'Quotation updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    const result = await procurementService.deleteQuotation(req.params.uuid, req.params.quotationUuid, req.user);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

export const submitQuotations = async (req, res, next) => {
  try {
    const doc = await procurementService.submitQuotations(req.params.uuid, req.user);
    return ApiResponse.success(res, doc, 'Quotations submitted for requester selection');
  } catch (error) {
    next(error);
  }
};

export const selectQuotation = async (req, res, next) => {
  try {
    const doc = await procurementService.selectQuotation(req.params.uuid, req.user, req.body.quotation_uuid);
    return ApiResponse.success(res, doc, 'Quotation selected');
  } catch (error) {
    next(error);
  }
};

// ── Documents ──

export const addDocument = async (req, res, next) => {
  try {
    const doc = await procurementService.addDocument({ ...req.body, procurement_uuid: req.params.uuid });
    return ApiResponse.created(res, doc, 'Document attached successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const result = await procurementService.deleteDocument(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
