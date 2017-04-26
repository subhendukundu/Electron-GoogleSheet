const electron = require('electron');
const { ipcRenderer: ipc } = electron;
const remote = require('remote');
const session =remote.session;
session.defaultSession.cookies.get({url: 'https://eventdesktop.com'}, (error, cookies) => {
	const userName = cookies[0].value;
	document.getElementById("userDetails").innerHTML=`<div>Welcome ${userName}</div>`;
});
sheetButton.addEventListener('click', e => {
	const sheetID = document.getElementById("sheetID").value;
	const spreadsheetId = document.getElementById("spreadsheetId").value;
	const firstName = document.getElementById("firstName").value;
	const lastName = document.getElementById("lastName").value;
	const phoneNumber = document.getElementById("phoneNumber").value;
	const emailID = document.getElementById("emailID").value;
	const age = document.getElementById("age").value;
	
	const sheetDetails = {
		spreadsheetId : spreadsheetId,	
		sheetID : sheetID,
		firstName : firstName,
		lastName : lastName,
		phoneNumber : phoneNumber,
		emailID : emailID,
		age :age
	}
	ipc.send('got-sheetData', sheetDetails );
});