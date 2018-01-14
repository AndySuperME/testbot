var linebot = require('linebot'),
    express = require('express');

var SITE_NAME = '西屯';
const rp = require('request-promise');
const aqiOpt = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
}; 


var bot = linebot({
    channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

function readAQI(repos){
    let data;    
    for (i in repos) {
        if (repos[i].SiteName == SITE_NAME) {
            data = repos[i];
            break;
        }
    }
    return data;
}

var clientID, clientArray = [];
bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    console.log(event.source.userId);
    clientID = event.source.userId;
    if (clientArray.length == 0) {
        clientArray.push(new clientUser(clientID, ''));
    }
    for (var i = 0 ; i < clientArray.length ; i++) {
        if (clientArray[i].ID != clientID){
            clientArray.push(new clientUser(clientID, ''));
        }
    }
    //console.debug("Push : ", clientArray[0].receiveMsg);
    if (event.message.type = 'text') {
        msg = event.message.text;
        var tmp = msg.substring(0, msg.indexOf(':'));
        var tmpdata = msg.substring(msg.indexOf(':')+1, msg.length);
        console.log("======="+tmpdata+"=====");
        switch (tmp) {
            case 'Location':
                try {
                    console.debug("Send Message:" + tmpdata);
                    for (var i = 0 ; i < clientArray.length ; i++) {
                        if (clientArray[i].ID == clientID) {
                            sendPMMsg(clientArray[i].ID, tmpdata);
                        }
                    }
                } catch (error) {
                }
                break;
            case 'SetLocation':
               // var object = new clientUser(clientID, tmpdata);
               for (var i = 0 ; i < clientArray.length ; i++) {
                   if (clientArray[i].ID == clientID) {
                       clientArray[i].receiveMsg = tmpdata;
                       console.debug(clientID + " Change Data : " + clientArray[i].receiveMsg);
                   }
               }
 
                break;
            case 'Current Location':
                
                for (var i = 0 ; i < clientArray.length ; i++) {
                    if (clientArray[i].ID == clientID) {
                        sendPMMsg(clientArray[i].ID, clientArray[i].receiveMsg);
                        console.debug("+++++++++++", clientArray[i].receiveMsg);
                    }
                }
                break;
        }
        /*
        msg = event.message.text;;
        event.reply(msg).then(function(data) {
            // success
            console.log(msg);
        }).catch(function(error) {
            // error
            console.log('error');
        });
        */
    }
});

const linebotParser = bot.parser(),
    app = express();
app.post('/linewebhook', linebotParser);
//app.post('/', linebotParser);
app.set('view engine', 'ejs');
app.get('/',function(req,res){
    rp(aqiOpt)
    .then(function (repos) {
        res.render('index', {AQI:readAQI(repos)});
    })
    .catch(function (err) {
		res.send("無法取得空氣品質資料～");
    });
});

// 在 localhost 走 8080 port
var server = app.listen(process.env.PORT || 8080, function() {
    var port = server.address().port;
    console.log("My Line bot App running on port", port);
});

function clientUser(ID, receiveMsg) {
    this.ID = ID;
    this.receiveMsg = receiveMsg;
}

// 主動發送訊息給 Client App
setTimeout(function() {
    //var userId = config.clientAppUserID;
    //var sendMsg = "push msg to one user";
    //bot.push('U4575fdaaae002fb2b9b67be60354de7c', [sendMsg]);
    //console.log('userId: ' + userId);
    //console.log('send: ' + sendMsg);


}, 5000);

function sendPMMsg(ID, city) {
    SITE_NAME = city;
    let data;
        rp(aqiOpt)
        .then(function (repos) {
            data = readAQI(repos);
            var sendMsg = "push msg to one user";
            bot.push(ID, data.County + data.SiteName +
            '\n\nPM2.5指數：'+ data["PM2.5_AVG"] + 
            '\n狀態：' + data.Status)
           
        })
        .catch(function (err) {
            event.reply('無法取得空氣品質資料～');
        });
}

function autoSenMsg() {

}
