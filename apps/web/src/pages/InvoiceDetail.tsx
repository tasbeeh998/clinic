import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { invoicesService } from '../services/invoices.service';
import { paymentsService, PaymentMethod } from '../services/payments.service';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/dateFormat';
import { normalizeDigits } from '../utils/numeral';

export default function InvoiceDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: t('payments.methodCash'),
    VISA: t('payments.methodVisa'),
    KNET: t('payments.methodKnet'),
    OTHER: t('payments.methodOther'),
  };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesService.getInvoice(id!),
    enabled: !!id,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsService.getPaymentsForInvoice(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ISSUED' | 'VOID') => invoicesService.updateInvoiceStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      paymentsService.createPayment({
        invoiceId: id!,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes || undefined,
      }),
    onSuccess: () => {
      setPaymentAmount('');
      setPaymentNotes('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const reversePaymentMutation = useMutation({
    mutationFn: ({ paymentId, reversalNotes }: { paymentId: string; reversalNotes?: string }) =>
      paymentsService.reversePayment(paymentId, reversalNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const replacementMutation = useMutation({
    mutationFn: (replacementData: { items: any[]; additionalCharges?: any[] }) =>
      invoicesService.createReplacement(id!, replacementData),
    onSuccess: (newInvoice) => {
      navigate(`/invoices/${newInvoice.id}`);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [reversalNotes, setReversalNotes] = useState('');
  const [paymentToReverse, setPaymentToReverse] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Downloads the PDF (already localized server-side via `lang`) and saves it
  // via a temporary <a> click — the standard no-library way to save a Blob.
  const downloadPdfFile = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!invoice) return null;
    setFormError(null);
    setIsGeneratingPdf(true);
    try {
      const blob = await invoicesService.downloadInvoicePdf(invoice.id, i18n.language);
      const fileName = `${invoice.invoiceNumber}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { blob, fileName };
    } catch (err) {
      setFormError(t('invoices.pdfDownloadFailed'));
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadPdfFile();
  };

  // WhatsApp can't be handed a file via a wa.me link (no API for that), so:
  // on devices/browsers that support the native share sheet with files
  // (mainly mobile), we hand it the PDF directly and WhatsApp shows up as one
  // of the share targets. Everywhere else, we fall back to downloading the
  // file and opening a pre-filled wa.me chat, and the person attaches the
  // file manually from their Downloads.
  const handleSendWhatsapp = async () => {
    const result = await downloadPdfFile();
    if (!result || !invoice) return;
    const { blob, fileName } = result;

    const file = new File([blob], fileName, { type: 'application/pdf' });
    const canShareFile =
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] });

    if (canShareFile) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        // User cancelled the share sheet, or it failed — fall through to the
        // wa.me fallback below instead of leaving them with nothing.
      }
    }

    const digitsOnly = (invoice.patient.phone || '').replace(/[^\d]/g, '');
    const message =
      i18n.language === 'ar'
        ? `مرفق فاتورتكم رقم ${invoice.invoiceNumber} من مركز العيادات التخصصية.`
        : `Attached is your invoice No. ${invoice.invoiceNumber} from Specialized Clinics Center.`;
    window.open(`https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setFormError(t('payments.enterValidAmount'));
      return;
    }
    paymentMutation.mutate();
  };

  if (invoiceLoading || !invoice) {
    return (
      <div className="min-h-screen bg-[#F6F7FA]">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    DRAFT: t('invoices.statusDraft'),
    ISSUED: t('invoices.statusIssued'),
    VOID: t('invoices.statusVoid'),
  };
  const paymentStatusLabels: Record<string, string> = {
    UNPAID: t('invoices.unpaid'),
    PARTIALLY_PAID: t('invoices.partiallyPaid'),
    PAID: t('invoices.paidInFull'),
  };

  const canRecordPayment = invoice.status === 'ISSUED' && invoice.paymentStatus !== 'PAID';

  return (
    <div className="min-h-screen bg-[#F6F7FA]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate('/invoices')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md text-gray-700 mb-4 sm:w-auto sm:h-auto sm:rounded-none sm:bg-transparent sm:shadow-none sm:text-[#4B5694] sm:hover:text-[#111844] sm:text-sm"
        >
          <span className="sm:hidden">{i18n.language === 'ar' ? '›' : '‹'}</span>
          <span className="hidden sm:inline">← {t('invoices.backToInvoices')}</span>
        </button>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111844]">{invoice.invoiceNumber}</h1>
              <p className="text-gray-600">{invoice.patient.fullNameAr}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {invoice.status === 'DRAFT' && (
                <button
                  onClick={() => statusMutation.mutate('ISSUED')}
                  disabled={statusMutation.isPending}
                  className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50"
                >
                  {t('invoices.issueInvoice')}
                </button>
              )}
              {invoice.status !== 'VOID' && isAdmin && (
                <button
                  onClick={() => {
                    if (window.confirm(t('invoices.voidConfirm'))) {
                      statusMutation.mutate('VOID');
                    }
                  }}
                  disabled={statusMutation.isPending}
                  className="px-4 py-2 border border-[#C4362B] text-[#C4362B] rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {t('invoices.voidInvoice')}
                </button>
              )}
              {invoice.status === 'ISSUED' && isAdmin && (
                <button
                  onClick={() => setShowReplacementForm(!showReplacementForm)}
                  className="px-4 py-2 border border-[#4B5694] text-[#4B5694] rounded-md hover:bg-blue-50 transition-colors"
                >
                  {t('invoices.createReplacement')}
                </button>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isGeneratingPdf ? t('invoices.downloading') : t('invoices.downloadPdf')}
              </button>
              {invoice.patient.phone && (
                <button
                  onClick={handleSendWhatsapp}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-[#25D366] text-white rounded-md hover:bg-[#1ebe57] transition-colors disabled:opacity-50"
                >
                  {t('invoices.sendWhatsapp')}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">{t('invoices.invoiceStatus')}</div>
              <div className="font-medium text-gray-900">{statusLabels[invoice.status]}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('invoices.paymentStatusLabel')}</div>
              <div className="font-medium text-gray-900">{paymentStatusLabels[invoice.paymentStatus]}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('invoices.createdDate')}</div>
              <div className="font-medium text-gray-900">{formatDateTime(invoice.createdAt, i18n.language)}</div>
            </div>
            {invoice.issuedAt && (
              <div>
                <div className="text-gray-500">{t('invoices.issuedDate')}</div>
                <div className="font-medium text-gray-900">{formatDateTime(invoice.issuedAt, i18n.language)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('invoices.service')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('services.price')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('invoices.quantity')}</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('invoices.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.invoiceItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-gray-900">{item.serviceNameSnapshot}</td>
                  <td className="px-6 py-4 text-gray-700">{parseFloat(item.unitPriceSnapshot).toFixed(3)} {t('common.currency')}</td>
                  <td className="px-6 py-4 text-gray-700">{item.quantity}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{parseFloat(item.lineTotal).toFixed(3)} {t('common.currency')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-200 p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('invoices.subtotal')}</span>
              <span className="text-gray-900">{parseFloat(invoice.subtotal).toFixed(3)} {t('common.currency')}</span>
            </div>
            {invoice.additionalCharges && invoice.additionalCharges.length > 0 && (
              invoice.additionalCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {charge.description || (charge.chargeType === 'PERCENTAGE' ? t('invoices.percentageCharge') : t('invoices.fixedCharge'))}
                    ({charge.chargeType === 'PERCENTAGE' ? `${parseFloat(charge.chargeValue)}%` : `${parseFloat(charge.chargeValue).toFixed(3)} ${t('common.currency')}`})
                  </span>
                  <span className="text-gray-900">{parseFloat(charge.calculatedAmount).toFixed(3)} {t('common.currency')}</span>
                </div>
              ))
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">{t('invoices.total')}</span>
              <span className="font-bold text-[#111844]">{parseFloat(invoice.total).toFixed(3)} {t('common.currency')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('invoices.paid')}</span>
              <span className="text-gray-900">{parseFloat(invoice.paid).toFixed(3)} {t('common.currency')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('invoices.remaining')}</span>
              <span className="font-bold text-[#C4362B]">{parseFloat(invoice.remaining).toFixed(3)} {t('common.currency')}</span>
            </div>
          </div>
        </div>

        {/* Invoice Replacement Form - Admin Only */}
        {showReplacementForm && isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-[#111844] mb-4">{t('invoices.createReplacementTitle')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('invoices.replacementNote')}
            </p>
            <button
              onClick={() => {
                if (window.confirm(t('invoices.replacementConfirm'))) {
                  // Use current invoice items as basis for replacement
                  const replacementItems = invoice.invoiceItems.map(item => ({
                    serviceId: item.serviceId,
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unitPriceSnapshot),
                  }));
                  replacementMutation.mutate({
                    items: replacementItems,
                    additionalCharges: invoice.additionalCharges?.map(charge => ({
                      chargeType: charge.chargeType,
                      chargeValue: parseFloat(charge.chargeValue),
                      description: charge.description || undefined,
                    })) || []
                  });
                }
              }}
              disabled={replacementMutation.isPending}
              className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50"
            >
              {replacementMutation.isPending ? t('invoices.creating') : t('invoices.createReplacementBtn')}
            </button>
            <button
              onClick={() => setShowReplacementForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-2"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {/* Record Payment */}
        {canRecordPayment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-[#111844] mb-4">{t('payments.recordPayment')}</h2>
            <form onSubmit={handleRecordPayment} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm text-gray-600 mb-1">{t('payments.amount')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(normalizeDigits(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] text-left"
                  placeholder="0.000"
                  required
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm text-gray-600 mb-1">{t('payments.method')}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm text-gray-600 mb-1">{t('payments.notesOptional')}</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                />
              </div>
              <button
                type="submit"
                disabled={paymentMutation.isPending}
                className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50"
              >
                {paymentMutation.isPending ? t('payments.recording') : t('payments.recordPaymentBtn')}
              </button>
            </form>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-[#111844]">{t('payments.history')}</h2>
          </div>
          {paymentsLoading ? (
            <div className="p-6 text-gray-500">{t('common.loading')}</div>
          ) : !payments || payments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t('payments.noPayments')}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('payments.amount')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('payments.method')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('common.date')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('payments.recordedBy')}</th>
                  {isAdmin && <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-gray-900 font-medium">{parseFloat(payment.amount).toFixed(3)} {t('common.currency')}</td>
                    <td className="px-6 py-4 text-gray-700">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDateTime(payment.paymentDate, i18n.language)}</td>
                    <td className="px-6 py-4 text-gray-600">{payment.recordedBy?.name || '—'}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {paymentToReverse === payment.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder={t('payments.reversalReasonPlaceholder')}
                              value={reversalNotes}
                              onChange={(e) => setReversalNotes(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                            />
                            <button
                              onClick={() => {
                                reversePaymentMutation.mutate({
                                  paymentId: payment.id,
                                  reversalNotes: reversalNotes || undefined
                                });
                                setPaymentToReverse(null);
                                setReversalNotes('');
                              }}
                              className="text-[#C4362B] hover:text-[#a32b22] text-sm font-medium"
                            >
                              {t('payments.confirmReversal')}
                            </button>
                            <button
                              onClick={() => {
                                setPaymentToReverse(null);
                                setReversalNotes('');
                              }}
                              className="text-gray-600 hover:text-gray-900 text-sm"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPaymentToReverse(payment.id)}
                            className="text-[#C4362B] hover:text-[#a32b22] text-sm"
                          >
                            {t('payments.reversePayment')}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
