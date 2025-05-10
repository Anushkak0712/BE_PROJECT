import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Application } from '../../api/api';
import { Tooltip} from '@mui/material';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore,
  PlayArrow,
  Person,
  AccessTime,
  Psychology,
  QuestionAnswer,
} from '@mui/icons-material';

const JobApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, applicationsResponse] = await Promise.all([
          jobAPI.getJobs(),
          jobAPI.getJobApplications(token!, jobId!)
        ]);

        if (jobsResponse.success) {
          const jobData = jobsResponse.jobs.find((j: any) => j._id === jobId);
          if (jobData) {
            setJob(jobData);
          }
        }

        if (applicationsResponse.success) {
          setApplications(applicationsResponse.applications);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, token]);

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      const response = await jobAPI.updateApplicationStatus(token!, applicationId, status);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId ? { ...app, status } : app
          )
        );
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating status');
    }
  };

  const handleRequestRevaluation = async (applicationId: string) => {
    try {
      const response = await jobAPI.requestRevaluation(token!, applicationId);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId
              ? { ...app, revaluation_status: 'pending' }
              : app
          )
        );
      } else {
        setError(response.message || 'Failed to request revaluation');
      }
    } catch (err) {
      setError('An error occurred while requesting revaluation');
    }
  };

  const handleViewVideo = async (videoUrl: string) => {
    try {
      const filename = videoUrl.split('/').pop();
      if (!filename) {
        throw new Error('Invalid video URL');
      }
      
      const response = await jobAPI.getVideo(token!, filename);
      const videoBlob = new Blob([response], { type: 'video/mp4' });
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      setSelectedVideo(videoObjectUrl);
    } catch (err) {
      setError('Failed to load video');
      console.error('Error loading video:', err);
    }
  };

 const personalityDescriptions: { [key: string]: string } = {
    extraversion: 'Extraversion refers to the tendency to seek stimulation in the company of others.',
    neuroticism: 'Neuroticism refers to the tendency to experience negative emotions like anxiety and depression.',
    agreeableness: 'Agreeableness reflects the tendency to be compassionate and cooperative.',
    conscientiousness: 'Conscientiousness refers to being organized, responsible, and hardworking.',
    openness: 'Openness involves the willingness to experience new things and embrace abstract concepts.'
  };
  
  const PersonalityScoreCard = ({ title, value }: { title: string; value: number | undefined }) => {
    // Get the description for the title from the JSON object
    const description = personalityDescriptions[title.toLowerCase()] || 'No description available';
  
    return (
      <Tooltip title={description} arrow>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h6" color="primary">
            {value ? value.toFixed(2) : 'N/A'}
          </Typography>
        </Paper>
      </Tooltip>
    );
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
        Applications for {job.title}
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          {error}
        </Paper>
      )}

      <List>
        {applications.map((application) => (
          <Paper key={application._id} sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                  {application.candidate_id}
                </Typography>
                <Typography color="text.secondary">
                  <AccessTime sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Select
                  value={application.status}
                  onChange={(e) => handleStatusChange(application._id, e.target.value)}
                  size="small"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="shortlisted">Shortlisted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
                
              </Box>
            </Box>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Overall Personality Analysis
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <PersonalityScoreCard
                      title="Extraversion"
                      value={application.average_scores?.extraversion}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <PersonalityScoreCard
                      title="Neuroticism"
                      value={application.average_scores?.neuroticism}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <PersonalityScoreCard
                      title="Agreeableness"
                      value={application.average_scores?.agreeableness}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <PersonalityScoreCard
                      title="Conscientiousness"
                      value={application.average_scores?.conscientiousness}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <PersonalityScoreCard
                      title="Openness"
                      value={application.average_scores?.openness}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  <QuestionAnswer sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Video Responses
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {application.answers.map((answer, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                              {job?.questions[answer.question_index]?.question_text || `Question ${index + 1}`}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Personality Scores:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    <Chip
                                      size="small"
                                      label={`Extraversion: ${answer.personality_scores?.extraversion?.toFixed(2) || 'N/A'}`}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Neuroticism: ${answer.personality_scores?.neuroticism?.toFixed(2) || 'N/A'}`}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Agreeableness: ${answer.personality_scores?.agreeableness?.toFixed(2) || 'N/A'}`}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Conscientiousness: ${answer.personality_scores?.conscientiousness?.toFixed(2) || 'N/A'}`}
                                    />
                                    <Chip
                                      size="small"
                                      label={`Openness: ${answer.personality_scores?.openness?.toFixed(2) || 'N/A'}`}
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                                  <Button
                                    variant="contained"
                                    startIcon={<PlayArrow />}
                                    onClick={() => handleViewVideo(answer.video_url)}
                                  >
                                    Watch Response
                                  </Button>
                                </Grid>
                              </Grid>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < application.answers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </List>

      <Dialog
        open={!!selectedVideo}
        onClose={() => {
          if (selectedVideo) {
            URL.revokeObjectURL(selectedVideo);
            setSelectedVideo(null);
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Video Response</DialogTitle>
        <DialogContent>
          {selectedVideo && (
            <video
              src={selectedVideo}
              controls
              style={{ width: '100%', borderRadius: '8px' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (selectedVideo) {
              URL.revokeObjectURL(selectedVideo);
              setSelectedVideo(null);
            }
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobApplications; 