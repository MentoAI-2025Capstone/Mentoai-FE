import React, { useState } from "react";

function Auth() {
  const [mode, setMode] = useState("login"); // "login" 또는 "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = function (event) {
    event.preventDefault();

    if (mode === "login") {
      console.log("로그인 시도:", email, password);
      // 로그인 API 호출 자리
    } else {
      console.log("회원가입 시도:", email, password);
      // 회원가입 API 호출 자리
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "16px" }}>
      <h2>{mode === "login" ? "로그인" : "회원가입"}</h2>

      <div style={{ marginBottom: "12px" }}>
        <button
          type="button"
          onClick={function () {
            setMode("login");
          }}
          style={{
            marginRight: "8px",
            fontWeight: mode === "login" ? "bold" : "normal",
          }}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={function () {
            setMode("signup");
          }}
          style={{
            fontWeight: mode === "signup" ? "bold" : "normal",
          }}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "8px" }}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={function (e) {
                setEmail(e.target.value);
              }}
              style={{ display: "block", width: "100%", marginTop: "4px" }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={function (e) {
                setPassword(e.target.value);
              }}
              style={{ display: "block", width: "100%", marginTop: "4px" }}
              required
            />
          </label>
        </div>

        <button type="submit">
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
    </div>
  );
}

export default Auth;
