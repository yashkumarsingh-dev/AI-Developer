// src/screens/Home.jsx
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);

  // Debug logs
  console.log("Current user:", user);
  console.log("Projects:", project);

  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();

    axios
      .post("/projects/create", {
        name: projectName,
      })
      .then((res) => {
        setIsModalOpen(false);
        setProjectName(""); // clear input
        // Refetch all projects to ensure UI is up-to-date
        axios
          .get("/projects/all")
          .then((res) => {
            setProject(
              Array.isArray(res.data.projects) ? res.data.projects : []
            );
          })
          .catch((err) => {
            setProject([]);
            console.error("Error fetching projects:", err);
          });
      })
      .catch((error) => {
        console.error("Error creating project:", error);
      });
  }

  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => {
        setProject(Array.isArray(res.data.projects) ? res.data.projects : []);
      })
      .catch((err) => {
        setProject([]); // fallback to empty array on error
        console.error("Error fetching projects:", err);
      });
  }, []);

  // Logout handler
  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  }

  // Delete project handler
  function handleDeleteProject(projectId) {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;
    axios
      .delete(`/projects/${projectId}`)
      .then(() => {
        // Refetch all projects to ensure UI is up-to-date
        axios
          .get("/projects/all")
          .then((res) => {
            setProject(
              Array.isArray(res.data.projects) ? res.data.projects : []
            );
          })
          .catch((err) => {
            setProject([]);
            console.error("Error fetching projects:", err);
          });
      })
      .catch((error) => {
        alert(error.response?.data?.error || "Failed to delete project.");
      });
  }

  // Convert string to camel case
  function toCamelCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logout button top-right */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-8 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-full shadow transition font-semibold z-50 flex items-center gap-2"
        title="Logout">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h12m0 0l-3-3m3 3l-3 3"
          />
        </svg>
        Logout
      </button>
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
            Welcome to AI Developer
          </h1>
          <p className="text-lg text-blue-200 mb-4">
            Manage your projects, collaborate, and build smarter with AI-powered
            tools.
          </p>
        </header>
        <div className="flex flex-col items-center justify-center w-full">
          <div className="projects grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 place-items-center w-full max-w-4xl mt-8">
            {project.length === 0 && (
              <div className="col-span-full text-center text-blue-100 text-xl opacity-80 animate-pulse">
                No projects yet. Click the + button to create your first
                project!
              </div>
            )}
            {Array.isArray(project) &&
              project
                .filter((proj) => proj && proj.name)
                .map((proj) => (
                  <div
                    key={proj._id}
                    className="relative cursor-pointer bg-black/30 hover:bg-black/40 border border-blue-200 rounded-xl shadow-md p-8 flex flex-col gap-2 transition-all duration-200 group min-w-[260px] max-w-xs w-full"
                    onClick={() => {
                      navigate(`/project`, {
                        state: { project: proj },
                      });
                    }}>
                    {/* Delete button, only for creator and if createdBy exists */}
                    {proj.createdBy &&
                      String(proj.createdBy) === String(user?._id) && (
                        <button
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow"
                          title="Delete Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(proj._id);
                          }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    <h2 className="font-bold text-lg text-blue-100 group-hover:text-white mb-1 truncate">
                      {proj.name.toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0A5.978 5.978 0 0112 15c1.306 0 2.518.418 3.644 1.143M7.356 16.143A5.978 5.978 0 0112 15m0 0a5.978 5.978 0 014.644 1.143"
                        />
                      </svg>
                      {proj.users?.length || 1} Collaborator
                      {(proj.users?.length || 1) > 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
          </div>
        </div>
        {/* Floating Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 z-50 border-4 border-white/20"
          title="New Project">
          <span className="sr-only">New Project</span>+
        </button>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col items-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-blue-600">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-blue-900">
              Create New Project
            </h2>
            <p className="text-gray-500 mb-6">
              Start a new journey with your team and AI tools.
            </p>
            <form onSubmit={createProject} className="w-full">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  className="mt-1 block w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-blue-900"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
