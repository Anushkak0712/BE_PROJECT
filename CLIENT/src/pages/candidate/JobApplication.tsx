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
  maxHeight: '400px',
  borderRadius: '8px',
  backgroundColor: '#000',
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
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }, 
          audio: true 
        })
          .then(stream => {
            const video = videoRefs.current[index];
            if (video) {
              video.srcObject = stream;
              video.play();
            }

            // Store the stream
            setStreams(prev => {
              const newStreams = [...prev];
              newStreams[index] = stream;
              return newStreams;
            });

            // Try different MIME types in order of preference
            const mimeTypes = [
              'video/mp4;codecs=h264,aac',
              'video/webm;codecs=h264,opus',
              'video/webm;codecs=vp9,opus',
              'video/webm'
            ];

            let selectedMimeType = '';
            for (const mimeType of mimeTypes) {
              if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
              }
            }

            if (!selectedMimeType) {
              throw new Error('No supported MIME type found');
            }

            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: selectedMimeType,
              videoBitsPerSecond: 2500000 // 2.5 Mbps
            });
            mediaRecorderRefs.current[index] = mediaRecorder;
            chunksRefs.current[index] = [];

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunksRefs.current[index].push(e.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunksRefs.current[index], { type: selectedMimeType });
              const videoUrl = URL.createObjectURL(blob);
              
              // Store the video URL for preview
              setRecordedVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = videoUrl;
                return newVideos;
              });

              // Create a File object with the correct extension based on MIME type
              const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
              const videoFile = new File([blob], `answer_${index}.${extension}`, { type: selectedMimeType });
              
              // Store the video file for submission
              setVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = videoFile;
                return newVideos;
              });
              
              // Clean up the stream
              if (streams[index]) {
                streams[index].getTracks().forEach(track => track.stop());
              }
              setStreams(prev => {
                const newStreams = [...prev];
                newStreams[index] = null as any;
                return newStreams;
              });
              setCurrentRecordingIndex(null);
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setCurrentRecordingIndex(index);
          })
          .catch(err => {
            console.error('Error accessing media devices:', err);
            setError('Failed to access camera and microphone');
          });
      } else {
        // Fallback to the older API
        const navigatorWithGetUserMedia = navigator as Navigator & {
          getUserMedia: (
            constraints: MediaStreamConstraints,
            successCallback: (stream: MediaStream) => void,
            errorCallback: (error: Error) => void
          ) => void;
        };

        navigatorWithGetUserMedia.getUserMedia(
          { video: true, audio: true },
          (stream: MediaStream) => {
            const video = videoRefs.current[index];
            if (video) {
              video.srcObject = stream;
              video.play();
            }

            // Store the stream
            setStreams(prev => {
              const newStreams = [...prev];
              newStreams[index] = stream;
              return newStreams;
            });

            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp9,opus'
            });
            mediaRecorderRefs.current[index] = mediaRecorder;
            chunksRefs.current[index] = [];

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunksRefs.current[index].push(e.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunksRefs.current[index], { type: 'video/webm' });
              const videoUrl = URL.createObjectURL(blob);
              setRecordedVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = videoUrl;
                return newVideos;
              });
              setVideos(prev => {
                const newVideos = [...prev];
                newVideos[index] = new File([blob], `answer_${index}.webm`, { type: 'video/webm' });
                return newVideos;
              });
              
              // Clean up the stream
              if (streams[index]) {
                streams[index].getTracks().forEach(track => track.stop());
              }
              setStreams(prev => {
                const newStreams = [...prev];
                newStreams[index] = null as any;
                return newStreams;
              });
              setCurrentRecordingIndex(null);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setCurrentRecordingIndex(index);
          },
          (err: Error) => {
            console.error('Error accessing media devices:', err);
            setError('Failed to access camera and microphone');
          }
        );
      }
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access camera and microphone');
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
        setError('Please upload a video file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (videos.some(video => !video)) {
      setError('Please record or upload all video responses');
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    try {
      setIsSubmitting(true);
      const validVideos = videos.filter((video): video is File => video !== null);
      const response = await jobAPI.applyJob(token!, jobId!, validVideos);
      if (response.success) {
        setSuccess('Application submitted successfully!');
        setTimeout(() => navigate('/candidate/dashboard'), 2000);
      } else {
        setError(response.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('An error occurred while submitting the application');
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