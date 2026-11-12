const path = require('path');
require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '../../..');
const BACKEND_DIR = path.resolve(__dirname, '../..');

// Python executable: Docker uses /app/venv/bin/python, Windows dev uses local venv
const PYTHON_PATH = process.env.PYTHON_PATH
  || (process.platform === 'win32'
      ? path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe')
      : '/app/venv/bin/python3');

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  UPLOAD_DIR: path.join(BACKEND_DIR, 'uploads'),
  TEMP_DIR: path.join(BACKEND_DIR, 'temp'),
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  PYTHON_PATH,
  PYTHON_CLI: process.env.PYTHON_CLI
    || path.join(
        process.platform === 'win32' ? ROOT_DIR : '/app',
        'python_services', 'cli.py'
      ),
};
