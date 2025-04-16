import React from 'react';
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
  Chip,
  Divider,
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  CheckCircle,
  Pending,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const CandidateDashboard = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const upcomingInterviews = [
    {
      id: 1,
      company: 'Tech Corp',
      position: 'Senior Developer',
      deadline: '2024-04-20',
      status: 'pending',
    },
    {
      id: 2,
      company: 'Innovation Labs',
      position: 'Full Stack Engineer',
      deadline: '2024-04-25',
      status: 'not_started',
    },
  ];

  const completedInterviews = [
    {
      id: 3,
      company: 'Digital Solutions',
      position: 'Frontend Developer',
      completedDate: '2024-04-01',
      status: 'completed',
      feedback: 'Under review',
    },
  ];

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <StatusChip
            icon={<CheckCircle />}
            label="Completed"
            color="success"
            size="small"
          />
        );
      case 'pending':
        return (
          <StatusChip
            icon={<Pending />}
            label="In Progress"
            color="warning"
            size="small"
          />
        );
      case 'rejected':
        return (
          <StatusChip
            icon={<Close />}
            label="Rejected"
            color="error"
            size="small"
          />
        );
      default:
        return (
          <StatusChip
            icon={<Schedule />}
            label="Not Started"
            color="default"
            size="small"
          />
        );
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Upcoming Interviews
            </Typography>
            <List>
              {upcomingInterviews.map((interview) => (
                <React.Fragment key={interview.id}>
                  <ListItem
                    secondaryAction={
                      <Button
                        variant="contained"
                        startIcon={<VideoCall />}
                        onClick={() => navigate(`/interview/${interview.id}`)}
                      >
                        Start Interview
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <VideoCall />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          {interview.position} at {interview.company}
                          {getStatusChip(interview.status)}
                        </>
                      }
                      secondary={`Deadline: ${interview.deadline}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Completed Interviews
            </Typography>
            <List>
              {completedInterviews.map((interview) => (
                <React.Fragment key={interview.id}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          {interview.position} at {interview.company}
                          {getStatusChip(interview.status)}
                        </>
                      }
                      secondary={
                        <>
                          Completed on: {interview.completedDate}
                          <br />
                          Status: {interview.feedback}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateDashboard; 