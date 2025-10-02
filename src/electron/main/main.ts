// src/electron/main/main.ts
import { join } from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Socket } from 'net';
import { exec, spawn, ChildProcess } from 'child_process';
import { parseAdif } from '../../utils/adif';
import { QsoEntry } from '../../types/qso';
import { databaseService } from '../../services/DatabaseService';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { Extract } from 'unzipper';

interface FetchOptions {
  headers: {
    'User-Agent': string;
    Accept: string;
  };
  timeout: number;
  agent?: HttpsProxyAgent<string>;
}

const isDev = process.env.npm_lifecycle_event === 'app:dev' ? true : false;

// Rigctld process management
let rigctldProcess: ChildProcess | null = null;

// Check if a port is in use
function isPortInUse(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new Socket();

    socket.setTimeout(1000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// Start rigctld as background process
async function startRigctld(): Promise<void> {
  try {
    // Load settings to get default rig configuration
    let settings;
    try {
      if (fs.existsSync(userSettingsPath)) {
        settings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
      } else if (fs.existsSync(defaultSettingsPath)) {
        settings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load settings for rigctld startup:', error);
    }

    // Get rig configuration from settings
    const rigConfig = settings?.rig || {};
    const rigModel = rigConfig.rigModel || 1025; // Default to Yaesu FT-1000MP
    const rigDevice = rigConfig.device || ''; // Default device
    const rigPort = rigConfig.port || 4532; // Default port

    // Check if rigctld is already running on configured port
    const isRunning = await isPortInUse(rigPort);

    if (isRunning) {
      console.log(`Rigctld already running on port ${rigPort}`);
      return;
    }

    console.log(`Starting rigctld as background process with model ${rigModel}...`);

    // Build arguments based on configuration
    const args = ['-m', rigModel.toString()];

    // Add device parameter only if model is not 1 (dummy) and device is specified
    if (rigModel !== 1 && rigDevice) {
      args.push('-r', rigDevice);
    }

    // Add port if different from default
    if (rigPort !== 4532) {
      args.push('-t', rigPort.toString());
    }

    console.log('Rigctld command:', 'rigctld', args.join(' '));

    rigctldProcess = spawn('rigctld', args, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (rigctldProcess.stdout) {
      rigctldProcess.stdout.on('data', data => {
        console.log('rigctld stdout:', data.toString());
      });
    }

    if (rigctldProcess.stderr) {
      rigctldProcess.stderr.on('data', data => {
        console.log('rigctld stderr:', data.toString());
      });
    }

    rigctldProcess.on('error', error => {
      console.error('Failed to start rigctld:', error);
      rigctldProcess = null;
    });

    rigctldProcess.on('exit', (code, signal) => {
      console.log(`rigctld process exited with code ${code} and signal ${signal}`);
      rigctldProcess = null;
    });

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify it's running on the configured port
    const isNowRunning = await isPortInUse(rigPort);
    if (isNowRunning) {
      console.log(`Rigctld started successfully on port ${rigPort}`);
    } else {
      console.log('Rigctld may not have started properly');
    }
  } catch (error) {
    console.error('Error starting rigctld:', error);
  }
}

// Stop rigctld process
function stopRigctld(): void {
  if (rigctldProcess) {
    console.log('Stopping rigctld process...');
    rigctldProcess.kill('SIGTERM');
    rigctldProcess = null;
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Open the DevTools.
  } else {
    mainWindow.loadFile(join(__dirname, '../../../index.html'));
  }

  mainWindow.maximize();
  // mainWindow.loadURL( //this doesn't work on macOS in build and preview mode
  //     isDev ?
  //     'http://localhost:3000' :
  //     join(__dirname, '../../index.html')
  // );
}

// Set up IPC handlers for database operations
ipcMain.handle('qso:add', async (_, qso) => {
  return await databaseService.saveQso(qso);
});

ipcMain.handle('qso:getAllDocs', async () => {
  try {
    const qsos = await databaseService.getAllQsos();
    return {
      rows: qsos.map(doc => ({
        doc,
        id: doc._id,
        value: { rev: doc._rev },
      })),
    };
  } catch (error) {
    console.error('Failed to get all docs:', error);
    return { rows: [] };
  }
});

// Add QSO update handler
ipcMain.handle('qso:update', async (_, qso) => {
  try {
    return await databaseService.updateQso(qso);
  } catch (error) {
    console.error('Failed to update QSO:', error);
    throw error;
  }
});

// ADIF Import handler
ipcMain.handle('adif:import', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'ADIF Files', extensions: ['adi', 'adif'] }],
    });

    if (filePaths.length === 0) return { imported: false };

    const content = fs.readFileSync(filePaths[0], 'utf8');
    const records = parseAdif(content);

    // Convert ADIF records to QSO format and save to DB
    for (const record of records) {
      const qso: QsoEntry = {
        callsign: record.call,
        datetime: new Date(
          `${record.qso_date.replace(
            /(\d{4})(\d{2})(\d{2})/,
            '$1-$2-$3'
          )}T${record.time_on.replace(/(\d{2})(\d{2})(\d{2})?/, '$1:$2')}Z`
        ).toISOString(),
        band: record.band,
        freqRx: parseFloat(record.freq) || 0,
        mode: record.mode,
        rstr: record.rst_rcvd || '59',
        rstt: record.rst_sent || '59',
        remark: record.comment || '--',
        notes: record.notes || '--',
      };

      await databaseService.saveQso(qso);
    }

    return { imported: true, count: records.length };
  } catch (error) {
    console.error('ADIF import error:', error);
    return { imported: false, error };
  }
});

