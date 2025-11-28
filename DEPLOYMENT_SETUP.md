# Deployment Setup Guide

## Issue Fixed
The "unauthorized user" error was caused by cross-origin cookie issues between your frontend and backend domains.

## Changes Made

### Frontend Changes

1. **Updated `frontend/src/config/Api.jsx`**
   - Added environment variable support (`VITE_API_URL`)
   - Added request/response interceptors for better error handling
   - Automatic redirect to login on auth errors

2. **Updated `frontend/.env`**
   - Changed from `REACT_APP_` to `VITE_` prefix (for Vite)
   - Added `VITE_SOCKET_URL` for Socket.IO connection
   - You can easily switch between local and deployed URLs

3. **Updated `frontend/src/pages/Chat.jsx`**
   - Socket.IO now uses environment variable
   - Added better transport configuration

### Backend Changes

1. **Updated `backend/src/app.js`**
   - Improved CORS configuration with dynamic origin checking
   - Added support for PATCH method
   - Better error logging for blocked origins

2. **Updated `backend/src/controllers/auth.controller.js`**
   - Fixed cookie settings for cross-origin requests
   - Added `sameSite: 'none'` for production (required for cross-origin cookies)
   - Added `secure: true` for production (HTTPS only)
   - Set cookie expiration to 24 hours

3. **Updated `backend/src/sockets/socket.server.js`**
   - Improved Socket.IO CORS configuration
   - Added support for multiple origins
   - Better transport configuration

## Important: Add Your Frontend URL

You need to add your deployed frontend URL to the allowed origins in **TWO** places:

### 1. In `backend/src/app.js` (line ~12):
```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://veda-kx60.onrender.com",
  "https://YOUR-FRONTEND-URL.vercel.app",  // <-- ADD YOUR FRONTEND URL HERE
];
```

### 2. In `backend/src/sockets/socket.server.js` (line ~11):
```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://YOUR-FRONTEND-URL.vercel.app",  // <-- ADD YOUR FRONTEND URL HERE
];
```

## Environment Variables

### Frontend `.env` file:
```env
VITE_API_URL=https://veda-kx60.onrender.com/api
VITE_SOCKET_URL=https://veda-kx60.onrender.com

# For local development, use:
# VITE_API_URL=http://localhost:3000/api
# VITE_SOCKET_URL=http://localhost:3000
```

### Backend `.env` file (make sure you have):
```env
NODE_ENV=production
JWT_SECRET=your_jwt_secret
MONGO_URI=your_mongodb_uri
# ... other env variables
```

## Testing Steps

1. **Deploy Backend Changes**
   - Push the backend changes to Render
   - Make sure `NODE_ENV=production` is set in Render environment variables
   - Wait for deployment to complete

2. **Update Frontend Environment**
   - Add your frontend URL to the backend CORS configuration
   - Redeploy backend after adding the URL

3. **Deploy Frontend**
   - Make sure `.env` has the correct backend URLs
   - Deploy your frontend

4. **Test Authentication**
   - Try logging in from your deployed frontend
   - Check browser DevTools > Application > Cookies to see if the token cookie is set
   - The cookie should have `SameSite=None` and `Secure=true` attributes

## Troubleshooting

### If you still get "unauthorized user":

1. **Check Browser Console** for CORS errors
2. **Check Backend Logs** for "Blocked by CORS" messages
3. **Verify Cookie Settings**:
   - Open DevTools > Application > Cookies
   - Look for the "token" cookie
   - It should have `SameSite=None` and `Secure=true`

### If cookies aren't being set:

1. Make sure your frontend URL is in the `allowedOrigins` array
2. Make sure `NODE_ENV=production` is set on Render
3. Make sure your backend is using HTTPS (Render provides this automatically)

### For Local Development:

To test locally, update your `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

And make sure your backend is running on port 3000.

## Notes

- Cross-origin cookies require HTTPS in production
- The `sameSite: 'none'` setting is required for cross-origin cookies
- Make sure to restart your backend after making changes
- Clear browser cookies if you're testing and things aren't working
