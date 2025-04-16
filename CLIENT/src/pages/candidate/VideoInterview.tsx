import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import Webcam from 'react-webcam';
import { styled } from '@mui/material/styles';
import { VideoCall, Stop, Refresh } from '@mui/icons-material';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStartRecording = useCallback(() => {
    setRecording(true);
    setRecordedChunks([]);
    setError(null);
    setSuccess(false);

    if (webcamRef.current?.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm',
      });
      mediaRecorderRef.current.addEventListener('dataavailable', ({ data }) => {
        if (data.size > 0) {
          setRecordedChunks((prev) => prev.concat(data));
        }
      });
      mediaRecorderRef.current.start();
    }
  }, [webcamRef, setRecordedChunks]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, [mediaRecorderRef, setRecording]);

  const handleUpload = async () => {
    if (recordedChunks.length === 0) {
      setError('No recording available to upload');
      return;
    }

    try {
      setUploading(true);
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'interview.webm');

      // Replace with your actual API endpoint
      const response = await fetch('YOUR_BACKEND_API_URL/upload-interview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload video');

      setSuccess(true);
      setRecordedChunks([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
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
              audio={true}
              ref={webcamRef}
              videoConstraints={videoConstraints}
              muted
            />
          </VideoContainer>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            {!recording ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<VideoCall />}
                onClick={handleStartRecording}
                disabled={uploading}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Stop />}
                onClick={handleStopRecording}
              >
                Stop Recording
              </Button>
            )}

            {recordedChunks.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => setRecordedChunks([])}
                  disabled={uploading}
                >
                  Clear Recording
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <CircularProgress size={24} color="inherit" />
                      &nbsp;Uploading...
                    </>
                  ) : (
                    'Upload Recording'
                  )}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </StyledPaper>
    </Box>
  );
};

export default VideoInterview; 