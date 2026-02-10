import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    interview_id: '',
    candidate_id: '',
    technical_score: 5,
    communication_score: 5,
    cultural_fit_score: 5,
    feedback_comment: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/interviews`);
      // Filter only completed or scheduled interviews
      const availableInterviews = response.data.filter(i => i.status !== 'cancelled');
      setInterviews(availableInterviews);
    } catch (error) {
      toast.error('Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewSelect = (interviewId) => {
    const selectedInterview = interviews.find(i => i.id === interviewId);
    if (selectedInterview) {
      setFormData({
        ...formData,
        interview_id: interviewId,
        candidate_id: selectedInterview.candidate_id
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/feedback`, formData);
      toast.success('Feedback submitted successfully! AI sentiment analysis completed.');
      setFormData({
        interview_id: '',
        candidate_id: '',
        technical_score: 5,
        communication_score: 5,
        cultural_fit_score: 5,
        feedback_comment: ''
      });
      fetchInterviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>Submit Feedback</h1>
            <p className="text-gray-600 mt-1">Evaluate candidate performance with AI-powered sentiment analysis</p>
          </div>
        </div>

        <Card className="p-8 bg-white shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Select Interview</Label>
                <select
                  data-testid="select-interview"
                  value={formData.interview_id}
                  onChange={(e) => handleInterviewSelect(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select an interview...</option>
                  {interviews.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.candidate_name} - {new Date(i.scheduled_at).toLocaleDateString()} ({i.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Technical Score (0-10)</Label>
                  <Input
                    data-testid="technical-score-input"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.technical_score}
                    onChange={(e) => setFormData({ ...formData, technical_score: parseFloat(e.target.value) })}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Weight: 50%</p>
                </div>
                <div>
                  <Label>Communication Score (0-10)</Label>
                  <Input
                    data-testid="communication-score-input"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.communication_score}
                    onChange={(e) => setFormData({ ...formData, communication_score: parseFloat(e.target.value) })}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Weight: 30%</p>
                </div>
                <div>
                  <Label>Cultural Fit Score (0-10)</Label>
                  <Input
                    data-testid="cultural-fit-score-input"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.cultural_fit_score}
                    onChange={(e) => setFormData({ ...formData, cultural_fit_score: parseFloat(e.target.value) })}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Weight: 10%</p>
                </div>
              </div>

              <div>
                <Label>Feedback Comment</Label>
                <Textarea
                  data-testid="feedback-comment-textarea"
                  value={formData.feedback_comment}
                  onChange={(e) => setFormData({ ...formData, feedback_comment: e.target.value })}
                  required
                  placeholder="Provide detailed feedback about the candidate's performance..."
                  rows={6}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will analyze sentiment: Weight 10%
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Scoring Formula</h3>
                <p className="text-sm text-purple-800">
                  Final Score = (Technical × 0.5) + (Communication × 0.3) + (Cultural Fit × 0.1) + (AI Sentiment × 0.1)
                </p>
              </div>

              <Button
                type="submit"
                data-testid="submit-feedback-button"
                className="w-full"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Analyzing with AI...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </span>
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Feedback;
