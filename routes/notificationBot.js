const fetch = require('node-fetch');     
async function notifyNewActivity(data){
    //console.log(data)
    fetch('https://botmsteamse5b0acbot.azurewebsites.net/api/notification', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(response => console.log(response))
}

async function notifyActivityReminder(data){
    //console.log(data)
    fetch('https://botmsteamse5b0acbot.azurewebsites.net/api/AlertNotification', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(response => console.log(response))
}


async function notifyActivityReport(data){
    //console.log(data)
    fetch('https://botmsteamse5b0acbot.azurewebsites.net/api/ReportImageNotification', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(response => console.log(response))
}

async function notifyActivityIssue(data){
    //console.log(data)
    fetch('https://botmsteamse5b0acbot.azurewebsites.net/api/ReportBugNotification', {
        method: 'post',
        body: JSON.stringify(data)
    }).then(response => console.log(response))
}

module.exports = {notifyNewActivity,notifyActivityReminder,notifyActivityReport,notifyActivityIssue}

/* 
{
      activityName: 'JS',
      activityDescription: 'upfate to v1.5',
      StartDate: '2022-12-15',
      generalReminderDate: '2022-12-16',
      EndDate: '2022-12-15',
      Status: '',
      trackedBy: 'Joseph',
      completedDL: [],
      trackedForDL: 'allUsers',
      sendReportToDL: 'singleUser',
      activityId: '3db32dff-2385-488d-86be-a2f9df519936'
    }
*/