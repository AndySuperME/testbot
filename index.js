var linebot = require('linebot'),
    express = require('express'),
    weatherTW = require('weather-taiwan');

var SITE_NAME = '西屯';

var country, siteName, pmData, aqiStatus, lName, temp, humd;;
const rp = require('request-promise');
const aqiOpt = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
}; 


var myLineTemplate={
    type: 'template',
    altText: 'this is a confirm template',
    template: {
        type: 'buttons',
        text: '按下選單可以查看目前PM2.5！\n輸入？即可再次出現選單',
        actions: [{
            type: 'postback',
            label: '臺南市關廟區',
            data: '臺南,關廟',
        }, {
            type: 'postback',
            label: '臺南市歸仁區',
            data: '臺南,媽廟',
        }, {
            type: 'postback',
            label: '南投縣魚池鄉',
            data: '南投,魚池',
        }, {
            type: 'postback',
            label: '高雄市左營區',
            data: '左營,左營',
        }]
    }
};

var bot = linebot({
	
    channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
	/*
	channelId: '1556996237',
	channelSecret: '0464edc12c0dd4529fa7dc87e3792d8b',
	channelAccessToken: 'nHad2FGf4a19Fcc1CRLjMsGdUXkAxEg0n1eL3KNqRHGDP3MIJ1cktzTNur+taQQMPaKOB/2vZB1yfLF5MfcUAQlIuo+cX7mC399dvC0PDlGmy2rMjmFu4gP0i4YAg96/QDGrszN613IoIRRb/EZy6AdB04t89/1O/w1cDnyilFU='
	*/
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
        if (msg == '?' || '？') msg += ':';
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

            case '？':
                event.reply(myLineTemplate);
                break;

            case '?':
                event.reply(myLineTemplate);
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
});

// 在 localhost 走 8080 port
app.listen(process.env.PORT || 8080, function () {
	console.log('LineBot is running.');
});

function clientUser(ID, receiveMsg) {
    this.ID = ID;
    this.receiveMsg = receiveMsg;
}

// 主動發送訊息給 Client App
setTimeout(function() {
    var sendMsg = myLineTemplate;
    bot.push('U4575fdaaae002fb2b9b67be60354de7c', [sendMsg]);
}, 1000);


function sendPMMsg(ID, city, locationName) {
    SITE_NAME = city;
    let data;
        rp(aqiOpt)
        .then(function (repos) {
            aqiData = readAQI(repos);
            country = aqiData.County;
            siteName = aqiData.SiteName;
            pmData = aqiData["PM2.5_AVG"];
            aqiStatus = aqiData.Status; 
            lName = locationName;
            /*
            bot.push(ID, aqiData.County + aqiData.SiteName +
            '\n\nPM2.5指數：'+ aqiData["PM2.5_AVG"] + 
            '\n狀態：' + aqiData.Status);
           */
          getWeather(locationName);
          setTimeout(function(){
                bot.push(clientID, country + siteName +
                locationName +
                '\n\nPM2.5指數：'+ pmData + 
                '\n狀態：' + aqiStatus + '\n溫度：' + temp +
                '\n濕度：' + humd);
                console.log('2 : ' + temp)
          },1000);
        })
        .catch(function (err) {
            event.reply('無法取得空氣品質資料～');
        });
}


function getWeather(locationName) {
    var arr;
        var fetcher = weatherTW.fetch('CWB-BF22D64C-B980-47DF-9ED6-CFD09D59B815');
        var Wparser = weatherTW.parse();
        Wparser.on('data', function(data) {
            arr = data.locationName.indexOf(locationName);            
            if (arr != -1) {
                temp = data.elements.TEMP;
                humd = data.elements.HUMD;
                console.debug("1 : " + temp + "  " + humd);
            }
        });
    fetcher.pipe(Wparser);
}
