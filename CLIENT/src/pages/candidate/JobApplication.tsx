import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Upload,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const VideoPreview = styled('video')({
  width: '100%',
  height: '480px',
  borderRadius: '8px',
  backgroundColor: '#000',
  objectFit: 'contain'
});

const JobApplication: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [videos, setVideos] = useState<(File | null)[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const mediaRecorderRefs = useRef<MediaRecorder[]>([]);
  const chunksRefs = useRef<Blob[][]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState<number | null>(null);
  const [streams, setStreams] = useState<MediaStream[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('You must be logged in to submit an application');
      navigate('/login', { state: { from: `/candidate/jobs/${jobId}/apply` } });
    }
  }, [token, navigate, jobId]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobAPI.getJobs();
        const jobData = response.jobs.find((j: any) => j._id === jobId);
        if (jobData) {
          setJob(jobData);
          setVideos(new Array(jobData.questions.length).fill(null));
          setRecordedVideos(new Array(jobData.questions.length).fill(''));
          setUploadedVideos(new Array(jobData.questions.length).fill(''));
          chunksRefs.current = new Array(jobData.questions.length).fill([]);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        setError('Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const startRecording = (index: number) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Set fixed dimensions for consistency
        const constraints = {
          video: {
            width: { exact: 640 },  // Force exact width
            height: { exact: 480 }, // Force exact height
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        };

        navigator.mediaDevices.getUserMedia(constraints)
          .then(stream => {
            const video = videoRefs.current[index];
            if (video) {
              video.srcObject = stream;
              video.play();
            }

            setStreams(prev => {
              const newStreams = [...prev];
              newStreams[index] = stream;
              return newStreams;
            });

            // Use fixed settings for MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp8', // Specify codec
              videoBitsPerSecond: 1000000 // 1 Mbps
            });

            mediaRecorderRefs.current[index] = mediaRecorder;
            chunksRefs.current[index] = [];

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunksRefs.current[index].push(e.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunksRefs.current[index], { 
                type: 'video/webm;codecs=vp8' 
              });
              
              // Verify video dimensions before saving
              const tempVideo = document.createElement('video');
              tempVideo.src = URL.createObjectURL(blob);
              
              tempVideo.onloadedmetadata = () => {
                console.log(`Video dimensions: ${tempVideo.videoWidth}x${tempVideo.videoHeight}`);
                
                if (tempVideo.videoWidth > 0 && tempVideo.videoHeight > 0) {
                  const videoUrl = URL.createObjectURL(blob);
                  setRecordedVideos(prev => {
                    const newVideos = [...prev];
                    newVideos[index] = videoUrl;
                    return newVideos;
                  });

                  const videoFile = new File([blob], `answer_${index}.webm`, {
                    type: 'video/webm;codecs=vp8'
                  });
                  
                  setVideos(prev => {
                    const newVideos = [...prev];
                    newVideos[index] = videoFile;
                    return newVideos;
                  });
                } else {
                  setError('Invalid video dimensions. Please try recording again.');
                }
              };
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setCurrentRecordingIndex(index);
          })
          .catch(err => {
            console.error('Error accessing media devices:', err);
            setError(`Failed to access camera and microphone: ${err.message}`);
          });
      }
    } catch (err) {
      console.error('Recording error:', err);
      setError(`Failed to start recording: ${err}`);
    }
  };

  const stopRecording = (index: number) => {
    const mediaRecorder = mediaRecorderRefs.current[index];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        // Convert uploaded video to WebM format
        const reader = new FileReader();
        reader.onload = (e) => {
          const tempVideo = document.createElement('video');
          tempVideo.src = e.target?.result as string;
          
          tempVideo.onloadedmetadata = () => {
            if (tempVideo.videoWidth > 0 && tempVideo.videoHeight > 0) {
              setVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = file;
                return newVideos;
              });
              const videoUrl = URL.createObjectURL(file);
              setUploadedVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = videoUrl;
                return newVideos;
              });
            } else {
              setError('Invalid video dimensions. Please upload a different video.');
            }
          };

          tempVideo.onerror = () => {
            setError('Error loading video. Please try a different file.');
          };
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload a video file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('You must be logged in to submit an application');
      return;
    }

    if (videos.some(video => !video)) {
      setError('Please record or upload all video responses');
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData and validate videos before submission
      const formData = new FormData();
      const validVideos = videos.filter((video): video is File => {
        if (!video) return false;
        return true;
      });

      // Simply append each video with its original name
      validVideos.forEach((video) => {
        formData.append('videos', video); // This will preserve the original filename
      });

      const response = await jobAPI.applyForJob(jobId!, validVideos, token);
      
      if (response.success) {
        setSuccess('Application submitted successfully!');
        setTimeout(() => navigate('/candidate/dashboard'), 2000);
      } else {
        setError(response.message || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Application submission error:', err);
      setError(err.message || 'An error occurred while submitting the application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      streams.forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return <Typography color="error">Job not found</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Apply for {job.title}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {job.questions.map((question: any, index: number) => (
          <StyledPaper key={index} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Question {index + 1}
            </Typography>
            <Typography variant="body1" paragraph>
              {question.question_text}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Time limit: {question.time_limit} seconds
            </Typography>

            <Box sx={{ mb: 2 }}>
              {currentRecordingIndex === index ? (
                <VideoPreview
                  ref={el => videoRefs.current[index] = el!}
                  autoPlay
                  playsInline
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (recordedVideos[index] || uploadedVideos[index]) ? (
                <VideoPreview
                  ref={el => videoRefs.current[index] = el!}
                  src={recordedVideos[index] || uploadedVideos[index]}
                  controls
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    No video recorded or uploaded yet
                  </Typography>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => startRecording(index)}
                disabled={isRecording}
              >
                Record
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={() => stopRecording(index)}
                disabled={!isRecording || currentRecordingIndex !== index}
              >
                Stop
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
              >
                Upload Video
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, index)}
                />
              </Button>
              {(recordedVideos[index] || uploadedVideos[index]) && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    setRecordedVideos(prev => {
                      const newVideos = [...prev];
                      newVideos[index] = '';
                      return newVideos;
                    });
                    setUploadedVideos(prev => {
                      const newVideos = [...prev];
                      newVideos[index] = '';
                      return newVideos;
                    });
                    setVideos(prev => {
                      const newVideos = [...prev];
                      newVideos[index] = null;
                      return newVideos;
                    });
                  }}
                >
                  Retake
                </Button>
              )}
            </Stack>
          </StyledPaper>
        ))}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            disabled={videos.some(video => !video) || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default JobApplication; 