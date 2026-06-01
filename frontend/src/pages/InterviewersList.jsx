import React, { useEffect, useState } from "react";
import API from "../api";

const InterviewersList = () => {
  const [interviewers, setInterviewers] = useState([]);

  const fetchInterviewers = async () => {
    try {
      const res = await API.get("/users/interviewers");
      setInterviewers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      fetchInterviewers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInterviewers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Interviewers List</h1>

      <div className="space-y-4">
        {interviewers.map((user) => (
          <div
            key={user.id}
            className="bg-white shadow-md rounded-xl p-5 flex justify-between items-center border"
          >
            <div>
              <p className="text-lg font-semibold">{user.full_name}</p>
              <p className="text-gray-500">{user.email}</p>
            </div>

            <button
              onClick={() => deleteUser(user.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewersList;
