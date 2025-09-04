import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertTriangle, Clock, Shield } from 'lucide-react';

const ReportGenerator = ({ detectionResult, imageBase64 }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const generateReport = async () => {
        if (!detectionResult || !detectionResult.orientation) {
            setError('No detection result available for report generation');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const requestBody = {
                crack_type: detectionResult.orientation,
                confidence: detectionResult.confidence || 0.85, // Default confidence if not provided
                image_base64: imageBase64
            };

            const response = await fetch('http://localhost:8000/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Failed to generate report: ${response.statusText}`);
            }

            // Get the filename from response headers
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition 
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
                : `crack_report_${Date.now()}.pdf`;

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating report:', error);
            setError(`Error generating report: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const loadReportPreview = async () => {
        if (!detectionResult || !detectionResult.orientation) return;

        try {
            const response = await fetch(`http://localhost:8000/report-preview?crack_type=${encodeURIComponent(detectionResult.orientation)}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to load preview');
            }

            const previewData = await response.json();
            setReportPreview(previewData);
        } catch (error) {
            console.error('Error loading preview:', error);
            setError(`Error loading preview: ${error.message}`);
        }
    };

    useEffect(() => {
        if (detectionResult && detectionResult.orientation) {
            loadReportPreview();
        }
    }, [detectionResult]);

    if (!detectionResult || !detectionResult.cracked) {
        return null;
    }

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium to high': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="report-generator bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800">Analysis Report</h3>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                    <button 
                        onClick={generateReport} 
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PDF Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* Detection Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-3">Detection Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-blue-600 font-medium">Crack Type:</span>
                        <p className="text-blue-800 font-semibold">{detectionResult.orientation}</p>
                    </div>
                    <div>
                        <span className="text-sm text-blue-600 font-medium">Confidence:</span>
                        <p className="text-blue-800 font-semibold">
                            {((detectionResult.confidence || 0.85) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Risk Assessment - Always visible */}
            {reportPreview && (
                <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Risk Assessment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border ${getSeverityColor(reportPreview.severity)}`}>
                            <span className="text-sm font-medium">Severity Level:</span>
                            <p className="font-semibold">{reportPreview.severity}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                            <span className="text-sm font-medium text-orange-600">Action Timeline:</span>
                            <p className="font-semibold text-orange-800 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {reportPreview.urgency}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Preview - Only visible when showPreview is true */}
            {showPreview && reportPreview && (
                <div className="mt-4 space-y-4">
                    {/* Possible Causes */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            Possible Causes
                        </h4>
                        <ul className="space-y-2">
                            {reportPreview.causes && reportPreview.causes.map((cause, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-gray-700">{cause}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommended Solutions */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            Recommended Solutions
                        </h4>
                        <ul className="space-y-2">
                            {reportPreview.solutions && reportPreview.solutions.map((solution, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-gray-700">{solution}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Prevention Measures */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            Prevention Measures
                        </h4>
                        <ul className="space-y-2">
                            {reportPreview.prevention && reportPreview.prevention.map((measure, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-gray-700">{measure}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;
