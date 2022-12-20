var express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongo = require('./mongo');
const mongoActivitySchema = require('../models/activity');
const notificationBot = require("./notificationBot");
const uuid = require('uuid');
const fetch = require('node-fetch');     
const splunk = require('./splunk');
const shortNames = require('../models/short-names');
const shortNameToEmail = require('../models/short-names-to-email');
const shortNamesToEmail = require('../models/short-names-to-email');

router.post('/log-splunk-event',async (req,res)=>{
    var data = req.body;
    console.log("Spunk Event",data)
    var splunkResponse = await splunk.postEvent(data);
    res.json(splunkResponse);
});


router.get('/',async (req,res)=>{
    res.render('index');
});
router.get('/tech-stack-team',async (req,res)=>{
    res.render('techstack');
});
router.get('/:userId/start-new-follow-up',async (req,res)=>{
    res.render('start-new-follow-up');
});
router.post('/start-new-follow-up',async (req,res)=>{
    var data = req.body;
    data.activityId = uuid.v4();
    data.trackedByUserShortId = data.trackedBy;
    data.trackedBy = shortNames[data.trackedBy];
    insertToTaskDb(data);
    await notificationBot.notifyNewActivity(data);
    var botResponse = "";//await notificationBot.sendNotification(data);
    res.json({status:"success",botResponse});
});


router.get('/get-dls',async (req,res)=>{
    var dls = require('../models/dls');
    res.json({status:"success",message:dls});
});

router.get('/mark-task-completed/:activityId/:userEmailId',async (req,res)=>{
    var activityId = req.params.activityId;
    var userEmailId = req.params.userEmailId;
    var dbResult = await fetchRecordByActivityId(activityId);
    if(!dbResult[0].completedDL.includes(userEmailId)){
        console.log("adding emailId to completed List",dbResult[0].completedDL);
        dbResult[0].completedDL.push(userEmailId);
        await upsertToTaskDb({activityId:activityId},dbResult[0]);
    }else{
        console.log("emailId is already present in completed List",dbResult[0].completedDL);
    }

    res.render('TaskCompleted');
});

router.get('/mark-task-progress/:activityId/:userEmailId',async (req,res)=>{
    var activityId = req.params.activityId;
    var userEmailId = req.params.userEmailId;
    //var dbResult = await fetchRecordByActivityId(activityId);
    //dbResult.completedDL.push(userEmailId);
    //console.log("adding emailId to completed List",dbResult.completedDL);
    //await upsertToTaskDb({activityId:activityId},dbResult);
    res.render('TaskInProgress');
});

// Report Issues
router.get('/report-task-issue/:activityId/:userEmailId',async (req,res)=>{
    var activityId = req.params.activityId;
    var userEmailId = req.params.userEmailId;
    res.render('ReportTaskIssue');
});

router.post('/report-task-issue/:activityId/:userEmailId',async (req,res)=>{
    var activityId = req.params.activityId;
    var userEmailId = req.params.userEmailId;
    var issueDescription = req.body.issueDescription;
    var dbResult = await fetchRecordByActivityId(activityId);
    console.log(dbResult);
    var data = {
        activityId:dbResult[0].activityId,
        activityName:dbResult[0].activityName,
        issueDescription:issueDescription,
        issueReportedBy:userEmailId,
        reportIssuesDL:[]
    };
    var trackerEmail = shortNamesToEmail[dbResult[0].trackedByUserShortId];
    data.reportIssuesDL.push(trackerEmail);
    var botResponse = await notificationBot.notifyActivityIssue(data);
    
    //Upsert The Issue Details to db
    if(!dbResult[0].reportedIssues){
        dbResult[0].reportedIssues={}    
    }
    dbResult[0].reportedIssues[userEmailId] = issueDescription;
    await upsertToTaskDb({activityId:activityId},dbResult);
    res.json(botResponse);
});

//Follow Exisitng Activity and Send Reprt

router.get('/:userId/follow-up-existing',async (req,res)=>{
    res.render('follow-existing-activity');
});

router.get('/:userId/get-following-activities',async (req,res)=>{
    var userId = req.params.userId;
    var dbResult = await fetchRecordByUserId(userId);
    res.json({status:"Success",data:dbResult});
});

