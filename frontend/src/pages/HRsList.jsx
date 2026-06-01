import React, { useEffect, useState } from "react";
import API from "../api";

const HRsList = () => {
  const [hrs, setHrs] = useState([]);

  useEffect(() => {
    const fetchHRs = async () => {
      try {
        const res = await API.get("/users/hrs");
        console.log("HR DATA:", res.data); // DEBUG
        setHrs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHRs();
  }, []);

  const deleteHR = async (id) => {
    await API.delete(`/users/${id}`);
    setHrs((prev) => prev.filter((hr) => hr.id !== id));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">HR List</h1>

      <div className="space-y-4">
        {hrs && hrs.length > 0 ? (
          hrs.map((hr) => (
            <div
              key={hr.id}
              className="bg-white shadow-md rounded-xl p-5 flex justify-between items-center border"
            >
              <div>
                <p className="text-lg font-semibold">{hr.full_name}</p>
                <p className="text-gray-500">{hr.email}</p>
              </div>

              <button
                onClick={() => deleteHR(hr.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No HRs found</p>
        )}
      </div>
    </div>
  );
};

export default HRsList;
