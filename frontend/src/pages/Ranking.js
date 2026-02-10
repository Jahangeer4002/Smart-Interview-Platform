import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, AlertTriangle, TrendingUp, Brain } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Ranking = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await axios.get(`${API_URL}/ranking`);
      setRankings(response.data);
    } catch (error) {
      toast.error('Failed to fetch rankings');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100 border-green-300';
    if (score >= 6) return 'bg-blue-100 border-blue-300';
    if (score >= 4) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>Candidate Rankings</h1>
            <p className="text-gray-600 mt-1">AI-powered evaluation with bias detection</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : rankings.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-gray-500">No candidate evaluations found</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top Candidate Highlight */}
            {rankings.length > 0 && (
              <Card className="p-8 bg-white shadow-xl border-2" style={{ borderColor: '#667eea' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Top Candidate</h2>
                    <p className="text-gray-600">Highest overall score</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Manrope' }}>{rankings[0].candidate_name}</h3>
                    <p className="text-lg text-gray-600 mb-4">{rankings[0].position}</p>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-bold" style={{ color: '#667eea' }}>{rankings[0].final_score}</div>
                      <div className="text-sm text-gray-500">
                        <div>Based on {rankings[0].feedback_count} evaluation{rankings[0].feedback_count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{rankings[0].technical_score}</div>
                      <div className="text-xs text-gray-600 mt-1">Technical</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{rankings[0].communication_score}</div>
                      <div className="text-xs text-gray-600 mt-1">Communication</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{rankings[0].cultural_fit_score}</div>
                      <div className="text-xs text-gray-600 mt-1">Cultural Fit</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{rankings[0].sentiment_weight.toFixed(1)}</div>
                      <div className="text-xs text-gray-600 mt-1">AI Sentiment</div>
                    </div>
                  </div>
                </div>
                {rankings[0].bias_warnings.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Bias Warnings Detected</h4>
                        {rankings[0].bias_warnings.map((warning, idx) => (
                          <p key={idx} className="text-sm text-red-800">• {warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* All Rankings */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Manrope' }}>All Candidates</h2>
              {rankings.map((candidate, index) => (
                <Card
                  key={candidate.candidate_id}
                  data-testid={`ranking-card-${candidate.candidate_id}`}
                  className={`p-6 bg-white card-hover ${
                    index === 0 ? 'border-2 border-purple-300' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                          index === 0
                            ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                            : index === 1
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                            : index === 2
                            ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Manrope' }}>{candidate.candidate_name}</h3>
                        <p className="text-sm text-gray-600">{candidate.position}</p>
                      </div>
                    </div>
                    <div className={`text-right border-2 rounded-lg px-6 py-3 ${getScoreBgColor(candidate.final_score)}`}>
                      <div className={`text-3xl font-bold ${getScoreColor(candidate.final_score)}`}>
                        {candidate.final_score}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Final Score</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{candidate.technical_score}</div>
                      <div className="text-xs text-gray-500 mt-1">Technical (50%)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{candidate.communication_score}</div>
                      <div className="text-xs text-gray-500 mt-1">Communication (30%)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{candidate.cultural_fit_score}</div>
                      <div className="text-xs text-gray-500 mt-1">Cultural Fit (10%)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{candidate.sentiment_weight.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Brain className="w-3 h-3 inline mr-1" />
                        AI Sentiment (10%)
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{candidate.feedback_count}</div>
                      <div className="text-xs text-gray-500 mt-1">Evaluations</div>
                    </div>
                  </div>

                  {/* Bias Warnings */}
                  {candidate.bias_warnings.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-1 text-sm">Potential Bias Detected</h4>
                          <div className="space-y-1">
                            {candidate.bias_warnings.map((warning, idx) => (
                              <p key={idx} className="text-xs text-red-800">• {warning}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;
