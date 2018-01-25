var linebot = require('linebot'),
    express = require('express'),
    dateFormat = require('dateformat');

var SITE_NAME = '臺南', SITE_NAME2 = '', SITE_NAME3 = '';

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


var myLineCarouselTemplate={
    type: 'template',
	altText: 'this is a carousel template',
	template: {
		type: 'carousel',
		columns: [{
			thumbnailImageUrl: 'https://dynamicmedia.zuza.com/zz/m/original_/3/d/3d553796-0322-4e21-b100-20ca39ca3494/hot_sun_cooling___Gallery.jpg',
			title: '天氣狀況',
			text: '按下選單可以查看目前PM2.5！\n輸入？即可再次出現選單\n點選之後請等待幾秒鐘的運算時間',
			actions: [{
                type: 'postback',
                label: '臺南市',
                data: '1:臺南,臺南',
            }, {
                type: 'postback',
                label: '南投縣日月潭',
                data: '1:南投,日月潭',
            }, {
                type: 'postback',
                label: '高雄市左營',
                data: '1:左營,高雄',
            }]
		}, {
			thumbnailImageUrl: 'https://i.imgur.com/xQF5dZT.jpg',
			title: '設定通知地點/溫度',
			text: 'description',
			actions: [{
				type: 'postback',
				label: '查看地點',
				data: '2:查看地點'
			}, {
				type: 'postback',
				label: '設置地點',
				data: '3:設置地點'
			}, {
                type: 'postback',
                label: '設置通知時間',
                data: '4:設置時間'
            }]
		}]
	}
}

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

function readWEATHER3(repos, sqlname) {
    let data; 
    SITE_NAME3 = sqlname;   
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
    console.debug(event.message);
    clientID = event.source.userId;
    if (event.message.type == 'text') {
        msg = event.message.text;
        if (msg == '?' || '？') msg += ':';
        var tmp = msg.substring(0, msg.indexOf(':'));
        var tmpdata = msg.substring(msg.indexOf(':')+1, msg.length-1);
        console.log("======="+tmpdata+"=====");
        switch (tmp) {
            case 'SetLocation': 
                queryDatabase(clientID, tmpdata);
                break;
            case '？':
                event.reply(movieTemplate);
                break;
            case '?':
                event.reply(myLineCarouselTemplate);
                break;
            case '地點':
                queryDatabase(clientID, tmpdata);
                event.source.profile().then(function (profile) {
                    event.reply(profile.displayName + ' 您已設定地點於：' + tmpdata);
                }).catch(function (error) {
                    // error
                });
                break;
            case '時間':
                /*
                event.source.profile().then(function (profile) {
                    event.reply(profile.displayName + ' 您已設定通知時間於：' + tmpdata);
                }).catch(function (error) {
                    // error
                });
                */
                break;
            case 'getDataBaseData':
                getDataBaseData(event);
                break;
            case 'M':
                queryMovieDatabase(tmpdata);
                movieData.then(function(object){
                    bot.push(event.source.userId ,object.name + "\n" + object.url + "\n" + object.descri + "\n" + object.infor);  
                })       
                break;
        }
    }

    if (event.message.type == 'location') {
        getCurrentWeatherByGeoCoordinates(event);
    }
});

