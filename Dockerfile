FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package.json ./backend/
RUN cd backend && npm install
RUN python3 -m pip install --break-system-packages -U yt-dlp
COPY backend ./backend
COPY frontend ./frontend
RUN mkdir -p downloads
WORKDIR /app/backend
ENV PORT=3000 DOWNLOAD_DIR=/app/downloads
EXPOSE 3000
CMD ["node","server.js"]
