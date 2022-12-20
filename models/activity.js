const { json } = require("express");
const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    "trackedByUserShortId":String,
    "activityId":String,
    "activityName":String,
    "activityDescription":String,
    "StartDate":Date,
    "generalReminderDate":Date,
    "EndDate":Date,
    "Status":String,
    "trackedBy":String,
    "completedDL":Array,
    "inProgressDL":Array,
    "trackedForDL":Array,
    "reportIssuesDL":Array,
    "leadsDL":Array,
    "trackedForEmailIds":Array,
    "sendReportToDL":Array,
    "reportedIssues":JSON
})

module.exports = mongoose.model('followUpActivities',userSchema);