bot.on('postback', function (event) {
    var firsttmp = event.postback.data.substring(0, event.postback.data.indexOf(':'));
    switch (firsttmp) {
        case '1':  
            var city = event.postback.data.substring(event.postback.data.indexOf(':')+1, event.postback.data.indexOf(','));
            var locationName = event.postback.data.substring(event.postback.data.indexOf(',')+1, event.postback.data.length);
            clientID = event.source.userId;
            event.reply(sendPMMsg(clientID, city, locationName));
            console.debug( clientID + " 按下:" + city + '/' + locationName);
            break;
        case '2':
            event.reply('南沙島 /東沙島 /馬祖 /金門 /東吉島 /澎湖 /蘭嶼 /大武 /臺東 /成功 /花蓮 /恆春 /高雄 /臺南 /嘉義 /阿里山 /玉山 /日月潭 /梧棲 /臺中 /新竹 /新屋 /板橋 /臺北 /陽明山 /鞍部 /蘇澳 /宜蘭 /基隆 /彭佳嶼');
            break;
        case '3':
            event.reply('請直接回覆地點 \n EX: 地點:臺南(請勿使用全形：) \n P.S. 回覆前請先查看有哪些地點！！');   
            break;
        case '4':
            event.reply('請直接回覆通知時間 \n EX: 時間:08 (請勿使用全形： 請以小時填寫)')
            break;
        case '5':
            queryMovieTimeDatabase("02");
            movieTimeData.then(function(object){
                for (var i = 0 ; i < object.length ; i++) {
                    bot.push(event.source.userId ,object[i].name + "\n" + object[i].url + "\n" + object[i].descri + "\n" + object[i].infor);
                }
            })
            break;
        case '6':
            event.reply('輸入電影關鍵字來查詢 \n EX：M:阿凡達 （輸入阿即可）\nP.S. 記得使用半形:');
            break;
    }

   
}) 

const linebotParser = bot.parser(),
    app = express();
app.post('/linewebhook', linebotParser);
//app.post('/', linebotParser);
app.set('view engine', 'ejs');
app.get('/',function(req,res){
    res.send('Start');
});

// 在 localhost 走 8080 port
app.listen(process.env.PORT || 8080, function () {
	console.log('LineBot is running.');
});


setInterval(function(){
    var now = new Date();
    dateFormat.masks.hammerTime = 'HH';
    var h = dateFormat(now, "hammerTime");
    //console.log(h);
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
    alertWeather();
}, 600000)

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

/*---------------------------------------------------------*/
const pg = require('pg');
const config = {
    host: 'ec2-54-235-73-241.compute-1.amazonaws.com',
    // Do not hard code your username and password.
    // Consider using Node environment variables.
    user: 'blmgdbiogogktw',     
    password: 'fb1b81c82613869e5b79f88d6f729d2002f535ff5fa1821ef7e5921316e2a2e6',
    database: 'd4lkog9d8vml1i',
    port: 5432,
    ssl: true
};

const client = new pg.Client(config);
connectSql();
function connectSql() {
    client.connect(err => {
        if (err) throw err;
    });
}

