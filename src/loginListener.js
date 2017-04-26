const electron = require('electron')

const ipc = electron.ipcRenderer

document.getElementById('login').addEventListener('click', _ => {
  ipc.send('do-login')
})