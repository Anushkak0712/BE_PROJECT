import React, { useState } from 'react';
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
} from '@mui/material';
import {
  VideoCall,
  Person,
  Add,
  PlayArrow,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const RecruiterDashboard = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  // Mock data - replace with actual API calls
  const pendingReviews = [
    {
      id: 1,
      candidate: 'John Doe',
      position: 'Senior Developer',
      submittedDate: '2024-04-10',
      videoUrl: 'https://example.com/video1.mp4',
    },
    {
      id: 2,
      candidate: 'Jane Smith',
      position: 'Full Stack Engineer',
      submittedDate: '2024-04-11',
      videoUrl: 'https://example.com/video2.mp4',
    },
  ];

  const activePositions = [
    {
      id: 1,
      title: 'Senior Developer',
      department: 'Engineering',
      candidates: 5,
      pending: 2,
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      department: 'Technology',
      candidates: 3,
      pending: 1,
    },
  ];

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
              <Typography variant="h6">Pending Reviews</Typography>
              <Chip
                label={`${pendingReviews.length} pending`}
                color="primary"
                size="small"
              />
            </Stack>
            <List>
              {pendingReviews.map((interview) => (
                <ListItem
                  key={interview.id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleOpenVideo(interview)}
                    >
                      Review
                    </Button>
                  }
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${interview.candidate} - ${interview.position}`}
                    secondary={`Submitted: ${interview.submittedDate}`}
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
              <Typography variant="h6">Active Positions</Typography>
              <Button startIcon={<Add />} variant="contained">
                Add Position
              </Button>
            </Stack>
            <List>
              {activePositions.map((position) => (
                <ListItem key={position.id}>
                  <ListItemIcon>
                    <VideoCall />
                  </ListItemIcon>
                  <ListItemText
                    primary={position.title}
                    secondary={
                      <>
                        Department: {position.department}
                        <br />
                        Candidates: {position.candidates} (
                        {position.pending} pending)
                      </>
                    }
                  />
                </ListItem>
              ))}
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
                  Candidate: {selectedInterview.candidate}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Position: {selectedInterview.position}
                </Typography>
              </Box>
              <VideoPreview controls>
                <source src={selectedInterview.videoUrl} type="video/mp4" />
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