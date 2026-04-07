const { app, BrowserWindow, ipcMain } = require('electron')

let win

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 360,
    height: 220,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  win.setAlwaysOnTop(true, 'screen-saver')
})

ipcMain.on('resize-window', (e, { width, height }) => {
  win.setSize(width, height)
})

ipcMain.on('move-window', (e, { x, y }) => {
  const [wx, wy] = win.getPosition()
  win.setPosition(wx + x, wy + y)
})

ipcMain.on('close-app', () => app.quit())