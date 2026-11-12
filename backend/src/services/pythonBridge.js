const { spawn } = require('child_process');
const config = require('../config');

function executePythonCommand(command, payload = {}) {
  return new Promise((resolve, reject) => {
    const pythonExe = config.PYTHON_PATH;
    const scriptPath = config.PYTHON_CLI;
    const args = [scriptPath, command, JSON.stringify(payload)];

    const process = spawn(pythonExe, args);
    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        let parsedErr;
        try {
          parsedErr = JSON.parse(stdoutData);
        } catch (_) {}
        const errorMsg = parsedErr?.error || stderrData || `Python script exited with code ${code}`;
        return reject(new Error(errorMsg));
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (err) {
        resolve({ raw: stdoutData });
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { executePythonCommand };
