import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  VideoCall,
  Person,
  Add,
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const VideoPreview = styled('video')({
  width: '100%',
  maxHeight: '400px',
  borderRadius: '8px',
});

const navigatorWithGetUserMedia = navigator as Navigator & {
  getUserMedia: (
    constraints: MediaStreamConstraints,
    successCallback: (stream: MediaStream) => void,
    errorCallback: (error: Error) => void
  ) => void;
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobAPI.getJobs();
        if (response.success) {
          setJobs(response.jobs);
        } else {
          setError('Failed to fetch jobs');
        }
      } catch (err) {
        setError('An error occurred while fetching jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleOpenVideo = (interview: any) => {
    setSelectedInterview(interview);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInterview(null);
  };

  const handleSubmitFeedback = () => {
    // Implement feedback submission logic
    handleCloseDialog();
  };

  const handleAddPosition = () => {
    navigate('/recruiter/job-posting');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <StyledPaper elevation={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Active Positions</Typography>
              <Button 
                startIcon={<Add />} 
                variant="contained"
                onClick={handleAddPosition}
              >
                Add Position
              </Button>
            </Stack>
            <List>
              {jobs.map((job) => (
                <ListItem 
                  key={job._id}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/recruiter/jobs/${job._id}/applications`)}
                    >
                      View Applications
                    </Button>
                  }
                >
                  <ListItemIcon>
                    <VideoCall />
                  </ListItemIcon>
                  <ListItemText
                    primary={job.title}
                    secondary={
                      <>
                        Company: {job.company_name}
                        <br />
                        Location: {job.location}
                        <br />
                        Type: {job.job_type}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={5}>
          <StyledPaper elevation={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Recent Applications</Typography>
              <Chip
                label={`${jobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0)} total`}
                color="primary"
                size="small"
              />
            </Stack>
            <List>
              {jobs.flatMap(job => 
                (job.applications || []).map((application: any) => (
                  <ListItem
                    key={application._id}
                    secondaryAction={
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => handleOpenVideo(application)}
                      >
                        Review
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${application.candidate_name} - ${job.title}`}
                      secondary={`Submitted: ${new Date(application.created_at).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </StyledPaper>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Interview</DialogTitle>
        <DialogContent>
          {selectedInterview && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Candidate: {selectedInterview.candidate_name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Position: {selectedInterview.job_title}
                </Typography>
              </Box>
              <VideoPreview controls>
                <source src={selectedInterview.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </VideoPreview>
              <TextField
                label="Feedback"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
              />
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Technical Skills"
                  color="primary"
                  variant="outlined"
                  onClick={() => {}}
                />
                <Chip
                  label="Communication"
                  color="primary"
                  variant="outlined"
                  onClick={() => {}}
                />
                <Chip
                  label="Problem Solving"
                  color="primary"
                  variant="outlined"
                  onClick={() => {}}
                />
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitFeedback}
            startIcon={<CheckCircle />}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecruiterDashboard; 