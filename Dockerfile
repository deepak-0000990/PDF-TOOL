# Production Dockerfile for PDF Toolkit Backend
FROM node:20-bookworm-slim

# Install system dependencies for Playwright Chromium, Python, and PDF utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ghostscript \
    qpdf \
    poppler-utils \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python document processing libraries
RUN pip install --no-cache-dir \
    pymupdf \
    pdfplumber \
    python-docx \
    openpyxl \
    python-pptx \
    reportlab \
    pikepdf \
    pillow \
    img2pdf \
    pymupdf4llm

# Copy backend files
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy remaining project files
WORKDIR /app
COPY python_services/ ./python_services/
COPY backend/ ./backend/

WORKDIR /app/backend
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
