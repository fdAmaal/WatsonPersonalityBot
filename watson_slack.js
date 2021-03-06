var Botkit = require('./Botkit.js');

var bot = Botkit.slackbot();

var watson = require('watson-developer-cloud');

var personality_insights = watson.personality_insights({
  username: 'your personality insights username goes here',
  password: 'your personality insights pw goes here',
  version: 'v2'
});

bot.startRTM({
  team: {
    token: process.env.token
  }
},function(err,connection,payload) {
  if (err) {
    console.log('AN ERROR OCCURRED',err);
  }
});

bot.hears(['Hi Watson'],'ambient,mention',function(message) {
  
  bot.reply(message,'Hi!');

  bot.startTask(message,function(task,convo) {
      convo.ask('Would you like to learn about Personality Insights?',[
        {
          callback: function(response,convo) { console.log('YES'); convo.say('Awesome. Personality Insights is an API that divides personalities into five different characteristics. You can try it out with this channel by calling "@IBMWatson_Bot /analyze" in the channel.'); convo.next(); },
          pattern: bot.utterances.yes,
        },
        {
          callback: function(response,convo) { console.log('NO');  convo.say("Alright, but you're missing out!"); convo.next();},
          pattern: bot.utterances.no,
        },
        {
          default: true,
          callback: function(response,convo) { console.log('DEFAULT'); convo.say('Huh?'); convo.repeat(); convo.next(); }
        }
    ])
  })
});

bot.hears(['analyze'],'direct_message,direct_mention',function(message) {

    bot.api.channels.history({

      channel: message.channel,
    },function(err,history) {
      //count: 500,

      if (err) {
        console.log('ERROR',err);
      }

      var messages = [];
      for (var i = 0; i < history.messages.length; i++) {
        messages.push(history.messages[i].text);
      }

      // call the watson api with your text
      var corpus = messages.join("\n");

      personality_insights.profile(
        {
          text: corpus,
          language: 'en'
        },
        function (err, response) {
          if (err) {
            console.log('error:', err);
          } else {

            bot.startTask(message,function(task,convo) {

              // response.tree.children.children is a list of the top 5 traits
              var top5 = response.tree.children[0].children[0].children;
              console.log(top5);
              for (var c = 0; c <  top5.length; c++) {

                  convo.say('This channel has ' + Math.round(top5[c].percentage*100) + '% ' + top5[c].name);

              }
              bot.reply(message,'You can learn more about Personality Insights using Node here: https://github.com/watson-developer-cloud/personality-insights-nodejs' );
            });
          }
        }
      );
    });
})


