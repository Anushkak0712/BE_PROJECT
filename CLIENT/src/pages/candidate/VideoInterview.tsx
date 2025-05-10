import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import Webcam from 'react-webcam';
import { styled } from '@mui/material/styles';
import { VideoCall, Stop, Refresh } from '@mui/icons-material';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();

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
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStartRecording = useCallback(async () => {
    setRecording(true);
    setRecordedChunks([]);
    setError(null);
    setSuccess(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      webcamStreamRef.current = stream;

      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current.addEventListener('dataavailable', ({ data }) => {
        if (data.size > 0) {
          setRecordedChunks((prev) => prev.concat(data));
        }
      });

      mediaRecorderRef.current.start();
    } catch (err) {
      setError('Could not access camera or microphone.');
      console.error(err);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setRecording(false);
  }, []);

  const convertVideo = useCallback(async (blob: Blob) => {
    try {
      if (!ffmpeg.loaded) {
        await ffmpeg.load();
      }

      const inputFileName = 'input.webm';
      const outputFileName = 'output.mp4';

      // Convert Blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write the input file
      await ffmpeg.writeFile(inputFileName, uint8Array);

      // Run FFmpeg command to convert to MP4
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        outputFileName
      ]);

      // Read the output file
      const data = await ffmpeg.readFile(outputFileName);
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Error converting video:', error);
      throw error;
    }
  }, []);

  const handleUpload = async () => {
    if (recordedChunks.length === 0) {
      setError('No recording available to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const webmBlob = new Blob(recordedChunks, { type: 'video/webm' });
      console.log('Original WebM blob details:', {
        type: webmBlob.type,
        size: webmBlob.size,
        lastModified: new Date().toISOString(),
        mimeType: webmBlob.type,
        isWebM: webmBlob.type.includes('webm'),
        isMP4: webmBlob.type.includes('mp4')
      });

      let finalBlob: Blob;
      try {
        finalBlob = await convertVideo(webmBlob);
        console.log('Converted MP4 blob details:', {
          type: finalBlob.type,
          size: finalBlob.size,
          lastModified: new Date().toISOString(),
          mimeType: finalBlob.type,
          isWebM: finalBlob.type.includes('webm'),
          isMP4: finalBlob.type.includes('mp4')
        });
      } catch (convertError) {
        console.error('Conversion failed:', convertError);
        console.log('Using original WebM blob instead');
        finalBlob = webmBlob;
      }

      const formData = new FormData();
      const fileName = `interview.${finalBlob.type.split('/')[1]}`;
      formData.append('video', finalBlob, fileName);
      
      console.log('FormData details:', {
        fileName,
        fileType: finalBlob.type,
        fileSize: finalBlob.size,
        formDataKeys: Array.from(formData.keys()),
        formDataValues: Array.from(formData.values()).map(v => 
          v instanceof Blob ? {
            type: v.type,
            size: v.size
          } : v
        )
      });

      const response = await fetch('YOUR_BACKEND_API_URL/upload-interview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error('Failed to upload video');
      }

      setSuccess(true);
      setRecordedChunks([]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert/upload video');
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
              ref={webcamRef}
              audio={false}
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
                    'Upload Recording (MP4)'
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
