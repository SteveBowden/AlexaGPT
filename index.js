exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var dictionary = {
        "reconfirm": "I didn't understand you, try again?"
    };
    var outputObject = {
        "version": "1.0",
        "sessionAttributes": {},
        "response": {
            "directives": [],
            "outputSpeech": {
                "type": "SSML",
                "ssml": dictionary.reconfirm, 
            },
            "card": {
                "type": "Simple",
                "title": "Chatty Maximus",
                "content": "I'm a chatbot?"
            },
            "reprompt": {
                "outputSpeech": {
                    "type": "SSML",
                    "ssml": "<speak>I'm still waiting</speak>"
                }
            },
            "shouldEndSession": false
        }
    };
    
    if (event.request && event.request.type && event.request.type === 'SessionEndedRequest')
    {
        console.log('session ended');
				return null;     
    }
    
	var sessionAttributes = {};
	
	if (event.session && event.session.attributes)
	{
	    sessionAttributes = event.session.attributes;
	   console.log('added session attributes: ', JSON.stringify(sessionAttributes));
	}

  passToOpenAI();
    
function passToOpenAI()
{
        //THESE ARE THE ROLE PLAY SCENARIOS, I'VE GOT IT A BIT HARD CODED BETWEEN STEVE AND TREVOR, ADD A LITTLE MORE JS AN YOU CAN HAVE YOUR OWN NAMES
        var rolePlays=[
        "You are playing the role of Trevor, a sarcastic detective who is getting too old for this crime solving business. Trevor never says more than two sentences at a time. He is trying to interrogate a suspected jewel thief called Steve. He likes to call his Steve a slimeball, dirty rat other nasty words. The robbery took place two days ago at 5pm in downtown New York. Trevor will try to manipulate Steve into admitting to doing the crime. Complete the trascript is as follows. Trevor: take a seat Steve. Steve: Why am I here? Trevor: ",
        "You are playing the role of Trevor, a happy go lucky man who just loves horses. Trevor never says more than two sentences at a time. Your friend Steve is trying to talk you out of buying a horse, but you keep coming up with reasons why you should have the horse. The reasons form rebuttles to Steve's arguments. Transript is as follows. Trevor: I want to buy this horse. Steve: are you sure you can afford it?. Trevor: "];
        var randElement = Math.floor(Math.random()*rolePlays.length);
        var randomRole = rolePlays[randElement];
        console.log('random role: ', randomRole);
        var proxyObject = {};
                   proxyObject = 
				{
				  "model": "text-davinci-003",
				  "prompt": randomRole,
				  "temperature": 1.0,
				  "max_tokens": 150
				};
      if (event.session.new === true) {
            proxyObject = 
				{
				  "model": "text-davinci-003",
				  "prompt": randomRole,	
  			  "temperature": 1.0,
				  "max_tokens": 150
				};
		      sessionAttributes.conversation =proxyObject.prompt; 
        }
        else {
                //get the current converstation
             
                if (sessionAttributes.conversation)
                {
                  console.log(sessionAttributes.conversation);
                  //add a new line
                  sessionAttributes.conversation = sessionAttributes.conversation + ' ';
                }
                else
                {
                    sessionAttributes.conversation = '';
                }
                 sessionAttributes.conversation = sessionAttributes.conversation + 'Steve: '+ event.request.intent.slots.saysTypes.value + '. Trevor: ';
                //append this request as a new line with Human prefix           
                proxyObject.prompt = sessionAttributes.conversation;
            }
        var payload = JSON.stringify(proxyObject);
        console.log('sending this payload: ' + payload);
        // Information required to invoke the API is available in the session
        const https = require('https');
        const apiEndpoint = 'api.openai.com';
        const token = //ADD YOUR OPENAPI KEY STRING HERE

        // The API path
        const apiPath = "/v1/completions";
        const options = {
            host: apiEndpoint,
            path: apiPath,
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
                "Authorization": 'Bearer ' + token,
            },
        };
        const req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            var rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                var chatData = JSON.parse(rawData);
                console.log('reqresp is ' + JSON.stringify(chatData));
                if (chatData === null || chatData === undefined) {
                    var errorObject = {
                        "version": "1.0",
                        "sessionAttributes": {},
                        "response": {
                            "directives": [],
                            "outputSpeech": {
                                "type": "SSML",
                                "ssml": "<speak>I'm sorry, I'm having some trouble processing all this, please try again a little later.</speak>",
                            },
                            "shouldEndSession": true
                        }
                    };
                    console.log(JSON.stringify(errorObject));
                    context.done(null, errorObject);
                    return null;
                }
                sendResponse(chatData);
                return null;
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.write(payload);
        req.end();
}

function sendResponse(openAiResponse) {
    
    if ( openAiResponse["choices"] && openAiResponse["choices"][0])
    {
        sessionAttributes.conversation =  sessionAttributes.conversation + ' ' +  openAiResponse["choices"][0]["text"];  
        outputObject.response.outputSpeech.ssml = openAiResponse["choices"][0]["text"].replace(/.*: /,'');     

		outputObject.response.card.content = openAiResponse["choices"][0]["text"].replace(/.*: /,'');
		outputObject.response.outputSpeech.ssml = '<speak><prosody rate="fast">' + outputObject.response.outputSpeech.ssml + '</prosody></speak>';
		console.log('session attributes : ', JSON.stringify(sessionAttributes.conversation));
	    }
    else
    {
        outputObject.response.outputSpeech.ssml = 'please try again';
    }
    //load attributes into output
    outputObject.sessionAttributes = sessionAttributes;
	console.log('exit log : ' + JSON.stringify(outputObject));
	context.done(null, outputObject);
	return null;
}
	
};
