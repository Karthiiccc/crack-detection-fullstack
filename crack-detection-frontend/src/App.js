import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, AlertCircle, Loader2, X } from 'lucide-react';
import { FaCamera } from "react-icons/fa";
import { FaFileZipper } from "react-icons/fa6";
import { MdVideoCameraBack } from "react-icons/md";
import Header from './Header';
import Sidebar from './Sidebar';
import ReportGenerator from './ReportGenerator';
import './Header.css';
import './Sidebar.css';

const CrackDetectionApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [zipResults, setZipResults] = useState(null);
  const [videoResults, setVideoResults] = useState(null);
  const [uploadType, setUploadType] = useState('single');
  const [expandedRows, setExpandedRows] = useState({});
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalDetails, setModalDetails] = useState(null);
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      let isValidFile = false;
      
      // Check if file matches selected upload type
      if (uploadType === 'single' && file.type.startsWith('image/')) {
        isValidFile = true;
      } else if (uploadType === 'zip' && file.name.endsWith('.zip')) {
        isValidFile = true;
      } else if (uploadType === 'video' && (file.name.endsWith('.mp4') || file.name.endsWith('.avi') || file.name.endsWith('.mov'))) {
        isValidFile = true;
      }

      if (!isValidFile) {
        setError(`Please select a valid ${uploadType === 'single' ? 'image' : uploadType === 'zip' ? 'ZIP' : 'video'} file`);
        return;
      }

      setSelectedFile(file);
      
      // Only create preview for images
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      
      setResult(null);
      setZipResults(null);
      setVideoResults(null);
      setError(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      let isValidFile = false;
      
      // Check if file matches selected upload type
      if (uploadType === 'single' && file.type.startsWith('image/')) {
        isValidFile = true;
      } else if (uploadType === 'zip' && file.name.endsWith('.zip')) {
        isValidFile = true;
      } else if (uploadType === 'video' && (file.name.endsWith('.mp4') || file.name.endsWith('.avi') || file.name.endsWith('.mov'))) {
        isValidFile = true;
      }

      if (!isValidFile) {
        setError(`Please drop a valid ${uploadType === 'single' ? 'image' : uploadType === 'zip' ? 'ZIP' : 'video'} file`);
        return;
      }

      setSelectedFile(file);
      
      // Only create preview for images
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      
      setResult(null);
      setZipResults(null);
      setVideoResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); 
      setResult(data);
    } catch (err) {
      setError('Failed to analyze image. Please make sure the API server is running on http://localhost:8000');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ZIP upload handler
  const handleZipUpload = async () => {
    if (!selectedFile) {
      setError('Please select a ZIP file first');
      return;
    }

    if (!selectedFile.name.endsWith('.zip')) {
      setError('Please select a valid ZIP file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/zip_upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setZipResults(data);
      setResult(null);
    } catch (err) {
      setError('Failed to process ZIP file. Please make sure the API server is running.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Video upload handler
  const handleVideoUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    const validVideoTypes = ['.mp4', '.avi', '.mov'];
    const isValidVideo = validVideoTypes.some(type => 
      selectedFile.name.toLowerCase().endsWith(type)
    );

    if (!isValidVideo) {
      setError('Please select a valid video file (.mp4, .avi, .mov)');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVideoResults(data);
      setResult(null);
    } catch (err) {
      setError('Failed to process video file. Please make sure the API server is running.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle upload click based on file type
  const handleUploadClick = () => {
    switch(uploadType) {
      case 'zip':
        handleZipUpload();
        break;
      case 'video':
        handleVideoUpload();
        break;
      default:
        handleUpload();
    }
  };

  const resetApp = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setZipResults(null);
    setVideoResults(null);
    setError(null);
    setUploadType('single');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate batch report for ZIP results
  const generateBatchReport = async () => {
    if (!zipResults || zipResults.length === 0) {
      setError('No batch results available for report generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/generate-batch-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results: zipResults }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate batch report: ${response.statusText}`);
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `batch_report_${Date.now()}.pdf`;

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
      console.error('Error generating batch report:', error);
      setError(`Error generating batch report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate video report for video results
  const generateVideoReport = async () => {
    if (!videoResults || videoResults.length === 0) {
      setError('No video results available for report generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/generate-video-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results: videoResults }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate video report: ${response.statusText}`);
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `video_report_${Date.now()}.pdf`;

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
      console.error('Error generating video report:', error);
      setError(`Error generating video report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getOrientationColor = (orientation) => {
    switch (orientation) {
      case 'Horizontal Crack':
        return 'text-red-600 bg-red-50';
      case 'Vertical Crack':
        return 'text-blue-600 bg-blue-50';
      case 'Unprecidented Crack':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Function to toggle dropdown visibility
  const toggleDropdown = (type, index) => {
    const key = `${type}_${index}`;
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Function to open image modal with crack details
  const openImageModal = (imageSrc, crackDetails = null) => {
    console.log('Opening modal with:', { imageSrc: imageSrc ? 'image present' : 'no image', crackDetails });
    setModalImage(imageSrc);
    setModalDetails(crackDetails);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setModalImage(null);
    setModalDetails(null);
  };

  // Function to get crack details based on crack type
  const getCrackDetails = (crackType) => {
    const crackData = {
      'horizontal crack': {
        name: 'Horizontal Crack',
        severity: 'Critical',
        urgency: 'Immediate Attention Required',
        causes: [
          'Settlement of foundation due to poor soil conditions',
          'Thermal expansion and contraction cycles',
          'Inadequate reinforcement in structural elements',
          'Poor construction practices during foundation laying'
        ],
        solutions: [
          'Inject epoxy resin or polyurethane for crack sealing',
          'Install underpinning or micro-piles for foundation support',
          'Apply external strengthening using carbon fiber reinforced polymer (CFRP)',
          'Implement proper drainage systems to manage water infiltration'
        ],
        prevention: [
          'Conduct thorough soil investigation before construction',
          'Use appropriate foundation design based on soil conditions',
          'Install expansion joints at regular intervals',
          'Implement proper curing practices during construction'
        ]
      },
      'vertical crack': {
        name: 'Vertical Crack',
        severity: 'Medium to High',
        urgency: 'Moderate Action Required',
        causes: [
          'Thermal movement due to temperature variations',
          'Drying shrinkage of concrete during curing process',
          'Uneven loading or stress concentration',
          'Poor quality concrete mix or inadequate curing'
        ],
        solutions: [
          'Apply flexible sealants for minor crack repair',
          'Use crack injection methods with epoxy or acrylic materials',
          'Install movement joints to accommodate thermal expansion',
          'Apply protective coatings to prevent water ingress'
        ],
        prevention: [
          'Use proper concrete mix design with adequate water-cement ratio',
          'Implement controlled curing procedures',
          'Install expansion and contraction joints appropriately',
          'Apply protective surface treatments to reduce temperature effects'
        ]
      },
      'unprecidented crack': {
        name: 'Unprecedented Crack',
        severity: 'High',
        urgency: 'Prompt Investigation Required',
        causes: [
          'Unusual loading conditions or structural overload',
          'Environmental factors such as ground movement or seismic activity',
          'Material deterioration due to chemical attack or corrosion',
          'Design deficiencies or construction errors'
        ],
        solutions: [
          'Conduct detailed structural assessment by qualified engineer',
          'Implement temporary structural support if necessary',
          'Apply appropriate repair methods based on assessment findings',
          'Monitor crack progression with regular measurements'
        ],
        prevention: [
          'Regular structural inspections and maintenance',
          'Proper load management and usage control',
          'Environmental protection measures',
          'Quality control during construction and material selection'
        ]
      }
    };

    return crackData[crackType.toLowerCase()] || crackData['unprecidented crack'];
  };

  // Function to extract image src from HTML string
  const extractImageSrc = (htmlString) => {
    if (!htmlString) return null;
    const match = htmlString.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  };

  // Function to handle upload type change
  const handleUploadTypeChange = (newType) => {
    setUploadType(newType);
    // Clear current file if it doesn't match the new type
    if (selectedFile) {
      let isValidForNewType = false;
      if (newType === 'single' && selectedFile.type.startsWith('image/')) {
        isValidForNewType = true;
      } else if (newType === 'zip' && selectedFile.name.endsWith('.zip')) {
        isValidForNewType = true;
      } else if (newType === 'video' && (selectedFile.name.endsWith('.mp4') || selectedFile.name.endsWith('.avi') || selectedFile.name.endsWith('.mov'))) {
        isValidForNewType = true;
      }
      
      if (!isValidForNewType) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setZipResults(null);
        setVideoResults(null);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />
      
      {/* Sidebar */}
      <Sidebar 
        isExpanded={sidebarExpanded} 
        onToggle={toggleSidebar} 
        uploadType={uploadType}
        onUploadTypeChange={handleUploadTypeChange}
      />
      
      {/* Main Content */}
      <div 
        className={`transition-all duration-300 min-h-screen flex flex-col justify-center`}
        style={{ 
          marginLeft: sidebarExpanded ? '250px' : '60px',
          marginRight: sidebarExpanded ? '250px' : '60px', // Equal spacing on right
          paddingTop: '120px',
          paddingBottom: '60px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        <div className="w-full">
          {/* Upload Section - Full Width */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Upload Type Specific Instructions */}
            <div className="text-center mb-6">
              {uploadType === 'single' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm font-medium mb-2 flex items-center justify-center">
                    <FaCamera className="mr-2" size={16} /> Single Image Upload Instructions
                  </p>
                  <p className="text-blue-700 text-sm">
                    Upload a single image file (JPG, PNG, etc.) to detect and analyze structural cracks. 
                    The system will identify crack presence, orientation, and provide detailed crack views.
                  </p>
                </div>
              )}
              {uploadType === 'zip' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium mb-2 flex items-center justify-center">
                    <FaFileZipper className="mr-2" size={16} /> ZIP File Upload Instructions
                  </p>
                  <p className="text-green-700 text-sm">
                    Upload a ZIP archive containing multiple image files for batch processing. 
                    All images will be analyzed simultaneously for crack detection and classification.
                  </p>
                </div>
              )}
              {uploadType === 'video' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-purple-800 text-sm font-medium mb-2 flex items-center justify-center">
                    <MdVideoCameraBack className="mr-2" size={16} /> Video File Upload Instructions
                  </p>
                  <p className="text-purple-700 text-sm">
                    Upload a video file (MP4, AVI, MOV) to analyze frames for crack detection. 
                    The system will process individual frames and provide timestamped crack analysis.
                  </p>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Upload className="mr-2" size={24} />
              {uploadType === 'single' ? (
                <><FaCamera className="mr-2" size={20} /> Upload Single Image</>
              ) : uploadType === 'zip' ? (
                <><FaFileZipper className="mr-2" size={20} /> Upload ZIP File</>
              ) : uploadType === 'video' ? (
                <><MdVideoCameraBack className="mr-2" size={20} /> Upload Video File</>
              ) : 'Upload File'}
            </h2>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  uploadType === 'single' ? 'image/*' :
                  uploadType === 'zip' ? '.zip' :
                  uploadType === 'video' ? '.mp4,.avi,.mov' :
                  'image/*,.zip,.mp4,.avi,.mov'
                }
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full h-64 object-contain mx-auto rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetApp();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : selectedFile ? (
                <div className="relative">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-6xl text-gray-400">
                      {uploadType === 'zip' ? <FaFileZipper size={64} /> : 
                       uploadType === 'video' ? <MdVideoCameraBack size={64} /> : 
                       <FaCamera size={64} />}
                    </div>
                    <p className="text-gray-600 font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {uploadType === 'zip' ? 'ZIP Archive' : 
                       uploadType === 'video' ? 'Video File' : 'File'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetApp();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="mx-auto text-gray-400" size={48} />
                  <div>
                    <p className="text-gray-600 mb-2">
                      {uploadType === 'single' ? 'Drag and drop an image here, or click to select' :
                       uploadType === 'zip' ? 'Drag and drop a ZIP file here, or click to select' :
                       uploadType === 'video' ? 'Drag and drop a video file here, or click to select' :
                       'Drag and drop a file here, or click to select'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {uploadType === 'single' ? 'Supports JPG, PNG, and other image formats' :
                       uploadType === 'zip' ? 'Supports ZIP files containing images' :
                       uploadType === 'video' ? 'Supports MP4, AVI, MOV formats' :
                       'Select upload type above'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              disabled={!selectedFile || loading}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={20} />
                  {uploadType === 'zip' ? 'Process ZIP' : 
                   uploadType === 'video' ? 'Process Video' : 
                   'Analyze Image'}
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Single Image Processing Results */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                Single Image Processing Result
              </h3>
              
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">Summary</h4>
                  <div className="flex space-x-6 text-sm">
                    <span>Status: <strong>{result.cracked ? 'Crack Detected' : 'No Crack Detected'}</strong></span>
                    {result.cracked && result.orientation && (
                      <span>Orientation: <strong>{result.orientation}</strong></span>
                    )}
                    {result.cracked && result.individual_bboxes && (
                      <span>Individual Cracks: <strong>{result.individual_bboxes.length}</strong></span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Input Image</th>
                        <th className="border px-4 py-2 text-left">Crack Status</th>
                        <th className="border px-4 py-2 text-left">Orientation</th>
                        <th className="border px-4 py-2 text-left">Annotated Image</th>
                        <th className="border px-4 py-2 text-left">Focused Crack Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="border px-4 py-2 align-top">
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              alt="Input image"
                              className="w-32 h-auto object-contain rounded max-h-48"
                            />
                          ) : (
                            <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-500 text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="border px-4 py-2 align-top">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            result.cracked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {result.cracked ? 'Crack Detected' : 'No Crack'}
                          </span>
                        </td>
                        <td className="border px-4 py-2 align-top">
                          {result.cracked && result.orientation ? (
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getOrientationColor(result.orientation)}`}>
                              {result.orientation}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="border px-4 py-2 align-top">
                          {result.annotated_image ? (
                            <img 
                              src={result.annotated_image} 
                              alt="Annotated crack detection"
                              className="w-32 h-auto object-contain rounded cursor-pointer hover:opacity-90 transition-opacity max-h-48"
                              onClick={() => {
                                console.log('Batch result clicked:', result);
                                const crackType = result.orientation || result.classification || 'unprecidented crack';
                                console.log('Detected crack type:', crackType);
                                const details = getCrackDetails(crackType);
                                console.log('Generated crack details:', details);
                                openImageModal(result.annotated_image, details);
                              }}
                            />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="border px-4 py-2 align-top">
                          {result.cracked && result.individual_bboxes && Array.isArray(result.individual_bboxes) && result.individual_bboxes.length > 0 ? (
                            <div>
                              <button
                                onClick={() => toggleDropdown('single', 0)}
                                className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                              >
                                <span className="font-medium">🔍 View individual cracks ({result.individual_bboxes.length})</span>
                                <span className="text-sm">{expandedRows['single_0'] ? '▼' : '▶'}</span>
                              </button>
                              
                              {expandedRows['single_0'] && (
                                <div className="mt-2 space-y-2">
                                  {result.individual_bboxes.map((bbox, bboxIndex) => (
                                    <div key={bboxIndex} className="border rounded-lg overflow-hidden cursor-pointer" onClick={() => openImageModal(bbox)}>
                                      <img
                                        src={bbox}
                                        alt={`Crack ${bboxIndex + 1}`}
                                        className="w-full h-auto max-w-32 hover:opacity-90 transition-opacity"
                                      />
                                      <div className="p-1 bg-gray-50 text-xs text-gray-600 text-center">
                                        Crack {bboxIndex + 1} (click to enlarge)
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : result.cracked ? (
                            <span className="text-gray-500 text-sm">Crack detected but no individual crack views available</span>
                          ) : (
                            <span className="text-gray-500 text-sm">No cracks detected</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Report Generator - Only show for single image results */}
          {result && uploadType === 'single' && (
            <ReportGenerator 
              detectionResult={result}
              imageBase64={result.annotated_image}
            />
          )}

        {/* ZIP Results Display */}
        {zipResults && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Batch Processing Results</h3>
              <button 
                onClick={generateBatchReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Batch Report
                  </>
                )}
              </button>
            </div>
            
            {/* Summary Statistics */}
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Summary</h4>
              <div className="flex space-x-6 text-sm">
                <span>Total Images: <strong>{zipResults.length}</strong></span>
                <span>Cracks Detected: <strong>{zipResults.filter(r => r.cracked).length}</strong></span>
                <span>No Cracks: <strong>{zipResults.filter(r => !r.cracked).length}</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Input Image</th>
                    <th className="border px-4 py-2 text-left">Crack Status</th>
                    <th className="border px-4 py-2 text-left">Orientation</th>
                    <th className="border px-4 py-2 text-left">Annotated Image</th>
                    <th className="border px-4 py-2 text-left">Focused Crack Views</th>
                  </tr>
                </thead>
                <tbody>
                  {zipResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 align-top">
                        {result.input_image ? (
                          <img 
                            src={result.input_image} 
                            alt={`Input ${index + 1}`}
                            className="w-32 h-auto object-contain rounded max-h-48"
                          />
                        ) : (
                          <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="border px-4 py-2 align-top">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          result.cracked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result.cracked ? 'Crack Detected' : 'No Crack'}
                        </span>
                      </td>
                      <td className="border px-4 py-2 align-top">
                        {result.cracked && result.orientation ? (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getOrientationColor(result.orientation)}`}>
                            {result.orientation}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-2 align-top">
                        {result.annotated_image ? (
                          <img 
                            src={result.annotated_image} 
                            alt={`Annotated frame ${index + 1}`}
                            className="w-32 h-auto object-contain rounded cursor-pointer hover:opacity-90 transition-opacity max-h-48"
                            onClick={() => {
                              console.log('Video result clicked:', result);
                              const crackType = result.Classification || result['Crack Type'] || 'unprecidented crack';
                              console.log('Detected crack type:', crackType);
                              const details = getCrackDetails(crackType);
                              console.log('Generated crack details:', details);
                              openImageModal(result.annotated_image, details);
                            }}
                          />
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {result.cracked && result.separate_bounding_box_images && result.separate_bounding_box_images.length > 0 ? (
                          <div>
                            <button
                              onClick={() => toggleDropdown('zip', index)}
                              className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              <span className="font-medium">🔍 View individual cracks ({result.separate_bounding_box_images.length})</span>
                              <span className="text-sm">{expandedRows[`zip_${index}`] ? '▼' : '▶'}</span>
                            </button>
                            
                            {expandedRows[`zip_${index}`] && (
                              <div className="mt-2 space-y-2">
                                {result.separate_bounding_box_images.map((bbox, bboxIndex) => (
                                  <div key={bboxIndex} className="border rounded-lg overflow-hidden cursor-pointer" onClick={() => openImageModal(bbox)}>
                                    <img
                                      src={bbox}
                                      alt={`Crack ${bboxIndex + 1} from ${result.filename || `Image ${index + 1}`}`}
                                      className="w-full h-auto max-w-32 hover:opacity-90 transition-opacity"
                                    />
                                    <div className="p-1 bg-gray-50 text-xs text-gray-600 text-center">
                                      Crack {bboxIndex + 1} (click to enlarge)
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No cracks detected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Video Results Display */}
        {videoResults && videoResults.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Video Processing Results</h3>
              <button 
                onClick={generateVideoReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Video Report
                  </>
                )}
              </button>
            </div>
            
            {/* Summary Statistics */}
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Summary</h4>
              <div className="flex space-x-6 text-sm">
                <span>Total Frames Analyzed: <strong>{videoResults.length}</strong></span>
                <span>Frames with Cracks: <strong>{videoResults.filter(r => r['Crack Status'] === 'Cracked').length}</strong></span>
                <span>Detection Rate: <strong>{videoResults.length > 0 ? ((videoResults.filter(r => r['Crack Status'] === 'Cracked').length / videoResults.length) * 100).toFixed(1) : 0}%</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Frame No</th>
                    <th className="border px-4 py-2 text-left">Timestamp</th>
                    <th className="border px-4 py-2 text-left">Crack Status</th>
                    <th className="border px-4 py-2 text-left">Classification</th>
                    <th className="border px-4 py-2 text-left">Annotated Frame</th>
                    <th className="border px-4 py-2 text-left">Focused Crack Views</th>
                  </tr>
                </thead>
                <tbody>
                  {videoResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 font-mono align-top">{result['Frame #']}</td>
                      <td className="border px-4 py-2 font-mono align-top">{result['Timestamp (s)']}s</td>
                      <td className="border px-4 py-2 align-top">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          result['Crack Status'] === 'Cracked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result['Crack Status']}
                        </span>
                      </td>
                      <td className="border px-4 py-2 align-top">
                        {result['Classification'] && result['Classification'] !== 'N/A' ? (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getOrientationColor(result['Classification'])}`}>
                            {result['Classification']}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-2 align-top">
                        {result['Full Annotated Image'] ? (
                          <div 
                            className="w-32 h-auto cursor-pointer hover:opacity-90 transition-opacity max-h-48" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Video result (Full Annotated Image) clicked:', result);
                              const imgSrc = extractImageSrc(result['Full Annotated Image']);
                              const crackType = result.Classification || result['Crack Type'] || 'unprecidented crack';
                              console.log('Detected crack type:', crackType);
                              const details = getCrackDetails(crackType);
                              console.log('Generated crack details:', details);
                              if (imgSrc) openImageModal(imgSrc, details);
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div 
                              dangerouslySetInnerHTML={{ __html: result['Full Annotated Image'] }} 
                              style={{ pointerEvents: 'none' }}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {result['Crack Status'] === 'Cracked' && 
                         result['Separate Bounding Boxes'] && 
                         result['Separate Bounding Boxes'].length > 0 ? (
                          <div>
                            <button
                              onClick={() => toggleDropdown('video', index)}
                              className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              <span className="font-medium">🔍 View individual cracks ({result['Separate Bounding Boxes'].length})</span>
                              <span className="text-sm">{expandedRows[`video_${index}`] ? '▼' : '▶'}</span>
                            </button>
                            
                            {expandedRows[`video_${index}`] && (
                              <div className="mt-2 space-y-2">
                                {result['Separate Bounding Boxes'].map((bbox, bboxIndex) => (
                                  <div 
                                    key={bboxIndex} 
                                    className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const imgSrc = extractImageSrc(bbox);
                                      if (imgSrc) openImageModal(imgSrc);
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <div 
                                      dangerouslySetInnerHTML={{ __html: bbox }} 
                                      style={{ pointerEvents: 'none' }}
                                    />
                                    <div className="p-1 bg-gray-50 text-xs text-gray-600 text-center">
                                      Crack {bboxIndex + 1} (click to enlarge)
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No cracks detected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Show message when no cracks detected in video */}
        {videoResults && videoResults.length === 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Video Processing Results</h3>
            <div className="text-center py-8 text-gray-500">
              <p>No cracks detected in any frames of the video</p>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {(result || zipResults || videoResults || selectedFile) && (
          <div className="text-center mt-8">
            <button
              onClick={resetApp}
              className="bg-gray-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Crack Detection System</p>
        </div>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed bg-black bg-opacity-75 flex items-center justify-center z-50"
          style={{ 
            top: '80px',
            left: '0',
            right: '0',
            bottom: '0'
          }}
          onClick={closeImageModal}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              <X size={24} />
            </button>
            
            {modalDetails ? (
              // Layout with image on left and details on right
              <div 
                className="bg-white rounded-lg w-full h-full max-w-6xl max-h-full flex overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ minHeight: '600px' }}
              >
                {/* Left side - Image */}
                <div className="w-1/2 flex items-center justify-center p-4 bg-gray-50">
                  <img
                    src={modalImage}
                    alt="Annotated crack image"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
                
                {/* Right side - Crack Details */}
                <div className="w-1/2 p-6 overflow-y-auto bg-white">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b border-gray-200 pb-4">
                      <h2 className="text-xl font-bold text-gray-800 mb-2">{modalDetails.name}</h2>
                      <div className="flex gap-2 flex-wrap">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          modalDetails.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          modalDetails.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          modalDetails.severity === 'Medium to High' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Severity: {modalDetails.severity}
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {modalDetails.urgency}
                        </div>
                      </div>
                    </div>
                    
                    {/* Possible Causes */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Possible Causes
                      </h3>
                      <ul className="space-y-1 ml-4">
                        {modalDetails.causes && modalDetails.causes.map((cause, index) => (
                          <li key={index} className="text-gray-700 text-sm">
                            <span className="text-yellow-500 font-bold">• </span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Recommended Solutions */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recommended Solutions
                      </h3>
                      <ul className="space-y-1 ml-4">
                        {modalDetails.solutions && modalDetails.solutions.map((solution, index) => (
                          <li key={index} className="text-gray-700 text-sm">
                            <span className="text-green-500 font-bold">• </span>
                            {solution}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Prevention Measures */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Prevention Measures
                      </h3>
                      <ul className="space-y-1 ml-4">
                        {modalDetails.prevention && modalDetails.prevention.map((measure, index) => (
                          <li key={index} className="text-gray-700 text-sm">
                            <span className="text-blue-500 font-bold">• </span>
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Simple image modal (for non-crack images)
              <img
                src={modalImage}
                alt="Enlarged view"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return <CrackDetectionApp />;
}

export default App;