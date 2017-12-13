const ytdl = require('ytdl-core');
const search = require('youtube-search');
const discord = require('discord.js');
const client = new discord.Client();
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./settings.json'));
const prefix = config.prefix;
const youtubePlaylist = require('youtube-playlist-info');

client.login(config.token);

var options = {
  maxResults: 5,
  key: config.google,
  type: 'playlist,video'
}

client.on('ready', function() {
  console.log('Music Loaded!');
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  return;
});

process.on('error',function(err) {
  console.log(err);
  return;
});

client.on('message', function(message) {
  if (message.channel.id !== '390460958696275979') return;
  if (message.author.id == client.user.id) return;
  const lower = message.content.toLowerCase();
  if(!lower.startsWith(prefix)) return;
  if (lower.startsWith(prefix + 'play')) {
    const input = message.content.split(' ').slice(1).join(' ');
    searchMusic(input,message);
  } else if (lower.startsWith(prefix + 'queue')) {
    if (queue.length == 0) return message.channel.send('Queue is empty');
    var i = 0;
    var queueList = [];
    queue.map(ele => {
      queueList.push(`**${i}:** ${ele.title}`);
      i++
    });
    queueList[0] = queueList[0].replace('**0:**', '**Now Playing:**') + '\n';
    message.channel.send({embed: {
      description: queueList.join('\n'),
      color: 500000
    }});
  } else if (lower.startsWith(prefix + 'skip')) {
    if (dispatcher == undefined) return message.channel.send('Nothing is being played!');
    if (queue[1] == undefined) {
      return dispatcher.end();
    }
    message.channel.send({embed: {
      title: 'Skipped successfully!',
      description: `**Previous item:** ${queue[0].title}\n**Now playing:** ${queue[1].title}}`,
      color: 500000,
      thumbnail: {
        url: queue[1].pic
      }
    }});
    dispatcher.end();
  } else if (lower.startsWith(prefix + 'end')) {
    queue = [];
    message.channel.send('Ending all queue!');
    if (dispatcher !== undefined) {
      return dispatcher.end();
    } else {
      return;
    }
  }
});

function searchMusic(music, message) {
  if (message.member.voiceChannel == null) return message.channel.send('Please join a voice channel!');
  search(music, options, function(err, results) {
    if(err) return console.log(err);
    var list = [];
    var technical = [];
    var i = 0;
    results.map(ele => {
      i++;
      list.push(`**${i}:** ${ele.title} \n **Type:** ${ele.kind.replace('youtube#','')}`);
      technical.push({
        url: ele.link,
        desc: ele.description,
        id: ele.id,
        pic: ele.thumbnails.medium.url,
        title: ele.title,
        type: ele.kind
      });
    });
    const id = message.author.id;
    message.channel.send({embed: {
      title: `Found **${list.length}** items for: ${music}`,
      description: list.join('\n'),
      color: 500000,
      footer: {
        text: "Please write from 1 - 5 the music you want!"
      }
    }}).then(mess => {
      mess.channel.awaitMessages(mess => {
        return mess.author.id == id;
      },{
        max: 1,
        time: 60000,
        errors: ['time']
      }).then(col => {
        var input = parseInt(col.first().content);
        if (isNaN(input)) return message.channel.send('Input is not a number!');
        input = input - 1;
        if (technical[input].type == 'youtube#video') {
          queuePush(technical[input],message.member.voiceChannel,message.channel);
        } else {
          const options = {
            maxResults: 10
          };
          youtubePlaylist(config.google,technical[input].id,options).then(items => {
            var i = 0;
            var inPlaylist = [];
            items.map(ele => {
              queue.push({
                url: 'https://www.youtube.com/watch?v=' + ele.resourceId.videoId,
                desc: ele.description,
                id: ele.resourceId.videoId,
                pic: ele.thumbnails.medium.url,
                title: ele.title,
                type: ele.resourceId.kind
              });
              i++;
              inPlaylist.push(`**${i}:** ${ele.title}`);
            });
            if (dispatcher == undefined) {
              message.channel.send({embed: {
                title: 'Added: ' + items.length + ' items to queue!',
                description: inPlaylist.join('\n'),
                color: 500000
              }});
              playMusic(queue[0].url,message.member.voiceChannel,message.channel);
            }
          });
        }
      }).catch(err => {
        if (err) return message.channel.send("Request Timed Out!");
      });
    });
  });
}

var queue = [];
var dispatcher;
var connection;
function queuePush(object,voice,channel) {
  queue.push(object);
  if (queue.length == 1) {
    channel.send({embed: {
      title: 'Now Playing: ' + object.title,
      description: object.desc,
      thumbnail: {
        url: object.pic
      },
      color: 500000
    }});
    playMusic(queue[0].url,voice,channel);
  } else {
    var queueName = [];
    var i = 0
    queue.map(ele => {
      i++;
      queueName.push(i + ': ' + ele.title);
    });
    channel.send({embed: {
      title: 'Added to Queue: ' + object.title,
      description: object.desc,
      thumbnail: {
        url: object.pic
      },
      color: 500000,
      fields: [
        {
          name: 'Queue:',
          value: queueName.join('\n')
        }
      ]
    }});
  }
}

function playMusic(link,voice,channel) {
  voice.leave();
  voice.join().then(connect => {
    connection = connect;
    const stream = ytdl(link,{filter: 'audioonly'});
    dispatcher = connection.playStream(stream);
    dispatcher.on('end',function() {
      if (queue.length > 1) {
        queue = queue.slice(1);
        playMusic(queue[0].url,voice,channel);
      } else {
        voice.leave();
        channel.send('Queue is empty!');
      }
    });
  });
}
