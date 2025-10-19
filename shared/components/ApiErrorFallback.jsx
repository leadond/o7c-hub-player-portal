import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Home, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Enhanced error fallback component for API failures and network issues
 * Provides user-friendly error messages and actionable recovery options
 */
const ApiErrorFallback = ({
  error,
  onRetry,
  onGoHome,
  onGoBack,
  className = ''
}) => {
  if (!error) return null;

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'NETWORK':
        return <WifiOff className="h-8 w-8 text-orange-500" />;
      case 'AUTHENTICATION':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'AUTHORIZATION':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'SERVER':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <WifiOff className="h-8 w-8 text-gray-500" />;
    }
  };

  const getErrorStyles = (errorType) => {
    switch (errorType) {
      case 'NETWORK':
        return 'bg-orange-50 border-orange-200';
      case 'AUTHENTICATION':
        return 'bg-yellow-50 border-yellow-200';
      case 'AUTHORIZATION':
        return 'bg-red-50 border-red-200';
      case 'SERVER':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const renderActionButtons = () => {
    const buttons = [];

    // Primary action button
    if (error.canRetry && onRetry) {
      buttons.push(
        <Button key="retry" onClick={onRetry} className="mr-3">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      );
    }

    // Secondary action buttons based on error type
    if (error.shouldLogout) {
      buttons.push(
        <Button key="home" variant="outline" onClick={onGoHome}>
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      );
    } else if (error.type === 'AUTHORIZATION' && onGoBack) {
      buttons.push(
        <Button key="back" variant="outline" onClick={onGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      );
    } else if (!error.canRetry) {
      buttons.push(
        <Button key="home" variant="outline" onClick={onGoHome}>
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className={`min-h-[300px] flex items-center justify-center p-4 ${className}`}>
      <div className={`max-w-lg w-full rounded-lg border p-6 ${getErrorStyles(error.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getErrorIcon(error.type)}
          </div>

          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getErrorTitle(error.type)}
            </h3>

            <p className="text-gray-700 mb-4">
              {error.message}
            </p>

            {error.errorId && (
              <p className="text-xs text-gray-500 mb-4">
                Error ID: {error.errorId}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {renderActionButtons()}
            </div>

            {/* Additional help text for specific error types */}
            {error.type === 'NETWORK' && (
              <div className="mt-4 p-3 bg-orange-100 rounded-md">
                <p className="text-sm text-orange-800">
                  <strong>Troubleshooting tips:</strong>
                </p>
                <ul className="text-sm text-orange-700 mt-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            )}

            {error.type === 'AUTHENTICATION' && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                <p className="text-sm text-yellow-800">
                  Your session has expired. Please sign in again to continue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Gets appropriate error title based on error type
 */
function getErrorTitle(errorType) {
  switch (errorType) {
    case 'NETWORK':
      return 'Connection Problem';
    case 'API':
      return 'Service Unavailable';
    case 'AUTHENTICATION':
      return 'Session Expired';
    case 'AUTHORIZATION':
      return 'Access Denied';
    case 'VALIDATION':
      return 'Invalid Input';
    case 'SERVER':
      return 'Server Error';
    case 'CLIENT':
      return 'Application Error';
    default:
      return 'Something Went Wrong';
  }
}

export default ApiErrorFallback;