import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Interviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    candidate_id: '',
    interviewer_id: '',
    preferred_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interviewsRes, candidatesRes, interviewersRes] = await Promise.all([
        axios.get(`${API_URL}/interviews`),
        axios.get(`${API_URL}/candidates`),
        axios.get(`${API_URL}/users/interviewers`)
      ]);
      setInterviews(interviewsRes.data);
      setCandidates(candidatesRes.data);
      setInterviewers(interviewersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setScheduleLoading(true);
    try {
      await axios.post(`${API_URL}/interviews/schedule`, scheduleData);
      toast.success('Interview scheduled successfully!');
      setDialogOpen(false);
      setScheduleData({ candidate_id: '', interviewer_id: '', preferred_date: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to schedule interview');
    } finally {
      setScheduleLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/oauth/calendar/login`);
      window.open(response.data.authorization_url, '_blank');
      toast.info('Please authorize Google Calendar in the new window');
    } catch (error) {
      toast.error('Failed to initiate Google Calendar connection');
    }
  };

  const canSchedule = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')} data-testid="back-button">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>Interviews</h1>
              <p className="text-gray-600 mt-1">View and schedule interviews</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={connectGoogleCalendar} data-testid="connect-calendar-button">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>
            {canSchedule && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="schedule-interview-button" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Interview</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSchedule} className="space-y-4">
                    <div>
                      <Label>Candidate</Label>
                      <select
                        data-testid="select-candidate"
                        value={scheduleData.candidate_id}
                        onChange={(e) => setScheduleData({ ...scheduleData, candidate_id: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Select candidate...</option>
                        {candidates.map(c => (
                          <option key={c.id} value={c.id}>{c.name} - {c.position}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Interviewer</Label>
                      <select
                        data-testid="select-interviewer"
                        value={scheduleData.interviewer_id}
                        onChange={(e) => setScheduleData({ ...scheduleData, interviewer_id: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Select interviewer...</option>
                        {interviewers.map(i => (
                          <option key={i.id} value={i.id}>{i.full_name} ({i.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Preferred Date</Label>
                      <input
                        data-testid="select-date"
                        type="date"
                        value={scheduleData.preferred_date}
                        onChange={(e) => setScheduleData({ ...scheduleData, preferred_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="schedule-submit-button"
                      className="w-full"
                      disabled={scheduleLoading}
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      {scheduleLoading ? 'Scheduling...' : 'Schedule Interview'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Interviews List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : interviews.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-gray-500">No interviews scheduled</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id} data-testid={`interview-card-${interview.id}`} className="p-6 bg-white card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-bold" style={{ fontFamily: 'Manrope' }}>{interview.candidate_name}</h3>
                      <span className={`badge badge-${interview.status}`}>{interview.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Interviewer</p>
                        <p className="font-medium">{interview.interviewer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Scheduled At</p>
                        <p className="font-medium">{new Date(interview.scheduled_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{interview.duration_minutes} minutes</p>
                      </div>
                      {interview.meeting_link && (
                        <div>
                          <p className="text-gray-500">Meeting Link</p>
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Join Meeting <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;
