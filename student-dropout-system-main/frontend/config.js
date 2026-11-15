/**
 * EduGuard - Student Dropout Prediction System
 * Universal Environment & API Configuration
 * Supports Local Development, Static Preview, and Cloud Hosting (Render, Railway, Vercel, Docker)
 */
(function (global) {
  'use strict';

  var isBrowser = typeof window !== 'undefined';
  var isHttp = isBrowser && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  var hostname = isBrowser ? window.location.hostname : '';
  var port = isBrowser ? window.location.port : '';

  // Default fallback for file:// or external frontend servers (port 5500, etc.)
  var apiBase = 'http://localhost:3000/api';

  // 1. If served directly from Express backend (port 3000 or production port)
  if (isHttp && (port === '3000' || port === '80' || port === '443' || port === '')) {
    apiBase = '/api';
  }
  // 2. If hosted on a cloud domain (e.g. *.onrender.com, *.railway.app, *.app, etc.)
  else if (isHttp && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    apiBase = window.location.origin + '/api';
  }

  global.APP_CONFIG = {
    API_BASE: apiBase,
    ML_API_FALLBACK: 'http://127.0.0.1:5000'
  };

  // Shortcut for legacy scripts
  global.API_BASE_URL = apiBase;

})(typeof window !== 'undefined' ? window : this);
