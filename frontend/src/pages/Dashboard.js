import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  LogOut,
  UserCog,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    // ✅ ADMIN + HR
    {
      icon: Users,
      label: "Candidates",
      path: "/candidates",
      roles: ["ADMIN", "HR"],
    },
    {
      icon: Calendar,
      label: "Interviews",
      path: "/interviews",
      roles: ["ADMIN", "HR", "INTERVIEWER"],
    },

    // ✅ ADMIN ONLY FEATURES
    {
      icon: UserCog,
      label: "HRs",
      path: "/hrs",
      roles: ["ADMIN"],
    },
    {
      icon: Users,
      label: "Interviewers",
      path: "/interviewers",
      roles: ["ADMIN"],
    },

    // ❌ REMOVED FROM ADMIN (only interviewer can see)
    {
      icon: FileText,
      label: "Submit Feedback",
      path: "/feedback",
      roles: ["HR", "INTERVIEWER"],
    },

    // ✅ ADD THIS → Rankings ONLY for HR
    {
      icon: TrendingUp, // or BarChart icon
      label: "Rankings",
      path: "/ranking",
      roles: ["HR"], // 👈 ONLY HR
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
      }}
    >
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Manrope", color: "#667eea" }}
              >
                Smart Interview Platform
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.full_name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-purple-100 rounded-full">
                <span className="text-sm font-semibold text-purple-700">
                  {user?.role}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "Manrope" }}
          >
            Dashboard
          </h2>
          <p className="text-gray-600">
            Manage interviews, candidates, and users
          </p>
        </div>

        {/* NAV CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredNavItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                onClick={() => navigate(item.path)}
                className="p-6 cursor-pointer bg-white transition-all hover:scale-105"
                style={{
                  border: "2px solid transparent",
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">{item.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Click to access
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* USER INFO */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-2xl font-bold mt-1">{user?.role}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold mt-1 truncate">
                  {user?.email}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Access Level</p>
                <p className="text-2xl font-bold mt-1">Full</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