// ADIF file selection handler
ipcMain.handle('adif:selectFile', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'ADIF Files', extensions: ['adi', 'adif'] }],
    });

    if (filePaths.length === 0) {
      return { success: false };
    }

    return { success: true, filePath: filePaths[0] };
  } catch (error) {
    console.error('ADIF file selection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// ADIF file parsing handler
ipcMain.handle('adif:parseFile', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseAdif(content);

    return { success: true, totalCount: records.length };
  } catch (error) {
    console.error('ADIF file parsing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// ADIF import with progress handler
ipcMain.handle('adif:importWithProgress', async (event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseAdif(content);
    let importedCount = 0;

    // Convert ADIF records to QSO format and save to DB with progress updates
    for (const record of records) {
      const qso: QsoEntry = {
        callsign: record.call,
        datetime: new Date(
          `${record.qso_date.replace(
            /(\d{4})(\d{2})(\d{2})/,
            '$1-$2-$3'
          )}T${record.time_on.replace(/(\d{2})(\d{2})(\d{2})?/, '$1:$2')}Z`
        ).toISOString(),
        band: record.band,
        freqRx: parseFloat(record.freq) || 0,
        mode: record.mode,
        rstr: record.rst_rcvd || '59',
        rstt: record.rst_sent || '59',
        remark: record.comment || '--',
        notes: record.notes || '--',
      };

      await databaseService.saveQso(qso);
      importedCount++;

      // Send progress update every 10 records or on the last record
      if (importedCount % 10 === 0 || importedCount === records.length) {
        event.sender.send('adif:importProgress', { imported: importedCount });
      }
    }

    return { success: true, count: importedCount };
  } catch (error) {
    console.error('ADIF import with progress error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Propagation Data API handler
ipcMain.handle('fetchPropagationData', async () => {
  try {
    const settings = loadSettings();
    const baseUrl = settings?.apis?.wwv?.baseUrl || 'https://dxheat.com/wwv';
    const url = `${baseUrl}/source/`;

    // Check for proxy environment variables
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    const fetchOptions: FetchOptions = {
      headers: {
        'User-Agent': 'HamLogger/1.0',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout
    };

    // Use proxy agent if proxy is configured
    if (proxyUrl) {
      fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
      console.log(`Using proxy: ${proxyUrl}`);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Propagation Data API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Weather API handler
ipcMain.handle('fetchWeather', async (event, lat: number, lon: number) => {
  try {
    const settings = loadSettings();
    const baseUrl = settings?.apis?.openMeteo?.baseUrl || 'https://api.open-meteo.com/v1';
    const url = `${baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    // Check for proxy environment variables
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    const fetchOptions: FetchOptions = {
      headers: {
        'User-Agent': 'HamLogger/1.0',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout
    };

    // Use proxy agent if proxy is configured
    if (proxyUrl) {
      fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
      console.log(`Using proxy: ${proxyUrl}`);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// DX Spots API handler
ipcMain.handle('fetchDxSpots', async (event, params: string) => {
  try {
    const settings = loadSettings();
    const baseUrl = settings?.apis?.dxheat?.baseUrl || 'https://dxheat.com';
    const url = `${baseUrl}/source/spots/?${params}`;

    // Check for proxy environment variables
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    const fetchOptions: FetchOptions = {
      headers: {
        'User-Agent': 'HamLogger/1.0',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout
    };

    // Use proxy agent if proxy is configured
    if (proxyUrl) {
      fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
      console.log(`Using proxy: ${proxyUrl}`);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('DX Spots API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Try to start rigctld before creating the window
  await startRigctld();

  createWindow();
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Stop rigctld when app is closing
  stopRigctld();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit
app.on('before-quit', () => {
  stopRigctld();
});

// Rigctld connection management
let rigctldSocket: Socket | null = null;

// Rigctld handlers
ipcMain.handle('rigctld:connect', async (_, host: string, port: number) => {
  try {
    // Close existing connection if any
    if (rigctldSocket) {
      rigctldSocket.destroy();
      rigctldSocket = null;
    }

    return new Promise(resolve => {
      rigctldSocket = new Socket();

      rigctldSocket.setTimeout(5000);

      rigctldSocket.on('connect', () => {
        console.log(`Connected to rigctld at ${host}:${port}`);
        resolve({ success: true, data: { connected: true } });
      });

      rigctldSocket.on('error', error => {
        console.error('Rigctld connection error:', error);
        rigctldSocket = null;
        resolve({ success: false, error: error.message });
      });

      rigctldSocket.on('timeout', () => {
        console.error('Rigctld connection timeout');
        rigctldSocket?.destroy();
        rigctldSocket = null;
        resolve({ success: false, error: 'Connection timeout' });
      });

      rigctldSocket.connect(port, host);
    });
  } catch (error) {
    console.error('Rigctld connect error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('rigctld:disconnect', async () => {
  try {
    if (rigctldSocket) {
      rigctldSocket.destroy();
      rigctldSocket = null;
      console.log('Disconnected from rigctld');
    }
    return { success: true, data: { connected: false } };
  } catch (error) {
    console.error('Rigctld disconnect error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('rigctld:command', async (_, command: string) => {
  try {
    if (!rigctldSocket) {
      return { success: false, error: 'Not connected to rigctld' };
    }

    return new Promise(resolve => {
      let responseData = '';

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Command timeout' });
      }, 5000);

      const onData = (data: Buffer) => {
        responseData += data.toString();

        // Extended Response Protocol: look for RPRT at the end
        if (responseData.includes('RPRT ')) {
          clearTimeout(timeout);
          rigctldSocket?.off('data', onData);

          const lines = responseData.trim().split('\n');

          // Find the RPRT line (should be last)
          const rprtLine = lines.find(line => line.startsWith('RPRT '));
          if (!rprtLine) {
            resolve({ success: false, error: 'Invalid response format' });
            return;
          }

          const errorCode = parseInt(rprtLine.split(' ')[1]);
          if (errorCode !== 0) {
            resolve({ success: false, error: `Rigctld error code: ${errorCode}` });
            return;
          }

          // Parse Extended Response Protocol format
          const dataLines = lines.filter(
            line => !line.startsWith('RPRT ') && line.includes(':') && !line.endsWith(':')
          );

          if (dataLines.length > 0) {
            // Extract values from "Key: Value" format
            const values = dataLines.map(line => {
              const colonIndex = line.indexOf(': ');
              return colonIndex !== -1 ? line.substring(colonIndex + 2) : line;
            });
            resolve({ success: true, data: values });
          } else {
            // For set commands, no data is returned
            resolve({ success: true, data: null });
          }
        }
      };

      rigctldSocket?.on('data', onData);
      // Use Extended Response Protocol with '+' prefix for newline separation
      rigctldSocket?.write('+' + command + '\n');
    });
  } catch (error) {
    console.error('Rigctld command error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('rigctld:capabilities', async () => {
  try {
    if (!rigctldSocket) {
      return { success: false, error: 'Not connected to rigctld' };
    }

    return new Promise(resolve => {
      let responseData = '';

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Capabilities timeout' });
      }, 10000);

      const onData = (data: Buffer) => {
        responseData += data.toString();

        // Extended Response Protocol: look for RPRT at the end
        if (responseData.includes('RPRT ')) {
          clearTimeout(timeout);
          rigctldSocket?.off('data', onData);

          const lines = responseData.trim().split('\n');
          const rprtIndex = lines.findIndex(line => line.startsWith('RPRT '));

          if (rprtIndex > 0) {
            // Skip the command echo line and get capability data
            const capabilityLines = lines.slice(1, rprtIndex);
            resolve({ success: true, data: capabilityLines });
          } else {
            resolve({ success: false, error: 'Invalid capabilities response' });
          }
        }
      };

      rigctldSocket?.on('data', onData);
      // Use Extended Response Protocol with '+' prefix
      rigctldSocket?.write('+dump_caps\n');
    });
  } catch (error) {
    console.error('Rigctld capabilities error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Execute command handler
ipcMain.handle('execute:command', async (_, command: string) => {
  try {
    return new Promise(resolve => {
      exec(command, { timeout: 10000 }, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          console.error('Command execution error:', error);
          resolve({ success: false, error: error.message });
          return;
        }

        if (stderr) {
          console.warn('Command stderr:', stderr);
        }

        resolve({ success: true, data: stdout });
      });
    });
  } catch (error) {
    console.error('Execute command error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Check if rigctld is in PATH
ipcMain.handle('hamlib:checkRigctldInPath', async () => {
  try {
    return new Promise(resolve => {
      exec('where rigctld', { timeout: 5000 }, (error: Error | null, stdout: string) => {
        if (error) {
          resolve({ success: false, inPath: false });
          return;
        }
        resolve({ success: true, inPath: true, path: stdout.trim() });
      });
    });
  } catch (error) {
    console.error('Error checking rigctld in PATH:', error);
    return { success: false, inPath: false };
  }
});

// Download and install Hamlib for Windows
ipcMain.handle('hamlib:downloadAndInstall', async event => {
  try {
    const hamlibUrl =
      'https://github.com/Hamlib/Hamlib/releases/download/4.6.5/hamlib-w64-4.6.5.zip';
    const userDataPath = app.getPath('userData');
    const hamlibDir = join(userDataPath, 'hamlib');
    const zipPath = join(userDataPath, 'hamlib-w64-4.6.5.zip');
    const hamlibBinPath = join(hamlibDir, 'bin');

    // Create hamlib directory if it doesn't exist
    if (!fs.existsSync(hamlibDir)) {
      fs.mkdirSync(hamlibDir, { recursive: true });
    }

    // Check if already installed
    if (fs.existsSync(join(hamlibBinPath, 'rigctld.exe'))) {
      // Add to PATH if not already there
      await addToSystemPath(hamlibBinPath);
      return { success: true, message: 'Hamlib already installed', path: hamlibBinPath };
    }

    // Download progress callback
    const sendProgress = (progress: number) => {
      event.sender.send('hamlib:downloadProgress', { progress });
    };

    // Download the zip file
    console.log('Downloading Hamlib...');
    sendProgress(0);

    const response = await fetch(hamlibUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') || '0');
    let downloadedSize = 0;

    const fileStream = createWriteStream(zipPath);
    const pipelineAsync = promisify(pipeline);

    // Track download progress
    response.body?.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      if (totalSize > 0) {
        const progress = Math.round((downloadedSize / totalSize) * 50); // 50% for download
        sendProgress(progress);
      }
    });

    await pipelineAsync(response.body!, fileStream);
    console.log('Download completed');

    // Extract the zip file
    console.log('Extracting Hamlib...');
    sendProgress(60);

    const tempExtractDir = join(userDataPath, 'hamlib_temp');
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(Extract({ path: tempExtractDir }))
        .on('close', () => {
          console.log('Extraction completed');
          sendProgress(70);
          resolve();
        })
        .on('error', reject);
    });

    // Find the extracted folder (should be something like hamlib-w64-4.6.5)
    const extractedContents = fs.readdirSync(tempExtractDir);
    const hamlibFolder = extractedContents.find(item => {
      const itemPath = join(tempExtractDir, item);
      return fs.statSync(itemPath).isDirectory() && item.startsWith('hamlib');
    });

    if (!hamlibFolder) {
      throw new Error('Hamlib folder not found in extracted archive');
    }

    const extractedHamlibPath = join(tempExtractDir, hamlibFolder);
    console.log('Found Hamlib folder:', hamlibFolder);

    // Move contents from extracted folder to final destination
    const moveContents = (src: string, dest: string) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = join(src, item);
        const destPath = join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
          moveContents(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    moveContents(extractedHamlibPath, hamlibDir);
    sendProgress(80);

    // Clean up temporary extraction directory and zip file
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);

    // Verify installation
    if (!fs.existsSync(join(hamlibBinPath, 'rigctld.exe'))) {
      throw new Error('rigctld.exe not found after extraction');
    }

    // Add to system PATH
    await addToSystemPath(hamlibBinPath);
    sendProgress(100);

    console.log('Hamlib installation completed');
    return { success: true, message: 'Hamlib installed successfully', path: hamlibBinPath };
  } catch (error) {
    console.error('Hamlib installation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Add directory to system PATH on Windows
async function addToSystemPath(dirPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use PowerShell with elevated privileges to add to system PATH
    const psCommand = `
      try {
        $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
        if ($currentPath -notlike '*${dirPath.replace(/\\/g, '\\\\')}*') {
          $newPath = $currentPath + ';${dirPath.replace(/\\/g, '\\\\')}'
          [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
          Write-Output 'PATH updated successfully'
        } else {
          Write-Output 'PATH already contains directory'
        }
      } catch {
        Write-Error 'Failed to update PATH: Access denied or other error'
        exit 1
      }
    `;

    // Try to run PowerShell with elevated privileges
    const elevatedCommand = `powershell -Command "Start-Process powershell -ArgumentList '-Command \\"${psCommand.replace(/"/g, '\\"')}\\"' -Verb RunAs -Wait"`;

    exec(elevatedCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error adding to PATH with elevation:', error);

        // Fallback: try without elevation (user PATH only)
        const fallbackCommand = `powershell -Command "${psCommand}"`;
        exec(fallbackCommand, (fallbackError, fallbackStdout, fallbackStderr) => {
          if (fallbackError) {
            console.error('Fallback PATH update also failed:', fallbackError);
            reject(
              new Error(
                'Failed to update PATH. Please add the Hamlib bin directory to your PATH manually.'
              )
            );
            return;
          }

          if (fallbackStderr) {
            console.warn('Fallback PATH update stderr:', fallbackStderr);
          }

          console.log('Fallback PATH update result:', fallbackStdout);
          resolve();
        });
        return;
      }

      if (stderr) {
        console.warn('PATH update stderr:', stderr);
      }

      console.log('PATH update result:', stdout);
      resolve();
    });
  });
}

// Settings file path
const userSettingsPath = join(app.getPath('userData'), 'settings.json');
const defaultSettingsPath = join(app.getAppPath(), 'src/settings.json');

// Load settings helper function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadSettings(): any {
  try {
    if (fs.existsSync(userSettingsPath)) {
      return JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
    }
    return JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));
  } catch (error) {
    console.debug('Error loading settings:', error);
    return null;
  }
}

// Settings handlers
ipcMain.handle('settings:load', async () => {
  try {
    if (fs.existsSync(userSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
      return settings;
    }
    // Return null if no user settings exist - this will trigger setup wizard
    return null;
  } catch (error) {
    console.debug('Error loading settings:', error);
    return null;
  }
});

ipcMain.handle('settings:save', async (_, settings: Record<string, unknown>) => {
  try {
    fs.writeFileSync(userSettingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// Restart rigctld with new settings
async function restartRigctld(): Promise<void> {
  console.log('Restarting rigctld...');
  stopRigctld();

  // Wait a moment for the process to fully stop
  await new Promise(resolve => setTimeout(resolve, 1000));

  await startRigctld();
}

// Rigctld restart handler
ipcMain.handle('rigctld:restart', async () => {
  try {
    await restartRigctld();
    return { success: true };
  } catch (error) {
    console.error('Error restarting rigctld:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
