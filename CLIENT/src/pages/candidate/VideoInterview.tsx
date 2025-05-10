import React, { useState, useRef } from 'react';
import { Box, Button, Typography, Paper, Alert, Stack, CircularProgress } from '@mui/material';
import Webcam from 'react-webcam';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  '& video': {
    width: '100%',
    borderRadius: theme.spacing(1),
  },
}));

const VideoInterview = () => {
  const webcamRef = useRef<Webcam>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setError('Failed to capture image from webcam.');
        return;
      }

      const blob = await fetch(imageSrc).then(res => res.blob());
      const file = new File([blob], 'snapshot.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('video', file); // Or 'image' depending on your backend

      const response = await fetch('YOUR_BACKEND_API_URL/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Video Interview
      </Typography>

      <StyledPaper elevation={3}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              Video uploaded successfully! The recruiter will review it soon.
            </Alert>
          )}

          <VideoContainer>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
            />
          </VideoContainer>

          <Stack direction="row" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Uploading...
                </>
              ) : (
                'Upload Snapshot'
              )}
            </Button>
          </Stack>
        </Stack>
      </StyledPaper>
    </Box>
  );
};

export default VideoInterview;
