var google = require('googleapis');
var googleAuth = require('google-auth-library');
var util = require('util');

var SheetsHelper = function(accessToken) {
  var authClient = new googleAuth();
  var auth = new authClient.OAuth2();
  auth.credentials = {
    access_token: accessToken
  };
  this.service = google.sheets({version: 'v4', auth: auth});
};

module.exports = SheetsHelper;
var COLUMNS = [
  { field: 'id', header: 'ID' },
  { field: 'customerName', header: 'First name'},
  { field: 'productCode', header: 'Last name' },
  { field: 'unitsOrdered', header: 'Phone number' },
  { field: 'unitPrice', header: 'Email ID' },
  { field: 'status', header: 'Age'}
];
SheetsHelper.prototype.sync = function(spreadsheetId, sheetId, orders, callback) {
  var requests = [];
  // Resize the sheet.
  console.log(arguments);
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: sheetId,
        gridProperties: {
          rowCount: orders.length + 1,
          columnCount: COLUMNS.length
        }
      },
      fields: 'gridProperties(rowCount,columnCount)'
    }
  });
  // Set the cell values.
  requests.push({
    appendCells: {
      sheetId: sheetId,
      rows: {
          values: orders
        },
      fields: '*'
    }
  });
  // Send the batchUpdate request.
  var request = {
    spreadsheetId: spreadsheetId,
    resource: {
      requests: requests
    }
  };
  this.service.spreadsheets.batchUpdate(request, function(err) {
    if (err) {
      console.log(err)
      return callback(err);
    }
    return callback();
  });
};
