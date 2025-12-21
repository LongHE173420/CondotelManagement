import React, { useState } from "react";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_URL =
    process.env.REACT_APP_API_URL || "https://localhost:7216/api/Auth";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/forgot-password`, { email });
      setMessage("✅ A reset link has been sent to your email!");
    } catch {
      setError("⚠️ Failed to send email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <Helmet>
        <title>Forgot Password</title>
      </Helmet>

      <h2 className="my-20 text-center text-3xl md:text-5xl font-semibold">
        Forgot Password
      </h2>

      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          {message && (
            <p className="text-green-600 text-center text-sm">{message}</p>
          )}

          <ButtonPrimary type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </ButtonPrimary>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600">
              ← Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