function queryDatabase(insertID, insertMsg) {

    console.log(`Running query to PostgreSQL server: ${config.host}`);

    var query = "SELECT * FROM inventory WHERE id = " + "'" + insertID + "'";

    client.query(query)
        .then(res => {
            //exists
            if (res.rowCount != 0) {
                const rows = res.rows;
                rows.map(row => {
                    //console.log(`Read: ${JSON.stringify(row)}`);
                    //update sql
                    updataqueryDatabase(insertID, insertMsg);                   
                });
            }
            //no exists
            else {
                //insert into sql
                query = `INSERT INTO inventory (id, name) VALUES (` + "'" + insertID + "'" + "," + "'" + insertMsg + "'" + ")";
                queryInsertDatabase(query);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function queryInsertDatabase(InsertQuery) {
    var query = InsertQuery;
    client
        .query(query)
        .then(() => {
            console.log('Insert successfully!');
           // client.end(console.log('Closed client connection'));
        })
        .catch(err => console.log(err))
        .then(() => {
            console.log('Finished execution, exiting now');
        });
}

function updataqueryDatabase(insertID, insertMsg) {
    const query = "UPDATE inventory SET name=" + "'" + insertMsg + "'" +" WHERE id = " + "'" + insertID + "'" + ";";
    client
        .query(query)
        .then(result => {
            console.log('Update completed');
            console.log(`Rows affected: ${result.rowCount}`);
            //process.exit();
            console.log("SQL UPDATE MESSAGE : " + insertMsg);
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
}

function getDataBaseData(event) {
    new Promise(function (resolve) {
        const query = "SELECT * FROM inventory WHERE id = " + "'" + clientID + "'";
            client.query(query)
                .then(res => {
                    const rows = res.rows;
                    console.log(res.rowCount);
                    rows.map(row => {
                        //console.log(`Read: ${JSON.stringify(row)}`);
                        var data = row.name;
                        console.log(data);
                        resolve(data);
                    });
                })
                .catch(err => {
                    console.log(err);
                });
    }).then(function(value){
            event.source.profile().then(function(profile){
            event.reply(profile.displayName + " 您已設定區域於 " + value);
        })
    })
}
/*---------------------------------------------------------*/


/*---------------------------------------------------------*/
function alertWeather() {
    const query = 'SELECT * FROM inventory;';
    sqlArray = [];
    client.query(query)
        .then(res => {
            const rows = res.rows;
            rows.map(row => {
                //SITE_NAME3 = row.name;
                //var getID = row.id;
                rp2(weatherOpt)
                    .then(function (repos) {
                        var weatherData3 = readWEATHER3(repos, row.name);
                        var temperature = weatherData3.Temperature;
                        var temperature = temperature.substring(0, temperature.indexOf('('));
                        bot.push(row.id, temperature);    
                       })        
            });
        })
        .catch(err => {
            console.log(err);
        });
}
/*---------------------------------------------------------*/


/*---------------------------------------------------------*/
const OpenWeatherMapHelper = require("openweathermap-node");

const helper = new OpenWeatherMapHelper(
    {
        APPID: '16b8c42d665cb0410dab109736c1c20d',
        units: "metric"
    }
);

function getCurrentWeatherByGeoCoordinates(event) {
    var lt = event.message.latitude;
        var lg = event.message.longitude;
        var temp = null, humi = null, state = null;
        new Promise(function(resolve){
            helper.getCurrentWeatherByGeoCoordinates(lt, lg, (err, currentWeather) => {
            if(err){
                console.log(err);
            }
            else{
                temp = currentWeather.main.temp;
                temp -= 273.15;
                temp = Math.round(temp *10) / 10;
                humi = currentWeather.main.humidity;
                state = JSON.stringify(currentWeather.weather);
                state = state.substring(state.indexOf('description":"') + 13, state.indexOf(',"icon'));
                console.log('Temperature: ' + temp + ' Humidity: ' + humi + ' State: ' + state);
            }
            resolve();
            });
        }).then(function(){
            event.reply("目前溫度：" + temp + "\n目前濕度：" + humi + "\n目前狀態：" + state);
        })
}
/*---------------------------------------------------------*/
var movieData;
function queryMovieDatabase(movieName){
    movieData = new Promise(function(resolve){
        const query = "SELECT * FROM movie WHERE name Like '%" + movieName + "%'";
        client.query(query)
            .then(res => {
                const rows = res.rows;
                //console.log(res.rowCount);

                rows.map(row => {
                    //console.log(`Read: ${JSON.stringify(row)}`);
                    console.log(row);
                    resolve(row);
                });
            })
            .catch(err => {
                console.log(err);
            });
    })
}

var movieTimeData;
function queryMovieTimeDatabase(movieTime){
    var movieArray = [], k = 0;;
    movieTimeData = new Promise(function(resolve){
        const query = "SELECT * FROM movie WHERE time Like '%" + movieTime + "%'";
        client.query(query)
            .then(res => {
                const rows = res.rows;
                //console.log(res.rowCount);
                rows.map(row => {
                    //console.log(`Read: ${JSON.stringify(row)}`);
                    movieArray[k++] = row;
                    //console.log(row);
                    resolve(movieArray);
                });
            })
            .catch(err => {
                console.log(err);
            });
    })
}

var movieTemplate={
    type: 'template',
    altText: 'this is a confirm template',
    template: {
        type: 'buttons',
        text: '請先按下',
        actions: [{
            type: 'postback',
            label: '近期電影',
            data: '5:movieDate',
        }, {
            type: 'postback',
            label: '輸入電影關鍵字',
            data: '6:input',
        }]
    }
};
/*---------------------------------------------------------*/
