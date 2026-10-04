# yt-dlp Web App — Media Format Lab

A GitHub-ready web interface around the official yt-dlp project. It analyzes a supported media URL, displays available formats, and provides quality-based downloads for content the user is authorized to retrieve.

## Features
- URL analysis and metadata
- Available format table
- Best available quality selection
- Resolution selection up to 2160p when the source exposes it
- Audio-only option
- yt-dlp + FFmpeg merging
- Docker deployment
- Responsive frontend

## Run with Docker
```bash
docker compose up --build
```
Open `http://localhost:3000`.

## Run without Docker
Install Python 3.10+, Node.js 22+, FFmpeg and yt-dlp, then:
```bash
cd backend
npm install
node server.js
```

## Important
This project intentionally does not implement DRM circumvention, Premium-only access bypass, private-content access, or other access-control bypasses. Use it only for content you have permission to retrieve and in accordance with the source site's terms and applicable law.

## Upstream
Official yt-dlp repository: https://github.com/yt-dlp/yt-dlp

The container installs the current yt-dlp package at build time so the application can receive upstream fixes without copying the entire upstream repository into this project.
