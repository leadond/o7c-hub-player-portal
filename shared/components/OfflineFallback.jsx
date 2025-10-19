import React from 'react';
import { WifiOff, Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Fallback UI component for when APIs are unavailable
 * Shows cached content, offline indicators, and retry options
 */
const OfflineFallback = ({
  title = "You're Offline",
  message = "Some features are unavailable while offline. Please check your connection and try again.",
  showCachedContent = false,
  cachedData = null,
  onRetry,
  onRefresh,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <WifiOff className="h-8 w-8 text-gray-400" />
        </div>

        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>

          <p className="text-gray-600 mb-4">
            {message}
          </p>

          {/* Show cached content if available */}
          {showCachedContent && cachedData && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center mb-2">
                <Cloud className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Showing Cached Content
                </span>
              </div>
              <p className="text-sm text-blue-700">
                This data may not be up to date. Updates will sync when connection is restored.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </div>

          {/* Connection tips */}
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-800">
                Connection Tips
              </span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try switching between WiFi and mobile data</li>
              <li>• Move closer to your WiFi router</li>
              <li>• Restart your router if possible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing offline state and cached data
 */
export const useOfflineState = (initialData = null) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [cachedData, setCachedData] = React.useState(initialData);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateCache = React.useCallback((data) => {
    setCachedData(data);
    setLastUpdated(new Date());
  }, []);

  const clearCache = React.useCallback(() => {
    setCachedData(null);
    setLastUpdated(null);
  }, []);

  return {
    isOnline,
    cachedData,
    lastUpdated,
    updateCache,
    clearCache,
    hasCache: cachedData !== null
  };
};

/**
 * Higher-order component that provides offline fallbacks
 */
export const withOfflineFallback = (WrappedComponent, fallbackOptions = {}) => {
  return function OfflineAwareComponent(props) {
    const { isOnline, cachedData, hasCache } = useOfflineState();

    if (!isOnline && !hasCache) {
      return (
        <OfflineFallback
          {...fallbackOptions}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <div>
        {!isOnline && hasCache && (
          <div className="mb-4 p-2 bg-orange-100 border border-orange-300 rounded">
            <p className="text-sm text-orange-800 flex items-center">
              <WifiOff className="h-4 w-4 mr-2" />
              You're offline - showing cached content
            </p>
          </div>
        )}
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default OfflineFallback;