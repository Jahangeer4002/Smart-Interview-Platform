import React, { useState, useEffect } from "react";
import API from "../api"; // ✅ FIXED
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  ExternalLink,
} from "lucide-react";

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
    candidate_id: "",
    interviewer_id: "",
    preferred_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interviewsRes, candidatesRes, interviewersRes] = await Promise.all(
        [
          API.get("/interviews"),
          API.get("/candidates"),
          API.get("/users/interviewers"),
        ],
      );

      setInterviews(interviewsRes.data);
      setCandidates(candidatesRes.data);
      setInterviewers(interviewersRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setScheduleLoading(true);

    try {
      await API.post("/interviews/schedule", scheduleData);

      toast.success("Interview scheduled successfully!");
      setDialogOpen(false);

      setScheduleData({
        candidate_id: "",
        interviewer_id: "",
        preferred_date: "",
      });

      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to schedule interview",
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    try {
      await API.delete(`/interviews/${interviewId}`);

      toast.success("Interview deleted successfully");

      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete interview");
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await API.get("/oauth/calendar/login");
      window.open(response.data.authorization_url, "_blank");
      toast.info("Please authorize Google Calendar in the new window");
    } catch (error) {
      toast.error("Failed to initiate Google Calendar connection");
    }
  };

  const canSchedule = user?.role === "ADMIN" || user?.role === "HR";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Interviews</h1>
              <p className="text-gray-600 mt-1">View and schedule interviews</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={connectGoogleCalendar}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>

            {canSchedule && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
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
                        value={scheduleData.candidate_id}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            candidate_id: e.target.value,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="">Select candidate...</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.position}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Interviewer</Label>
                      <select
                        value={scheduleData.interviewer_id}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            interviewer_id: e.target.value,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="">Select interviewer...</option>
                        {interviewers.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.full_name} ({i.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Preferred Date</Label>
                      <input
                        type="date"
                        value={scheduleData.preferred_date}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            preferred_date: e.target.value,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      {scheduleLoading ? "Scheduling..." : "Schedule Interview"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : interviews.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p>No interviews scheduled</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Card
                key={interview.id}
                className="p-6 bg-white shadow rounded-xl"
              >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {interview.candidate_name}
                    </h3>

                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full font-medium">
                      {interview.status?.toUpperCase()}
                    </span>
                  </div>

                  {(user?.role === "ADMIN" || user?.role === "HR") && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteInterview(interview.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>

                {/* GRID DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-600">
                  {/* Interviewer */}
                  <div>
                    <p className="text-gray-400">Interviewer</p>
                    <p className="font-medium text-black">
                      {interview.interviewer_name}
                    </p>
                  </div>

                  {/* Scheduled At */}
                  <div>
                    <p className="text-gray-400">Scheduled At</p>
                    <p className="font-medium text-black">
                      {new Date(interview.scheduled_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="font-medium text-black">
                      {interview.duration_minutes} minutes
                    </p>
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <p className="text-gray-400">Meeting Link</p>

                    {interview.meeting_link ? (
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        Join Meeting <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
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
