// src/electron/main/main.ts
import { join } from "path";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { parseAdif } from "../../utils/adif";
import { QsoEntry } from "../../types/qso";
import { db, saveQso } from "../../utils/db";
import fs from "fs";

const isDev = process.env.npm_lifecycle_event === "app:dev" ? true : false;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
    },
  });

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools(); // Open the DevTools.
  } else {
    mainWindow.loadFile(join(__dirname, "../../index.html"));
  }

  mainWindow.maximize();
  // mainWindow.loadURL( //this doesn't work on macOS in build and preview mode
  //     isDev ?
  //     'http://localhost:3000' :
  //     join(__dirname, '../../index.html')
  // );
}

// Set up IPC handlers for database operations
ipcMain.handle("qso:add", async (_, qso) => {
  return await saveQso(qso);
});

ipcMain.handle("qso:getAllDocs", async () => {
  try {
    return await db.allDocs({ include_docs: true });
  } catch (error) {
    console.error("Failed to get all docs:", error);
    return { rows: [] };
  }
});

// ADIF Import handler
ipcMain.handle("adif:import", async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "ADIF Files", extensions: ["adi", "adif"] }],
    });

    if (filePaths.length === 0) return { imported: false };

    const content = fs.readFileSync(filePaths[0], "utf8");
    const records = parseAdif(content);

    // Convert ADIF records to QSO format and save to DB
    for (const record of records) {
      const qso: QsoEntry = {
        callsign: record.call,
        datetime: new Date(
          `${record.qso_date.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1-$2-$3"
          )}T${record.time_on.replace(/(\d{2})(\d{2})(\d{2})?/, "$1:$2")}Z`
        ).toISOString(),
        band: record.band,
        freqRx: parseFloat(record.freq) || 0,
        mode: record.mode,
        rstr: record.rst_rcvd || "59",
        rstt: record.rst_sent || "59",
        remark: record.comment || "--",
        notes: record.notes || "--",
      };

      await saveQso(qso);
    }

    return { imported: true, count: records.length };
  } catch (error) {
    console.error("ADIF import error:", error);
    return { imported: false, error };
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'

// Settings file path
const userSettingsPath = join(app.getPath('userData'), 'settings.json')
const defaultSettingsPath = join(app.getAppPath(), 'src/settings.json')

// Settings handlers
ipcMain.handle('settings:load', async () => {
  try {
    if (fs.existsSync(userSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'))
      return settings
    }
    // If no user settings exist, load and save defaults
    const defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'))
    fs.writeFileSync(userSettingsPath, JSON.stringify(defaultSettings, null, 2))
    return defaultSettings
  } catch (error) {
    console.error('Error loading settings:', error)
    return null
  }
})

ipcMain.handle('settings:save', async (_, settings) => {
  try {
    fs.writeFileSync(userSettingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
})
