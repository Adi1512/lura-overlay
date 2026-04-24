const { app, BrowserWindow, ipcMain } = require('electron')

let win

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 360,
    height: 220,
    useContentSize: true,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  win.setAlwaysOnTop(true, 'screen-saver')
  
  win.webContents.on('did-finish-load', () => {
  win.webContents.send('window-size', win.getSize())
})
})

ipcMain.on('resize-window', (e, { width, height }) => {
  win.setSize(width, height)
  win.webContents.send('window-size', win.getSize())
})

ipcMain.on('move-window', (e, { x, y }) => {
  const [wx, wy] = win.getPosition()
  win.setPosition(wx + x, wy + y)
})

ipcMain.on('set-focusable', (event, focusable) => {
  win.setFocusable(focusable)

  if (focusable) {
    win.focus()
  }
})

ipcMain.on('get-window-size', (e) => {
  e.reply('window-size', win.getSize())
})

ipcMain.on('close-app', () => app.quit())