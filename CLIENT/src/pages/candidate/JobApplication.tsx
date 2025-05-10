import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  position: 'relative', // So the button can be positioned inside this container
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const VideoPreview = styled('video')({
  width: '100%',
  height: '480px',
  borderRadius: '10px',
  backgroundColor: '#000',
  objectFit: 'contain',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  marginBottom: '50px', // Add some space below the video for the button
});

const UploadButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  padding: '8px 16px',
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const JobApplication: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [videos, setVideos] = useState<(File | null)[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recordedVideos, setRecordedVideos] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const chunksRefs = useRef<Blob[][]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const tempVideo = document.createElement('video');
          tempVideo.src = e.target?.result as string;

          tempVideo.onloadedmetadata = () => {
            if (tempVideo.videoWidth > 0 && tempVideo.videoHeight > 0) {
              setVideos((prev) => {
                const newVideos = [...prev];
                newVideos[index] = file;
                return newVideos;
              });
              const videoUrl = URL.createObjectURL(file);
              setUploadedVideos((prev) => {
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

    if (videos.some((video) => !video)) {
      setError('Please upload all video responses');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      const validVideos = videos.filter((video): video is File => !!video);
      validVideos.forEach((video) => {
        formData.append('videos', video);
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
        {job.questions.map((question: { question_text: string; time_limit: number }, index: number) => (
          <StyledPaper key={index}>
            <Typography variant="h6" gutterBottom>
              Q{index + 1}: {question.question_text} (Time Limit: {question.time_limit}s)
            </Typography>

            {/* Show preview or the upload button */}
            {uploadedVideos[index] ? (
              <VideoPreview ref={(el) => (videoRefs.current[index] = el!)} controls src={uploadedVideos[index]} />
            ) : null}

            <UploadButton>
              <label htmlFor={`upload-video-${index}`} style={{ width: '100%' }}>
                Upload Video
                <input
                  id={`upload-video-${index}`}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => handleFileUpload(e, index)}
                />
              </label>
            </UploadButton>
          </StyledPaper>
        ))}

        <Divider sx={{ my: 3 }} />

        <Box textAlign="right">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="contained"
            color="primary"
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default JobApplication;
