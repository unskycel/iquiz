import React from 'react';

interface ErrorRetryProps {
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorRetry({ message = '加载失败', onRetry, fullPage = false }: ErrorRetryProps) {
  const containerClass = fullPage
    ? 'min-h-[60vh] flex items-center justify-center'
    : '';

  return (
    <div className={containerClass}>
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
