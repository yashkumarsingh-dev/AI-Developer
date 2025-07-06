import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/user.context";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    axios
      .post("/users/login", {
        email,
        password,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        setLoading(false);
        navigate("/");
      })
      .catch((err) => {
        setLoading(false);
        if (err.response && err.response.data && err.response.data.errors) {
          setError(err.response.data.errors.map((e) => e.msg || e).join(", "));
        } else if (
          err.response &&
          err.response.data &&
          err.response.data.error
        ) {
          setError(err.response.data.error);
        } else if (
          err.response &&
          err.response.data &&
          err.response.data.message
        ) {
          setError(err.response.data.message);
        } else {
          setError("Login failed. Please try again.");
        }
      });
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="backdrop-blur-lg bg-black/30 border border-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-md flex flex-col items-center">
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
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25v-.75z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
          Login
        </h2>
        <p className="text-blue-200 mb-6">
          Welcome back! Please login to your account.
        </p>
        <form onSubmit={submitHandler} className="w-full">
          <div className="mb-4">
            <label className="block text-blue-200 mb-2" htmlFor="email">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full p-3 rounded-xl bg-white/70 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 placeholder:text-blue-700 placeholder:opacity-90"
              placeholder="Enter your email"
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label className="block text-blue-200 mb-2" htmlFor="password">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full p-3 rounded-xl bg-white/70 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 placeholder:text-blue-700 placeholder:opacity-90"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg shadow-lg transition"
            disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <div className="mt-4 text-red-400 text-center">{error}</div>
          )}
        </form>
        <p className="text-blue-200 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:underline font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
