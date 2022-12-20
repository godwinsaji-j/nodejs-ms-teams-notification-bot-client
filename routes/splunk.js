const SplunkLogger = require("splunk-logging").Logger;

function postEvent(data){
var config = {
    token: "f1f1a9d5-da97-46d1-8318-9bbbf927a9a7",
    url: "http://localhost:8088"
};

var Logger = new SplunkLogger(config);

var payload = {
    // Message can be anything; doesn't have to be an object
    message: {
        data
    }
};

console.log("Sending payload", payload);
Logger.send(payload, function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});
}

module.exports={postEvent}