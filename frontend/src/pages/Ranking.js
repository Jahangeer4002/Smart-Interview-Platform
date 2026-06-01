import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trophy, AlertTriangle, Brain } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const Ranking = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [groupedRankings, setGroupedRankings] = useState({});
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  // ✅ FETCH DATA
  const fetchRankings = async () => {
    try {
      const response = await axios.get(`${API_URL}/ranking`);
      const data = response.data;

      setRankings(data);

      // 🔥 GROUP BY ROLE
      const grouped = data.reduce((acc, item) => {
        const role = item.position || "Others";
        if (!acc[role]) acc[role] = [];
        acc[role].push(item);
        return acc;
      }, {});

      // 🔥 SORT EACH ROLE
      Object.keys(grouped).forEach((role) => {
        grouped[role].sort((a, b) => b.final_score - a.final_score);
      });

      setGroupedRankings(grouped);
    } catch (error) {
      toast.error("Failed to fetch rankings");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FILTER BASED ON DROPDOWN
  const filteredGroupedRankings =
    selectedRole === "ALL"
      ? groupedRankings
      : { [selectedRole]: groupedRankings[selectedRole] };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return "bg-green-100 border-green-300";
    if (score >= 6) return "bg-blue-100 border-blue-300";
    if (score >= 4) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Candidate Rankings</h1>
            <p className="text-gray-600 mt-1">
              AI-powered evaluation with bias detection
            </p>
          </div>
        </div>

        {/* 🔽 DROPDOWN FILTER */}
        <div className="mb-6">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">All Roles</option>
            {Object.keys(groupedRankings).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : Object.keys(filteredGroupedRankings).length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-gray-500">No data found</p>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* 🔥 ROLE LOOP */}
            {Object.entries(filteredGroupedRankings).map(
              ([role, candidates]) => (
                <div key={role} className="space-y-6">
                  {/* ROLE TITLE */}
                  <h2 className="text-2xl font-bold mt-6">{role}</h2>

                  {/* 🏆 TOP CANDIDATE */}
                  <Card
                    className="p-8 bg-white shadow-xl border-2"
                    style={{ borderColor: "#667eea" }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        }}
                      >
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Top Candidate</h2>
                        <p className="text-gray-600">Highest score in {role}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-3xl font-bold mb-2">
                          {candidates[0].candidate_name}
                        </h3>
                        <p className="text-lg text-gray-600 mb-4">
                          {candidates[0].position}
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="text-4xl font-bold text-blue-600">
                            {candidates[0].final_score}
                          </div>
                          <div className="text-sm text-gray-500">
                            Based on {candidates[0].feedback_count} evaluations
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {candidates[0].technical_score}
                          </div>
                          <div className="text-xs text-gray-600">Technical</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {candidates[0].communication_score}
                          </div>
                          <div className="text-xs text-gray-600">
                            Communication
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {candidates[0].cultural_fit_score}
                          </div>
                          <div className="text-xs text-gray-600">
                            Cultural Fit
                          </div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                          <div className="text-2xl font-bold text-amber-600">
                            {candidates[0].sentiment_weight.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">
                            AI Sentiment
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 📋 ALL CANDIDATES */}
                  <div className="space-y-3">
                    {candidates.map((candidate, index) => (
                      <Card
                        key={candidate.candidate_id}
                        className={`p-6 bg-white ${index === 0 ? "border-2 border-purple-300" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl bg-gray-200">
                              #{index + 1}
                            </div>

                            <div>
                              <h3 className="text-xl font-bold">
                                {candidate.candidate_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {candidate.position}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`text-right border-2 rounded-lg px-6 py-3 ${getScoreBgColor(candidate.final_score)}`}
                          >
                            <div
                              className={`text-2xl font-bold ${getScoreColor(candidate.final_score)}`}
                            >
                              {candidate.final_score}
                            </div>
                            <div className="text-xs text-gray-600">
                              Final Score
                            </div>
                          </div>
                        </div>

                        {/* SCORE BREAKDOWN */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-bold">
                              {candidate.technical_score}
                            </div>
                            <div className="text-xs text-gray-500">
                              Technical
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-bold">
                              {candidate.communication_score}
                            </div>
                            <div className="text-xs text-gray-500">
                              Communication
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-bold">
                              {candidate.cultural_fit_score}
                            </div>
                            <div className="text-xs text-gray-500">
                              Cultural Fit
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-bold">
                              {candidate.sentiment_weight.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              <Brain className="w-3 h-3 inline mr-1" />
                              AI Sentiment
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-bold">
                              {candidate.feedback_count}
                            </div>
                            <div className="text-xs text-gray-500">
                              Evaluations
                            </div>
                          </div>
                        </div>

                        {/* BIAS WARNINGS */}
                        {candidate.bias_warnings?.length > 0 && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <div>
                                {candidate.bias_warnings.map((w, i) => (
                                  <p key={i} className="text-xs text-red-800">
                                    • {w}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;
