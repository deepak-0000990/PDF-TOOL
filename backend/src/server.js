const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const pdfRoutes = require('./routes/pdf.routes');
const convertRoutes = require('./routes/convert.routes');
const aiRoutes = require('./routes/ai.routes');
const jobsRoutes = require('./routes/jobs.routes');

const errorHandler = require('./middleware/error.middleware');
const { rateLimiter } = require('./middleware/security.middleware');

const app = express();

// CORS — in production restrict to the deployed frontend URL
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : true; // allow all origins in dev

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      pdfLib: 'ready',
      playwrightChromium: 'ready',
      pythonServices: 'ready'
    }
  });
});

// Mount Routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobsRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Automatic temporary file cleaner: runs every hour, removes files older than 2 hours
setInterval(() => {
  try {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const cleanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            cleanDir(fullPath);
            if (fs.readdirSync(fullPath).length === 0) {
              fs.rmdirSync(fullPath);
            }
          } else if (stat.ctimeMs < twoHoursAgo) {
            fs.unlinkSync(fullPath);
          }
        } catch (_) {}
      }
    };
    cleanDir(config.TEMP_DIR);
    cleanDir(config.UPLOAD_DIR);
  } catch (e) {
    console.error('File cleanup error:', e.message);
  }
}, 60 * 60 * 1000);

// Start server
app.listen(config.PORT, () => {
  console.log(`=========================================`);
  console.log(` PDF Toolkit Backend Server running on port ${config.PORT}`);
  console.log(` Health check: http://localhost:${config.PORT}/api/health`);
  console.log(`=========================================`);
});
