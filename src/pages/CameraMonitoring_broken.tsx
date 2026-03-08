import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  Activity, 
  Thermometer,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Heart,
  Baby,
  Syringe,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Detection {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: string;
}

interface HealthAlert {
  animal_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: string;
  description: string;
}

interface BehaviorAnalysis {
  behavior_type: string;
  confidence: number;
  duration: number;
  animal_count: number;
  health_indicators: Record<string, number>;
}

const API_BASE_URL = 'http://localhost:8001';

const CameraMonitoring: React.FC = () => async () => {
  {
}
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<BehaviorAnalysis | null>(null);
  const [overallHealthScore, setOverallHealthScore] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [recordingTime, setRecordingTime] = useState(0);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start live camera feed
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsLive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHealthAlerts(prev => [...prev, {
        animal_id: 'system',
        alert_type: 'camera_error',
        severity: 'high',
        confidence: 1.0,
        timestamp: new Date().toISOString(),
        description: 'Failed to access camera. Please check permissions.'
      }]);
    }
  }, []);

  // Stop camera feed
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  }, []);

  // Capture frame and analyze
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      setIsLoading(true);
      
      try {
        // Send to backend for analysis
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        
        // Detection endpoint
        const detectionResponse = await fetch(`${API_BASE_URL}/detect/cows`, {
          method: 'POST',
          body: formData
        });
        
        if (detectionResponse.ok) {
          const detectionData = await detectionResponse.json();
          setDetections(detectionData.detections || []);
          
          // Add new alerts
          if (detectionData.alerts) {
            setHealthAlerts(prev => [...prev, ...detectionData.alerts]);
          }
        }
        
        // Behavior analysis endpoint
        const behaviorResponse = await fetch(`${API_BASE_URL}/analyze/behavior`, {
          method: 'POST',
          body: formData
        });
        
        if (behaviorResponse.ok) {
          const behaviorData = await behaviorResponse.json();
          setBehaviorAnalysis(behaviorData.behaviors?.[0] || null);
          setOverallHealthScore(behaviorData.overall_health_score || 100);
        }
        
      } catch (error) {
        console.error('Analysis error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 'image/jpeg', 0.95);
  }, []);

  // Start/stop recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start continuous analysis
      const analysisInterval = setInterval(() => {
        if (isLive) {
          captureAndAnalyze();
        } else {
          clearInterval(analysisInterval);
        }
      }, 2000); // Analyze every 2 seconds
    }
  }, [isRecording, isLive, captureAndAnalyze]);

  // Handle file upload for before/after comparison
  const handleFileUpload = useCallback(async (type: 'before' | 'after', file: File) => {
    if (type === 'before') {
      setBeforeImage(file);
    } else {
      setAfterImage(file);
    }
    
    // If both images are uploaded, perform comparison
    if (beforeImage && afterImage && type === 'after') {
      await performComparison();
    }
  }, [beforeImage, afterImage]);

  // Handle video upload for lameness detection
  const handleVideoUpload = useCallback(async (file: File) => {
    setUploadedVideo(file);
    setIsProcessingVideo(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/detect/lameness`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const results = await response.json();
        setDetections(results.detections || []);
        setOverallHealthScore(results.health_score || 100);
        
        // Extract behavior analysis if available
        if (results.detections && results.detections.length > 0) {
          const detection = results.detections[0];
          setBehaviorAnalysis({
            behavior_type: detection.class_name,
            confidence: detection.confidence,
            duration: 0,
            animal_count: 1,
            health_indicators: { lameness_score: detection.confidence }
          });
        }
      }
    } catch (error) {
      console.error('Video analysis error:', error);
    } finally {
      setIsProcessingVideo(false);
    }
  }, []);

  // Perform before/after comparison
  const performComparison = useCallback(async () => {
    if (!beforeImage || !afterImage) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('before_file', beforeImage);
      formData.append('after_file', afterImage);
      
      const response = await fetch(`${API_BASE_URL}/compare/before-after`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const results = await response.json();
        setComparisonResults(results.comparison);
      }
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [beforeImage, afterImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [stopCamera]);

  // Auto-analyze when live
  useEffect(() => {
    if (isLive && !isRecording) {
      const interval = setInterval(captureAndAnalyze, 5000); // Analyze every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isLive, isRecording, captureAndAnalyze]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Camera Monitoring</h1>
        <div className="flex items-center gap-4">
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? "🔴 Live" : "⚫ Offline"}
          </Badge>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              ⏺ Recording {formatTime(recordingTime)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera {selectedCamera}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  >
                    {showBoundingBoxes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showBoundingBoxes ? "Hide" : "Show"} BBoxes
                  </Button>
                  <Button
                    variant={isLive ? "destructive" : "default"}
                    onClick={isLive ? stopCamera : startCamera}
                  >
                    {isLive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    {isLive ? "Stop" : "Start"} Camera
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto rounded-lg bg-black"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Detection overlays */}
                {showBoundingBoxes && detections.map((detection, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-green-500 bg-green-500/20 rounded"
                    style={{
                      left: `${(detection.bbox[0] / 1280) * 100}%`,
                      top: `${(detection.bbox[1] / 720) * 100}%`,
                      width: `${((detection.bbox[2] - detection.bbox[0]) / 1280) * 100}%`,
                      height: `${((detection.bbox[3] - detection.bbox[1]) / 720) * 100}%`,
                    }}
                  >
                    <div className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                      {detection.class_name} {(detection.confidence * 100).toFixed(1)}%
                    </div>
                  </motion.div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 animate-pulse" />
                      Analyzing...
                    </div>
                  </div>
                )}
              </div>
              
              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  onClick={toggleRecording}
                  disabled={!isLive}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRecording ? "Stop" : "Start"} Recording
                </Button>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Confidence:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>
              
        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Score</span>
                  <span className="text-2xl font-bold">{overallHealthScore.toFixed(1)}</span>
                </div>
                <Progress value={overallHealthScore} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {overallHealthScore > 80 ? "Excellent" : 
                   overallHealthScore > 60 ? "Good" : 
                   overallHealthScore > 40 ? "Fair" : "Poor"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Detection */}
          {behaviorAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Behavior Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Behavior:</span>
                    <span className="text-sm font-medium">{behaviorAnalysis.behavior_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confidence:</span>
                    <span className="text-sm font-medium">{(behaviorAnalysis.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Animals:</span>
                    <span className="text-sm font-medium">{behaviorAnalysis.animal_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Baby className="h-4 w-4 mr-2" />
                Piglet Birth Monitor
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Syringe className="h-4 w-4 mr-2" />
                Vaccination Check
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Before/After Compare
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Tabs for different features */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="piglet">Piglet Monitor</TabsTrigger>
          <TabsTrigger value="vaccination">Vaccination</TabsTrigger>
          <TabsTrigger value="comparison">Before/After</TabsTrigger>
          <TabsTrigger value="vision">Vision</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthAlerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  No active alerts
                </div>
              ) : (
                <div className="space-y-2">
                  {healthAlerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.alert_type}</div>
                          <div className="text-sm opacity-90">{alert.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                          <div className="text-xs">{(alert.confidence * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Piglet Monitor Tab */}
        <TabsContent value="piglet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Piglet Birth Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Baby className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                <p className="text-muted-foreground">Upload image for piglet birth analysis</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle piglet monitoring
                    }
                  }}
                  className="mt-4"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccination Tab */}
        <TabsContent value="vaccination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Vaccination Timing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-muted-foreground">Upload image for vaccination timing analysis</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle vaccination analysis
                    }
                  }}
                  className="mt-4"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Before/After Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Before/After Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Before Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('before', file);
                    }}
                    className="w-full"
                  />
                  {beforeImage && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ {beforeImage.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">After Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('after', file);
                    }}
                    className="w-full"
                  />
                  {afterImage && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ {afterImage.name}
                    </div>
                  )}
                </div>
              </div>
              
              {comparisonResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Comparison Results</h4>
                  <div className="text-sm">
                    <div>Improvement: {comparisonResults.improvement_percentage?.toFixed(1)}%</div>
                    <div>Status: {comparisonResults.after_treatment?.health_indicators}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vision Tab */}
        <TabsContent value="vision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Video for Lameness Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleVideoUpload(file);
                      }
                    }}
                    className="hidden"
                    id="vision-video-upload"
                  />
                  <label 
                    htmlFor="vision-video-upload" 
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload video or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      Supports MP4, WebM, MOV (Max 100MB)
                    </span>
                  </label>
                </div>
                
                {uploadedVideo && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Video Uploaded</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>File:</strong> {uploadedVideo.name}</p>
                      <p><strong>Size:</strong> {(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
                
                {isProcessingVideo && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="font-medium">Processing video for lameness detection...</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Analyzing frames for cow behavior patterns...
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CameraMonitoring;
