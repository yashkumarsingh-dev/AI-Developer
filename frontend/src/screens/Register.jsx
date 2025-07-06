import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const Register = () => {
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
      .post("/users/register", {
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
          // Validation errors from backend (array)
          setError(err.response.data.errors.map((e) => e.msg || e).join(", "));
        } else if (
          err.response &&
          err.response.data &&
          err.response.data.error
        ) {
          // Custom error from backend
          setError(err.response.data.error);
        } else if (
          err.response &&
          err.response.data &&
          err.response.data.message
        ) {
          setError(err.response.data.message);
        } else {
          setError("Registration failed. Please try again.");
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
              d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0V17.25A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 017.5 17.25V10.5m9 0V10.5m0 0h-9"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
          Register
        </h2>
        <p className="text-blue-200 mb-6">
          Create your account to get started!
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
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg shadow-lg transition"
            disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          {error && (
            <div className="mt-4 text-red-400 text-center">{error}</div>
          )}
        </form>
        <p className="text-blue-200 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-400 hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
