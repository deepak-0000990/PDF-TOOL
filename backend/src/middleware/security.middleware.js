const { URL } = require('url');

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS/Cloud metadata
  /^::1$/,
  /^fc00:/,
  /^fe80:/
];

function validateSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
    }
    const hostname = parsed.hostname;
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, error: 'Access to private and local addresses is prohibited.' };
      }
    }
    return { safe: true, url: parsed.href };
  } catch (err) {
    return { safe: false, error: 'Invalid URL provided.' };
  }
}

// Simple in-memory rate limiter per IP
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  let record = requestCounts.get(ip);
  if (!record || now - record.startTime > RATE_LIMIT_WINDOW) {
    record = { count: 1, startTime: now };
    requestCounts.set(ip, record);
    return next();
  }
  
  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please wait a moment before trying again.'
    });
  }
  
  next();
}

module.exports = {
  validateSafeUrl,
  rateLimiter
};
