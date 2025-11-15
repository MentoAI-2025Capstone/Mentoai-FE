// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';

// 님의 Google Client ID
const googleClientId = '889023267942-jakh3qc9vgh71modlijsgd1p6brojr0r.apps.googleusercontent.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 1. Google Provider 설정 */}
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* 2. Auth Provider 설정 */}
      <AuthProvider>
        {/* 3. Router 설정 */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);