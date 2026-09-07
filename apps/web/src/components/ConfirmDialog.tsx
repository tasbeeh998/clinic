import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-[#111844] mb-2">
          {title}
        </h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-[#C4362B] text-white hover:bg-[#a32b22]'
                : 'bg-[#111844] text-white hover:bg-[#1a237e]'
            }`}
          >
            {isLoading ? t('common.processing') : confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
