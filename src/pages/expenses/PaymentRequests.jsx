import MyExpenses from './MyExpenses';
import { getMyPaymentRequests } from '@/services/expenseService';

export default function PaymentRequests() {
  return (
    <MyExpenses
      title="Payment Requests"
      fetchList={getMyPaymentRequests}
      actionMode="payments"
    />
  );
}
