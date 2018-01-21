var linebot = require('linebot'),
    express = require('express'),
    dateFormat = require('dateformat');

var SITE_NAME = '西屯', SITE_NAME2 = '', SITE_NAME3 = '';

var country, siteName, pmData, aqiStatus, lName, temp, humd, weather, date;
var setNotifylocation;
const rp = require('request-promise');
const rp2 = require('request-promise');
const aqiOpt = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
}; 
const weatherOpt = {
    uri: "http://opendata.epa.gov.tw/ws/Data/ATM00698/?$format=json",
    json: true
}


var myLineTemplate={
    type: 'template',
    altText: 'this is a confirm template',
    template: {
        type: 'buttons',
        text: '按下選單可以查看目前PM2.5！\n輸入？即可再次出現選單\n點選之後請等待幾秒鐘的運算時間',
        actions: [{
            type: 'postback',
            label: '臺南市',
            data: '臺南,臺南',
        }, {
            type: 'postback',
            label: '南投縣日月潭',
            data: '南投,日月潭',
        }, {
            type: 'postback',
            label: '高雄市左營',
            data: '左營,高雄',
        }]
    }
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

function readWEATHER(repos) {
    let data;    
    for (i in repos) {
        if (repos[i].SiteName == SITE_NAME2) {
            data = repos[i];
            break;
        }
    }
    return data;
}

function readWEATHER3(repos) {
    let data;    
    SITE_NAME3 = clientArray[0].setWeather;
    console.log("       pppp   " + SITE_NAME3);
    for (i in repos) {
        if (repos[i].SiteName == SITE_NAME3) {
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
        clientArray.push(new clientUser(clientID, '', ''));
    }
    for (var i = 0 ; i < clientArray.length ; i++) {
        if (clientArray[i].ID != clientID){
            clientArray.push(new clientUser(clientID, '', ''));
        }
    }
    //console.debug("Push : ", clientArray[0].receiveMsg);
    if (event.message.type = 'text') {
        msg = event.message.text;
        if (msg == '?' || '？') msg += ':';
        var tmp = msg.substring(0, msg.indexOf(':'));
        var tmpdata = msg.substring(msg.indexOf(':')+1, msg.length-1);
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
                       clientArray[i].setWeather = tmpdata;
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

            case '？':
                event.reply(myLineTemplate);
                break;

            case '?':
                event.reply(myLineTemplate);
                break;
        }
    }
});

bot.on('postback', function (event) {
    var city = event.postback.data.substring(0, event.postback.data.indexOf(','));
    var locationName = event.postback.data.substring(event.postback.data.indexOf(',')+1, event.postback.data.length);
    clientID = event.source.userId;
    event.reply(sendPMMsg(clientID, city, locationName));

    console.debug( clientID + " 按下:" + city + '/' + locationName);
}) 

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
    
    rp2(weatherOpt)
    .then(function (repos) {
        res.render('index', {WEATHER:readWEATHER(repos)});
    })
    .catch(function (err) {
		res.send("無法取得天氣資料～");
    });
});

// 在 localhost 走 8080 port
app.listen(process.env.PORT || 8080, function () {
	console.log('LineBot is running.');
});

function clientUser(ID, receiveMsg, setWeather) {
    this.ID = ID;
    this.receiveMsg = receiveMsg;
    this.setWeather = setWeather;
}

// 主動發送訊息給 Client App
function pingWeb(){
    var hosts = ['https://andyopbot.herokuapp.com/'];
    hosts.forEach(function(host){
        ping.sys.probe(host, function(isAlive){
            var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
            console.log(msg);
        });
    });
}

setInterval(function(){
    var now = new Date();
    dateFormat.masks.hammerTime = 'HH';
    var h = dateFormat(now, "hammerTime");
    console.log(h);
    /*
    if (h == '07' || h == '08'|| h == '09'|| h == '10'|| h == '11'|| h == '12'|| h == '13'|| h == '14'|| h == '15'|| h == '16'|| h == '17'|| h == '18'|| h == '19'|| h == '20'|| h == '21'|| h == '22'|| h == '23'){
        //pingWeb();
        rp2(weatherOpt)
        .then(function (repos) {
            var weatherData3 = readWEATHER3(repos);
            var temperature = weatherData3.Temperature;
            var temperature = temperature.substring(0, temperature.indexOf('('));
            if (temperature > 25)
            bot.push('U4575fdaaae002fb2b9b67be60354de7c', temperature);
        })
    }
    */
        rp2(weatherOpt)
        .then(function (repos) {
            var weatherData3 = readWEATHER3(repos);
            var temperature = weatherData3.Temperature;
            var temperature = temperature.substring(0, temperature.indexOf('('));
            //if (temperature > 25)
            bot.push('U4575fdaaae002fb2b9b67be60354de7c', temperature);
        })
}, 300000)



function sendPMMsg(ID, city, locationName) {
    SITE_NAME = city;
    SITE_NAME2 = locationName;
    let data;
        rp(aqiOpt)
        .then(function (repos) {
            aqiData = readAQI(repos);
            country = aqiData.County;
            siteName = aqiData.SiteName;
            pmData = aqiData["PM2.5_AVG"];
            aqiStatus = aqiData.Status; 
            lName = locationName;
        })
        .catch(function (err) {
            event.reply('無法取得空氣品質資料～');
        });
        
        rp2(weatherOpt)
        .then(function (repos) {
            weatherData = readWEATHER(repos);
            temp = weatherData.Temperature;
            humd = weatherData.Moisture;
            weather = weatherData.Weather;
            date = weatherData.DataCreationDate;
        }).then(function(){
            bot.push(clientID, country + siteName +
                locationName +
                '\n\nPM2.5指數：'+ pmData + 
                '\n狀態：' + aqiStatus + '\n溫度：' + temp +
                '\n濕度：' + humd + '\n狀況：' + weather + 
                '\n更新時間：' + date);
                console.log('2 : ' + temp)
        })
}
