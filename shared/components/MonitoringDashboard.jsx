import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, Users, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Monitoring Dashboard Component
 * Displays real-time application monitoring data
 */
const MonitoringDashboard = ({
    className = '',
    refreshInterval = 30000, // 30 seconds
    showExportButton = true
}) => {
    const [monitoringData, setMonitoringData] = useState({
        errors: { stats: {}, recent: [] },
        performance: { stats: {}, recent: [] },
        interactions: { stats: {}, recent: [] },
        lastUpdated: null
    });

    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch monitoring data
    const fetchMonitoringData = async () => {
        try {
            setIsLoading(true);

            // In a real implementation, this would fetch from your monitoring API
            // For now, we'll simulate the data structure
            const mockData = {
                errors: {
                    stats: {
                        total: 15,
                        last24Hours: 8,
                        bySeverity: { high: 2, medium: 5, low: 8 },
                        byType: { api: 6, network: 4, client: 5 }
                    },
                    recent: [
                        { id: 'err_1', message: 'API timeout', severity: 'high', timestamp: new Date() },
                        { id: 'err_2', message: 'Network error', severity: 'medium', timestamp: new Date() }
                    ]
                },
                performance: {
                    stats: {
                        averagePageLoad: 1200,
                        averageRouteChange: 150,
                        slowOperations: 3,
                        webVitals: { lcp: 2.1, fid: 85, cls: 0.05 }
                    },
                    recent: [
                        { type: 'page_load', duration: 1100, status: 'good' },
                        { type: 'route_change', duration: 200, status: 'fast' }
                    ]
                },
                interactions: {
                    stats: {
                        totalInteractions: 245,
                        featuresUsed: ['chat', 'profile', 'calendar'],
                        averageTimeOnPage: 180,
                        byType: { button_click: 120, form_submit: 15, navigation: 45 }
                    },
                    recent: [
                        { type: 'button_click', feature: 'send_message', timestamp: new Date() },
                        { type: 'form_submit', feature: 'profile_update', timestamp: new Date() }
                    ]
                },
                lastUpdated: new Date()
            };

            setMonitoringData(mockData);
        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-refresh data
    useEffect(() => {
        fetchMonitoringData();

        const interval = setInterval(fetchMonitoringData, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    const exportData = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            ...monitoringData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Loading monitoring data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow ${className}`}>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Activity className="h-6 w-6 text-blue-600 mr-3" />
                        <h2 className="text-lg font-semibold text-gray-900">Application Monitoring</h2>
                    </div>

                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                            Last updated: {monitoringData.lastUpdated?.toLocaleTimeString()}
                        </span>

                        <Button onClick={fetchMonitoringData} size="sm" variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>

                        {showExportButton && (
                            <Button onClick={exportData} size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 mt-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'errors', label: 'Errors', icon: AlertTriangle },
                        { id: 'performance', label: 'Performance', icon: Clock },
                        { id: 'interactions', label: 'Interactions', icon: Users }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'overview' && <OverviewTab data={monitoringData} />}
                {activeTab === 'errors' && <ErrorsTab data={monitoringData.errors} />}
                {activeTab === 'performance' && <PerformanceTab data={monitoringData.performance} />}
                {activeTab === 'interactions' && <InteractionsTab data={monitoringData.interactions} />}
            </div>
        </div>
    );
};

/**
 * Overview Tab Component
 */
const OverviewTab = ({ data }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Error Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Errors (24h)</p>
                    <p className="text-2xl font-bold text-red-900">{data.errors.last24Hours}</p>
                </div>
            </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Avg Page Load</p>
                    <p className="text-2xl font-bold text-blue-900">{data.performance.stats.averagePageLoad}ms</p>
                </div>
            </div>
        </div>

        {/* Interactions Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Total Interactions</p>
                    <p className="text-2xl font-bold text-green-900">{data.interactions.stats.totalInteractions}</p>
                </div>
            </div>
        </div>

        {/* Features Summary */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-purple-800">Features Used</p>
                    <p className="text-2xl font-bold text-purple-900">{data.interactions.stats.featuresUsed.length}</p>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Errors Tab Component
 */
const ErrorsTab = ({ data }) => (
    <div className="space-y-6">
        {/* Error Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Total Errors</h3>
                <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-700 mb-2">High Severity</h3>
                <p className="text-2xl font-bold text-red-900">{data.stats.bySeverity.high || 0}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-700 mb-2">Medium Severity</h3>
                <p className="text-2xl font-bold text-yellow-900">{data.stats.bySeverity.medium || 0}</p>
            </div>
        </div>

        {/* Recent Errors */}
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Errors</h3>
            <div className="space-y-2">
                {data.recent.map(error => (
                    <div key={error.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                            <AlertTriangle className={`h-4 w-4 mr-3 ${error.severity === 'high' ? 'text-red-500' :
                                error.severity === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                                }`} />
                            <span className="text-sm text-gray-900">{error.message}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {error.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/**
 * Performance Tab Component
 */
const PerformanceTab = ({ data }) => (
    <div className="space-y-6">
        {/* Web Vitals */}
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800">LCP (Largest Contentful Paint)</p>
                    <p className="text-2xl font-bold text-blue-900">{data.stats.webVitals.lcp}s</p>
                    <p className="text-xs text-blue-700">Target: < 2.5s</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800">FID (First Input Delay)</p>
                    <p className="text-2xl font-bold text-green-900">{data.stats.webVitals.fid}ms</p>
                    <p className="text-xs text-green-700">Target: < 100ms</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-800">CLS (Cumulative Layout Shift)</p>
                    <p className="text-2xl font-bold text-purple-900">{data.stats.webVitals.cls}</p>
                    <p className="text-xs text-purple-700">Target: < 0.1</p>
                </div>
            </div>
        </div>

        {/* Performance Metrics */}
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Average Page Load Time</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.averagePageLoad}ms</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Average Route Change</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.averageRouteChange}ms</p>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactions Tab Component
 */
const InteractionsTab = ({ data }) => (
    <div className="space-y-6">
        {/* Interaction Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 mb-2">Total Interactions</p>
                <p className="text-2xl font-bold text-green-900">{data.stats.totalInteractions}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 mb-2">Avg Time on Page</p>
                <p className="text-2xl font-bold text-blue-900">{data.stats.averageTimeOnPage}s</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-700 mb-2">Features Used</p>
                <p className="text-2xl font-bold text-purple-900">{data.stats.featuresUsed.length}</p>
            </div>
        </div>

        {/* Feature Usage */}
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Usage</h3>
            <div className="flex flex-wrap gap-2">
                {data.stats.featuresUsed.map(feature => (
                    <span key={feature} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {feature}
                    </span>
                ))}
            </div>
        </div>

        {/* Recent Interactions */}
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Interactions</h3>
            <div className="space-y-2">
                {data.recent.map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                            <Users className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="text-sm text-gray-900">{interaction.type}</span>
                            {interaction.feature && (
                                <span className="ml-2 text-xs text-blue-600">({interaction.feature})</span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500">
                            {interaction.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default MonitoringDashboard;