// Send Reminder
router.post('/:activityId/send-reminder',async (req,res)=>{
    var data = req.body;
    var message = await notificationBot.notifyActivityReminder(data);
    res.json({status:"Success",data:message});
});

// Send Report
router.post('/:activityId/send-report',async (req,res)=>{
    var data = req.body;
    var message = await notificationBot.notifyActivityReport(data);
    res.json({status:"Success",data:message});
});


router.get('/getUserDetailsById/:userId',async (req,res)=>{
    var userId = req.params.userId;
    var dbResult = await fetchRecordByActivityId(userId);
    console.log("Returned to GET%j",dbResult)
    res.json({message:'success',data:dbResult});
});

router.post('/addUser',(req,res)=>{
    console.log("In Post Method"+req.body["x-app-env"]);
    var data = req.body;
    data.environment = req.body["x-app-env"];
    data.userId = req.body["userId"];
    data.userName = req.body["userName"];
    data.currentDateTime = (new Date().toISOString()).split("T")[0]
    console.log("In Post Method, data=%j",data);
    insertToUserDb(data);
    await 
    res.json({message:'success'});
});

//Follow Exisitng Activity and Send Reprt

router.get('/:userId/my-activity-bucket',async (req,res)=>{
    res.render('myBucket');
});


// DB CRUD Methods
const insertToTaskDb = async (data) =>{
await mongo().then(async (mongoose)=>{
    try{
        console.log("connected to MongoDB");
        console.log("data=%j",data);
        await new mongoActivitySchema(data).save();
        console.log("Data inserted to mongo DB Successfully");
    }finally{
        mongoose.connection.close();
    }
})
}

const upsertToTaskDb = async (searchQuery,upsertData) =>{
    await mongo().then(async (mongoose)=>{
        try{
            console.log("connected to MongoDB");
            await mongoActivitySchema.findOneAndUpdate(searchQuery,upsertData,{upsert: true});
            console.log("Data Updated to mongo DB Successfully");
        }catch(e){
            console.log("Exception = "+e.message);
        }finally{
            mongoose.connection.close();
        }
    })
    }

const fetchRecordByActivityId = async (searchParameter) =>{
    var dbResult="NONE";
    await mongo().then(async (mongoose)=>{
        
        try{
            console.log("connected to MongoDB");
            await mongoActivitySchema.find({"activityId" : searchParameter}).then( (docs)=> {
                //console.log("First function call : ", docs);
                dbResult = docs;
            });
            console.log("Data retrieved to mongo DB Successfully");
        }catch(e){
            console.log("Exception in DB Find "+e.message);
        }finally{
            console.log("closing db connection");
            mongoose.connection.close();
        }
    })
console.log("Returning dbRes,%j",dbResult);
    return dbResult;
    
    }

    const fetchRecordByUserId = async (searchParameter) =>{
        var dbResult="NONE";
        await mongo().then(async (mongoose)=>{
            
            try{
                console.log("connected to MongoDB");
                await mongoActivitySchema.find({"trackedByUserId" : searchParameter}).then( (docs)=> {
                    //console.log("First function call : ", docs);
                    dbResult = docs;
                });
                console.log("Data retrieved to mongo DB Successfully");
            }catch(e){
                console.log("Exception in DB Find "+e.message);
            }finally{
                console.log("closing db connection");
                mongoose.connection.close();
            }
        })
    console.log("Returning dbRes,%j",dbResult);
        return dbResult;
        
        }

    const deleteTaskFromDb = async (data) =>{
        await mongo().then(async (mongoose)=>{
            try{
                console.log("connected to MongoDB");
                await mongoActivitySchema.deleteOne({"_id" : "639998dd7713af4d664b02e7"}).then( (docs)=> {
                    //console.log("First function call : ", docs);
                    dbResult = docs;
                });
                console.log("Data Deleted from mongo DB Successfully");
            }catch(e){
                console.log("Exception in DB Find "+e.message);
            }finally{
                console.log("closing db connection");
                mongoose.connection.close();
            }
        })
        }

module.exports = router