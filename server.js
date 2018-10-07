//require('dotenv').config()
const app = require('express')();
const http = require('http').Server(app);
const TelegramBot = require('node-telegram-bot-api');
const request = require('request')
	,	cronJob = require('cron').CronJob
    , crypto = require('crypto')
    //, url = require('url')
const people = ['Akash']
const admin = 475757469
const token = process.env.TOKEN;

const bot = new TelegramBot(token, {polling: true});

//Function to calculate checksum using crypto
const checksum = (input) => {
	return crypto.pbkdf2Sync(input, 'salt', 1, 64, 'sha512').toString('hex')
}

bot.sendMessage(admin,`Hello ${people} , the bot just re/started`)

let sites = [{'url':'https://www.goethe.de/ins/in/en/sta/pun/prf/anm.html','chatId':['475757469']},{'url':'http://reg.fiitjee.co','chatId':['603907586']},{'url':'https://jeemain.nic.in/webinfo/Public/Home.aspx','chatId':['603907586']}];

let siteList = ['https://www.goethe.de/ins/in/en/sta/pun/prf/anm.html','http://reg.fiitjee.co','https://jeemain.nic.in/webinfo/Public/Home.aspx'];

bot.onText(/\/start/,(msg) =>{
    bot.sendMessage(msg.chat.id,
		`Welcome to SiteSeer ! 
		Made by www.linkedin.com/in/akash-s-joshi 👻. 
		/list to list websites
		Your chatid is ${msg.chat.id}`)
})

app.get('/', (req,res) => {
	res.send(sites);
});

// Matches "/echo [whatever]"
/*bot.onText(/\/watch (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

    const chatId = msg.chat.id;
    let usermsg = match[1]  
    usermsg = url.parse(usermsg).hostname
    console.log(usermsg)
    let userurl = `http://${usermsg}`
    console.log(userurl)
    if(usermsg!=null){          // check whether website is valid
        
        userSite[chatId] = userurl
        sites.push(userurl);
        sites = sites.filter((v, i, a) => a.indexOf(v) === i);
        console.log(userSite)
        console.log(sites)
        bot.sendMessage(chatId,`Checking ${usermsg} for you !`)
        if(!cronFlag){
            job.start();
            cronFlag = true;
        }
    }
    else bot.sendMessage(chatId,`Could not find the site. Make sure the *http://* part is included in the entered URL`)
});*/

bot.onText(/\/list/,(msg)=>{
	let temp = 'Sites currently being checked are \n'

	siteList.forEach((element)=>{
		temp += ('\n'+ element+'\n');
	})

	temp += `\n\nUse " /subscribe sitename " to subscribe to notifs of that site\n\nUse " /unsub sitename " to unsubscribe`;

	bot.sendMessage(msg.chat.id,temp)
})

bot.onText(/\/subscribe (.+)/,(msg,match)=>{
	if(siteList.indexOf(match[1])!=-1){
		sites.forEach((element)=>{
			if(element.url==match[1]){
				let flag = true;
				element.chatId.forEach((element)=>{
					if(element==msg.chat.id){
						bot.sendMessage(msg.chat.id,`Already subscribed`)
						flag = false
						return true
					}
				})
				if(flag){
					element.chatId.push(msg.chat.id)
					bot.sendMessage(msg.chat.id,`Successfully subscribed to ${match[1]}`)
					return true;
				}
				else return true;
			}
		})
	}
	else bot.sendMessage(msg.chat.id,`${match[1]} isn't a valid site. Please check /list for available websites`)
})

bot.onText(/\/unsub (.+)/,(msg,match)=>{
	if(siteList.indexOf(match[1])!=-1){
		sites.forEach((element)=>{
			if(element.url==match[1]){
				element.chatId = element.chatId.filter((value)=>{
					return value != msg.chat.id;
				})
				bot.sendMessage(msg.chat.id,`If you were subscribed to ${match[1]}, you no longer are`)
				return true;
			}
		})
	}
	else bot.sendMessage(msg.chat.id,`${match[1]} isn't a valid site. Please check /list for available websites`)
})

bot.on ('polling_error', (error) => {
    var time = new Date();
	console.log("TIME:", time);
	console.log("CODE:", error.code);  // => 'EFATAL'
	console.log("MSG:", error.message);
	console.log("STACK:", error.stack);
 });

var job = new cronJob('*/15 * * * *', batchWatch//()=>{console.log(1)}
, function endCronJob(){
    console.log('cronJob ended')
  },true,
  'America/Los_Angeles' /* Time zone of this job. */
);

function batchWatch (){
	sites.forEach(function(element){
		siteWatcher(element)
	})
}

// Watch the site for changes...
function siteWatcher(siteObject){
	let userMessages = {
        "SITE_HAS_CHANGED": `The site, ${siteObject.url}, has changed!`,
        "SITE_IS_DOWN": `The site, ${siteObject.url}, is down!`
	}

	// Check to see if there is a seed checksum
	if(!siteObject.hasOwnProperty('checksumString')){

		// Create the first checksum and return
		return request(siteObject.url, function initialRequestCallback(error, response, body){

			if(error){return console.error(error)}

			if(response.statusCode < 400){
				return siteObject.checksumString = checksum(body) 
            } 
            else{
				siteObject.chatId.forEach((element)=>{
					bot.sendMessage(element,userMessages.SITE_IS_DOWN);
				})
			} 
		}) // end request
	}
	else{
		// Compare current checksum with latest request body 
		return request(siteObject.url, function recurringRequestCallback(error, response, body){

			if(error){return console.error(error)}

			if(response.statusCode < 400){
				
				let currentCheckSum = checksum(body)
				
				if(siteObject.checksumString != currentCheckSum){
					// They are not the same so send notification 
					console.log(`Site ${siteObject.url} is not the same.`)
					
					// Update checkSumString's value
					siteObject.checksumString = currentCheckSum

						siteObject.chatId.forEach((element)=>{
							bot.sendMessage(element,userMessages.SITE_HAS_CHANGED);
						})
				}
				// else site still same
            }
            else  {
				siteObject.chatId.forEach((element)=>{
					bot.sendMessage(element,userMessages.SITE_IS_DOWN);
				})
			} 
		})
	} 
} 

var port = process.env.PORT || 8080;

http.listen(port, () => {
	console.log(`working on port ${port}`);
});