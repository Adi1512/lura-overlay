const { app, BrowserWindow, ipcMain, screen } = require('electron')

let win
let resizeAnchor = null
let currentBaseH = 220   // updated by fit-content messages from renderer
const BASE_W_DEFAULT = 360

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 360,
    height: 220,
    minWidth: 100,
    minHeight: 60,
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

  // win.webContents.openDevTools({ mode: 'detach' })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setMinimumSize(100, 60)

  win.webContents.on('did-finish-load', () => {
    const { width, height } = win.getContentBounds()
    win.webContents.send('window-size', [width, height])
  })
})

// ── Fit window to content height (called by renderer after layout changes) ──
ipcMain.on('fit-content', (e, { baseH }) => {
  if (baseH === currentBaseH) return
  currentBaseH = baseH

  // Keep the width, adjust height to match the new aspect ratio at current scale
  const { x, y, width } = win.getContentBounds()
  const scale = width / BASE_W_DEFAULT
  const newH = Math.round(baseH * scale)
  win.setContentBounds({ x, y, width, height: newH })
})

// ── Fit window width to current layout (e.g. narrower for clock view) ──
ipcMain.on('fit-width', (e, { baseW }) => {
  const { x, y, width, height } = win.getContentBounds()
  const currentScale = width / BASE_W_DEFAULT
  // Preserve the visual scale — just change the width's base
  const newW = Math.round(baseW * currentScale)
  const newH = Math.round(currentBaseH * currentScale)
  win.setContentBounds({ x, y, width: newW, height: newH })
  win.webContents.send('window-size', [newW, newH])
})

// ── Scale-based resize (uses ContentBounds for DPI-consistent sizing) ────
ipcMain.on('resize-start', (e, { minScale, maxScale, baseW }) => {
  const cursor = screen.getCursorScreenPoint()
  const { width } = win.getContentBounds()
  const startScale = width / baseW
  resizeAnchor = {
    cursorX: cursor.x,
    cursorY: cursor.y,
    startScale,
    minScale, maxScale, baseW
  }
})

ipcMain.on('resize-move', () => {
  if (!resizeAnchor) return
  const { cursorX, cursorY, startScale, minScale, maxScale, baseW } = resizeAnchor
  const cursor = screen.getCursorScreenPoint()

  const dx = cursor.x - cursorX
  const dy = cursor.y - cursorY
  const diagonalDelta = (dx + dy) / 2

  let scale = startScale + diagonalDelta / baseW
  scale = Math.max(minScale, Math.min(maxScale, scale))

  const newW = Math.round(baseW * scale)
  const newH = Math.round(currentBaseH * scale)

  const current = win.getContentBounds()
  win.setContentBounds({ x: current.x, y: current.y, width: newW, height: newH })
  win.webContents.send('window-size', [newW, newH])
})

ipcMain.on('resize-end', () => { resizeAnchor = null })

ipcMain.on('set-focusable', (event, focusable) => {
  win.setFocusable(focusable)
  if (focusable) win.focus()
})

ipcMain.on('close-app', () => app.quit())