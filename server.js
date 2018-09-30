//require('dotenv').config()
const app = require('express')();
const http = require('http').Server(app);
const TelegramBot = require('node-telegram-bot-api');
const request = require('request')
	,	cronJob = require('cron').CronJob
    , crypto = require('crypto')
    //, url = require('url')
const people = ['Akash']
const chatId = '475757469'
const token = process.env.TOKEN;

const bot = new TelegramBot(token, {polling: true});

//Function to calculate checksum using crypto
const checksum = (input) => {
	return crypto.pbkdf2Sync(input, 'salt', 1, 64, 'sha512').toString('hex')
}

bot.sendMessage(chatId,`Hello ${people} , the bot just re/started`)

let sites = [{'url':'https://www.goethe.de/ins/in/en/sta/pun/prf/anm.html','checksumString':''}];
//let cronFlag = false;

bot.onText(/\/start/,(msg) =>{
    bot.sendMessage(msg.chat.id,
        'Welcome to SiteSeer ! Contact www.linkedin.com/in/akash-s-joshi if you want me to add you to the notif list of any site 👻.')
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
	if(!siteObject.checksumString){

		// Create the first checksum and return
		return request(siteObject.url, function initialRequestCallback(error, response, body){

			if(error){return console.error(error)}

			if(response.statusCode < 400){
				return siteObject.checksumString = checksum(body) 
            } 
            else bot.sendMessage(chatId,userMessages.SITE_IS_DOWN)
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

					// TODO send messages to all nibbas
					bot.sendMessage(chatId,userMessages.SITE_HAS_CHANGED)
				}
				else console.log(`Site ${siteObject.url} is still the same.`)
            }
            else  bot.sendMessage(chatId,userMessages.SITE_IS_DOWN)
		})
	} 
} 

var port = process.env.PORT || 8080;

http.listen(port, () => {
	console.log(`working on port ${port}`);
});