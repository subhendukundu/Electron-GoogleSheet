const electron = require('electron');
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const {session} = require('electron');
const fetch = require('node-fetch');
var async = require('async');
const windows = []
const qs = require('qs');
const axios = require('axios');
const {parse} = require('url');

var SheetsHelper = require('./sheets');

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/userinfo/v2/me'
const GOOGLE_REDIRECT_URI = 'http://localhost'
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID'
app.on('ready', _ => {
  
    let win = new BrowserWindow({
      height: 800,
      width: 1400
    })
    win.loadURL(`file://${__dirname}/login.html`);

    function useJive () {
       return new Promise((resolve, reject) => { 
        const authWindow = new BrowserWindow({
          width: 500,
          height: 600,
          show: true,
        })

        const urlParams = {
          response_type: 'code',
          redirect_uri: GOOGLE_REDIRECT_URI,
          client_id: GOOGLE_CLIENT_ID,
          scope: 'profile email openid https://spreadsheets.google.com/feeds',
        }
        const authUrl = `${GOOGLE_AUTHORIZATION_URL}?${qs.stringify(urlParams)}`;
        function handleNavigation (url) {
          const query = parse(url, true).query
          if (query) {
            if (query.error) {
              reject(new Error(`There was an error: ${query.error}`))
            } else if (query.code) {
              // Login is complete
              authWindow.removeAllListeners('closed')
              setImmediate(() => authWindow.close());
              resolve(query.code);
              // This is the authorization code we need to request tokens
              resolve(query.code);
            }
          }
        }
        authWindow.on('closed', () => {
          // TODO: Handle this smoothly
          throw new Error('Auth window was closed by user')
        })

        authWindow.webContents.on('will-navigate', (event, url) => {
          handleNavigation(url)
        })

        authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
          handleNavigation(newUrl)
        })
        authWindow.loadURL(authUrl);

    });
    };
    function fetchAccessTokens(code) {
      return axios.post(GOOGLE_TOKEN_URL, qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    }
    function fetchUserDetails(accessToken) {
      return axios.get(GOOGLE_PROFILE_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    }
    win.openDevTools();
    win.on('closed', _ => {
      win = null
    })
    windows.push(win);
    let tokens = "";
    ipc.on('do-login', (req, res) => {
        var data = useJive().then(function (code) {
           fetchAccessTokens(code).then(function (tokenData) {
              var accessToken = tokenData.data.access_token;
              fetchUserDetails(accessToken).then(function (userData) {
              var userDetails = userData.data;
              tokens = accessToken;
              win.loadURL(`file://${__dirname}/user.html`);
              const cookie = {url: 'https://eventdesktop.com', name: 'user', value:userDetails.name}
                session.defaultSession.cookies.set(cookie, (error) => {
                  if (error) console.error(error)
              });
           })
           })

        }, function (e) {
           console.error(e)
        })
    });
    ipc.on('got-sheetData', (req, res) => {
      console.log(`${tokens} this the token`);
      const accessToken = tokens;
      
      let helper = new SheetsHelper(accessToken);
      const spreadsheetId= res.spreadsheetId;
      const sheetId = res.sheetId;      
      var orders = 
              [ { userEnteredValue: { stringValue: '8' } },
                      { userEnteredValue: { stringValue: res.firstName } },
                      { userEnteredValue: { stringValue: res.lastName } },
                      { userEnteredValue: { numberValue: res.phoneNumber } },
                      { userEnteredValue: { numberValue: res.emailID } },
                      { userEnteredValue: { stringValue: res.age }}]

                    ;
        helper.sync(spreadsheetId, sheetId, orders, function(err) {
          if (err) {
            return next(err);
          }
          console.log(orders.length);
        });
    });


})

