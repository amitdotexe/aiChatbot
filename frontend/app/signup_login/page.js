"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/axios";
import s from "./AuthPage.module.css";

function BrandIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle
        cx="18"
        cy="18"
        r="14"
        stroke="var(--green-primary)"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        strokeLinecap="round"
        className={s.brandIcon}
      />
      <circle
        cx="18"
        cy="18"
        r="3.5"
        fill="var(--green-primary)"
        opacity="0.9"
      />
      <circle
        cx="18"
        cy="18"
        r="7"
        stroke="var(--green-primary)"
        strokeWidth="0.8"
        opacity="0.3"
      />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login({ email: form.email, password: form.password });
        const token = res.data.token;
        if (!token) {
          setError("No token received from server");
          return;
        }
        localStorage.setItem("token", token);
      } else {
        const res = await register({
          fullName: { firstName: form.firstName, lastName: form.lastName },
          email: form.email,
          password: form.password,
        });
        const token = res.data.token;
        if (!token) {
          setError("No token received from server");
          return;
        }
        localStorage.setItem("token", token);
      }

      const saved = localStorage.getItem("token");
      if (!saved) {
        setError("Failed to save token, please try again");
        return;
      }

      router.push("/chat");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (mode === "login" ? "Sign in failed" : "Registration failed"),
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setForm({ firstName: "", lastName: "", email: "", password: "" });
  }

  const isLogin = mode === "login";

  return (
    <div className={s.page}>
      <div className={`${s.blob} ${s.blob1}`} />
      <div className={`${s.blob} ${s.blob2}`} />

      <div className={s.card}>
        <div className={s.cardSheen} />

        <div className={s.cardBody}>
          <div className={s.brand}>
            <BrandIcon />
          </div>

          <h1 className={s.heading}>
            {isLogin ? "Sign In" : "Create Account"}
          </h1>
          <p className={s.subheading}>
            {isLogin
              ? "Please enter your details to sign in."
              : "Fill in the details to get started."}
          </p>

          <form onSubmit={handleSubmit} className={s.form}>
            {!isLogin && (
              <div className={s.row2}>
                <div className={s.field}>
                  <input
                    placeholder="First name"
                    value={form.firstName}
                    onChange={update("firstName")}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className={s.field}>
                  <input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={update("lastName")}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            <div className={s.field}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="email"
              />
            </div>

            <div className={s.field}>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={update("password")}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error && <div className={s.error}>{error}</div>}

            <button type="submit" className={s.btnPrimary} disabled={loading}>
              {loading ? (
                <span className={s.spinner} />
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>

            <div className={s.divider}>
              <span>OR</span>
            </div>

            <button
              type="button"
              className={s.btnSecondary}
              onClick={() => switchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? (
                <span>
                  Don&apos;t have an account? <strong>Sign up</strong>
                </span>
              ) : (
                <span>
                  Already have an account? <strong>Sign in</strong>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
