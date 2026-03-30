import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import started from 'electron-squirrel-startup';
import * as schema from '../../backend/db/schema';
import { runMigrations } from '../../backend/db/migrate';
import { registerAllHandlers } from './ipc/registerAll';
import { seedIfEmpty } from '../../backend/db/seed';

if (started) {
  app.quit();
}

const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

function getAppDataDir(): string {
  const homeDir = app.getPath('home');
  const appDir = path.join(homeDir, '.personal-trainer');
  const fs = require('fs');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  return appDir;
}

function initializeDatabase() {
  const appDir = getAppDataDir();
  const dbPath = path.join(appDir, 'personal-trainer.db');
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  const db = drizzle(sqliteDb, { schema });
  runMigrations(db);
  return db;
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Only set strict CSP in production — in dev, Vite needs to load scripts
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
            ],
          },
        });
      },
    );
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

function initializeContentPacks() {
  const fs = require('fs');
  const appDir = getAppDataDir();
  const packsDir = path.join(appDir, 'content-packs');
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir, { recursive: true });
  }
  // Copy sample packs on first run
  const readmeFile = path.join(packsDir, 'README.txt');
  if (!fs.existsSync(readmeFile)) {
    fs.writeFileSync(
      readmeFile,
      'Place JSON content pack files here.\nUse "Import Content Pack" or "Import Lesson" in the app to load them.\nSee docs/lesson-generation-prompt.md for the JSON format.\n',
      'utf-8',
    );
  }
}

app.on('ready', () => {
  const db = initializeDatabase();
  seedIfEmpty(db);
  initializeContentPacks();
  registerAllHandlers(db);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
