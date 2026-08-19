import { useState } from "react";
import {
  LogIn,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
} from "lucide-react";

import "./Login.css";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;

  user?: {
    user_id: number;
    public_user_id: string | null;
    role_id: number;
    role_name: string;
    name: string;
    email: string;
    must_change_password: boolean;
    temp_password: boolean;
    token_version: number;
    phone: string | null;
    department: string | null;
    profile_picture: string | null;
  };
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.token ||
        !data.user
      ) {
        setError(
          data.message ||
            "Invalid email or password. Please try again."
        );
        return;
      }

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");

      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUser");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userName");

      storage.setItem("authToken", data.token);
      storage.setItem(
        "currentUser",
        JSON.stringify(data.user)
      );
      storage.setItem("userRole", data.user.role_name);
      storage.setItem(
        "userId",
        String(data.user.user_id)
      );
      storage.setItem("userName", data.user.name);

      onLogin(data.user.email, password);
    } catch (error) {
      console.error("Login request failed:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-header">
          <div className="login-logo">
            <Lock size={30} />
          </div>

          <h1>Project Tracking</h1>
          <p>Workload Monitoring System</p>
        </div>

        <div className="login-card">

          <div className="login-card-title">
            <h2>Welcome back</h2>
            <p>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="login-field">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="login-input-wrapper">
                <Mail
                  size={18}
                  className="login-input-icon"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="admin@company.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <Lock
                  size={18}
                  className="login-input-icon"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="login-input"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={isLoading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="login-options">

              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  disabled={isLoading}
                />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-button"
                disabled={isLoading}
                onClick={() =>
                  setError(
                    "Forgot password functionality will be added later."
                  )
                }
              >
                Forgot password?
              </button>

            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>

          </form>

          <div className="login-info">
            User accounts are managed by the system administrator.
          </div>

        </div>

        <div className="login-footer">
          © 2026 Project Tracking System. All rights reserved.
        </div>

      </div>
    </div>
  );
}