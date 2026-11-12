const path = require('path');
require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '../../..');
const BACKEND_DIR = path.resolve(__dirname, '../..');

module.exports = {
  PORT: process.env.PORT || 5000,
  UPLOAD_DIR: path.join(BACKEND_DIR, 'uploads'),
  TEMP_DIR: path.join(BACKEND_DIR, 'temp'),
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  PYTHON_PATH: path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe'),
  PYTHON_CLI: path.join(ROOT_DIR, 'python_services', 'cli.py'),
};
