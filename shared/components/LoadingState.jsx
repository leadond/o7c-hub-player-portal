import React from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

/**
 * Enhanced loading state component with offline awareness
 * Shows different states based on connectivity and operation type
 */
const LoadingState = ({
  message = "Loading...",
  showProgress = false,
  progress = 0,
  isRetrying = false,
  retryCount = 0,
  isOnline = navigator.onLine,
  className = ''
}) => {
  const getLoadingMessage = () => {
    if (!isOnline) {
      return "Waiting for connection...";
    }

    if (isRetrying) {
      return `Retrying... (Attempt ${retryCount})`;
    }

    return message;
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative">
        {/* Main loading spinner */}
        <Loader2 className={`h-8 w-8 animate-spin ${!isOnline ? 'text-gray-400' : 'text-blue-600'}`} />

        {/* Connection status indicator */}
        {!isOnline && (
          <div className="absolute -top-1 -right-1">
            <WifiOff className="h-4 w-4 text-orange-500" />
          </div>
        )}

        {isOnline && (
          <div className="absolute -top-1 -right-1">
            <Wifi className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      <p className={`mt-4 text-sm text-center ${!isOnline ? 'text-gray-500' : 'text-gray-700'}`}>
        {getLoadingMessage()}
      </p>

      {/* Progress bar for long operations */}
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                !isOnline ? 'bg-gray-400' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {progress > 0 && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {Math.round(progress)}% complete
            </p>
          )}
        </div>
      )}

      {/* Retry information */}
      {isRetrying && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md max-w-sm">
          <p className="text-sm text-blue-800 text-center">
            Automatic retry in progress. This helps handle temporary network issues.
          </p>
        </div>
      )}

      {/* Offline message */}
      {!isOnline && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md max-w-sm">
          <p className="text-sm text-orange-800 text-center">
            You're currently offline. Some features may be limited until connection is restored.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton loading component for content placeholders
 */
export const SkeletonLoader = ({
  lines = 3,
  height = 'h-4',
  className = ''
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing loading states with automatic retry logic
 */
export const useLoadingState = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [state, setState] = React.useState({
    loading: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  });

  const startLoading = React.useCallback(() => {
    setState({
      loading: true,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  const stopLoading = React.useCallback((error = null) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
      isRetrying: false
    }));
  }, []);

  const retry = React.useCallback(async (operation) => {
    if (state.retryCount >= maxRetries) {
      if (onMaxRetriesReached) {
        onMaxRetriesReached(state.retryCount);
      }
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    if (onRetry) {
      await onRetry(state.retryCount + 1);
    } else {
      // Default retry logic with exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, retryDelay * Math.pow(2, state.retryCount))
      );
      await operation();
    }
  }, [state.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

  return {
    ...state,
    startLoading,
    stopLoading,
    retry,
    canRetry: state.retryCount < maxRetries
  };
};

export default LoadingState;