const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./settings.json'));
const prefix = config.prefix;
const role = JSON.parse(fs.readFileSync('./roles.json'));
const discord = require('discord.js');
const client = new discord.Client();
const snek = require('snekfetch');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data');

/*db.serialize(function() {
  db.run("CREATE TABLE tag (name TEXT, info TEXT)");
});*/

client.login(config.token);

client.on('ready', function(){
  console.log(`${client.user.username} is ready`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  return;
});

client.on('guildMemberAdd', function(member) {
  if (member.guild.id !== '327610489871925249') return;
  const channel = client.guilds.get('327610489871925249').channels.get('386466429467099137');
  channel.send({embed: {
    title: "Hello and welcome to the server!",
    color: 6038109,
    description: `<@${member.id}>, to start off, please let us know your in-game name!`,
    footer: {
      text: "Request will timed out after 5 minutes"
    }
  }}).then(message => {
    const id = message.author.id;
    message.channel.awaitMessages(input => {
      return input.author.id == member.id;
    }, {
      time: 300000,
      max: 1,
      errors: ['time']
    }).then(collected => {
      const input = collected.first().content;
      channel.send({embed: {
        title: "Success!",
        color: 6038109,
        description: `<@${member.id}>, your new nick will be: **${input}**\nPlease choose your team by reacting to this message!\n\n<:lr4f:383372919373430794> for LR4F\n\n<:5ton:383372919310516234> for 5TON\n\n<:catteam:383372919381950464> for CATS(Stray_cat)`,
        footer: {
          text: "You will be automatically assigned Wiki role after 5 minutes!"
        }
      }}).then(message => {
        const lr4f = client.emojis.get('383372919373430794');
        const ston = client.emojis.get('383372919310516234');
        const cat = client.emojis.get('383372919381950464');
        const timeout = setTimeout(function () {
          message.channel.send({embed: {
            title: "Timeout!",
            description: `<@${member.id}>, your role will be **Wiki**`
          }});
          message.delete();
        }, 300000);
        message.react(lr4f).then(() => {
          message.react(ston).then(() => {
            message.react(cat);
          });
        });
        message.awaitReactions(reaction => {
          if (reaction.count > 1) {
            var team;
            message.delete();
            clearTimeout(timeout);
            if (reaction._emoji == lr4f) {
              team = "LR4F";
              member.addRole(role.lr4f);
            } else if (reaction._emoji == ston) {
              team = "5TON";
              member.addRole(role.ston);
            } else if (reaction._emoji == cat) {
              team = "CATS";
              member.addRole(role.cats);
            }
            channel.send({embed: {
              color: 6038109,
              title: "Success!",
              description: `<@${member.id}>, you have successfully joined **${team}**\nCongratulations! Now I invite you to check our <#330660654375501824>, <#327613279394463744> and <#327613450475798530> channels`
            }});
          }
        });
      });
      member.setNickname(input).catch(err => {
        if (err) {
          return message.channel.send("❌ I don't have permission to change people's nickname!");
        }
      });
    }).catch(err => {
      channel.send(`<@${member.id}> request timed out!`);
    });
  });
});

client.on('message', function(message) {
  if (message.author.id == client.user.id) return;
  if (!message.content.startsWith(prefix)) return;
  const lower = message.content.toLowerCase();
  if (lower.startsWith(prefix + 'purge')) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(`<@${message.author.id}>, you have no perm for this command!`);
    const input = message.content.split(' ').slice(1).join('');
    message.channel.bulkDelete(parseInt(input) + 1);
  } else if (lower.startsWith(prefix + 'cat')) {
    var image = '';
    const input = message.content.split(' ').slice(1);
    snek.get('https://catfact.ninja/fact?max_length=1000').then(res => {
      const text = JSON.parse(res.text).fact;
      snek.get('http://random.cat/meow').then(res => {
        const image = JSON.parse(res.text).file;
        message.channel.send({embed: {
          title: "Cat Fact!",
          color: Math.round(Math.random() * 16777215),
          description: `Did you know: ${text}`,
          image:{
            url: image
          }
        }});
      });
    });
  } else if (lower.startsWith(prefix + 'invite')) {
    message.channel.send({embed: {
      title: "It seems like you are interested in this bot!",
      color: 4372980,
      description: "[__**CLICK ME**__](https://discordapp.com/api/oauth2/authorize?client_id=383344287024152627&scope=bot&permissions=1) to invite it to your server!"
    }});
  } else if (lower.startsWith(prefix + 'car')) {
    snek.get('https://funfactz.com/tags/car/random/')
    .then(res => {
      const input = res.text;
      const value = input.substring(input.indexOf('<div class="fact_text"') + 39, input.indexOf('<div class="fact_text"') + 300);
      const fact = value.split('<').slice(0,1).join('');
      snek.get('https://pixabay.com/api/?key=7194685-1f142c0977028bfadc6cd5c42&q=car&image_type=photo&pretty=true')
      .then(res => {
        const input = JSON.parse(res.text);
        const hit = input.hits.length;
        const image = input.hits[Math.round(Math.random() * hit)].webformatURL;
        message.channel.send({embed: {
          color: Math.round(Math.random() * 16777215),
          title: "Car Facts!",
          description: `Did you know: ${fact}`,
          image: {
            url: image
          }
        }});
      });
    });
  } else if (lower.startsWith(prefix + 'wiki')) {
    const input = message.content.split(' ').slice(1).join(' ');
    const writer = message.author;
    snek.get(`http://rr3.wikia.com/wiki/Special:Search?search=${input}`)
    .then(res => {
      const result = res.text.substring(res.text.indexOf('class="Results"'), res.text.indexOf('class="Results"')  + 50000).replace(/\t/g,'').replace(/\n/g,'');
      var outputs = result.match(/<h1>(.*?)<\/h1>/g);
      outputs = outputs.slice(0,6);
      outputs.splice(2,1);
      var link = [];
      var title = [];
      outputs.map(ele => {
        link.push(ele.substring(ele.indexOf('http:'), ele.indexOf('"',ele.indexOf('http:'))));
        title.push(ele.substring(ele.indexOf(' >') + 2, ele.indexOf('<', ele.indexOf(' >'))))
      });
      var i = 0;
      title.map(ele => {
        i++
        title[i - 1] = `**${i}:** ${ele}`
      });
      var upper = input.split('');
      upper[0] = upper[0].toUpperCase();
      upper = upper.join('');
      message.channel.send({embed: {
        title: `Top 5 results for: ${upper} (Click to go to Wiki)`,
        url: 'http://rr3.wikia.com/wiki/Special:Search?search=${input}',
        color: 766651,
        description: title.join('\n'),
        footer: {
          text: "Please specify the number of the search you want, result timeout after 1 minute!"
        }
      }}).then(message => {
        message.channel.awaitMessages(input => {
          return input.author.id == writer.id;
        }, {
          max: 1,
          time: 60000,
          errors: ['time']
        }).then(col => {
          message.delete();
          var input = parseInt(col.first().content);
          if (isNaN(input)) return message.channel.send("Invalid Number");
          if (input > 5) return message.channel.send("Number too large!");
          if (input < 1) return message.channel.send("Number too small!");
          input = input - 1;
          snek.get(link[input]).then(res => {
            const first = res.text.substring(res.text.indexOf('<p>'),res.text.indexOf('</p>')).replace(/<(.*?)\>/g,'');
            const second = res.text.substring(res.text.indexOf('<p>',res.text.indexOf('</p>')),res.text.indexOf('</p>',res.text.indexOf('<p>',res.text.indexOf('</p>')))).replace(/<(.*?)\>/g,'')
            const image = res.text.substring(res.text.indexOf('class="pi-item pi-image"'), res.text.indexOf('class="pi-item pi-image"') + 5000).match(/(https?:\/\/.*\.(?:png|jpg))/g)[0];
            message.channel.send({embed: {
              title: `Results for: ${title[input].substring(7,99)}`,
              color: 766651,
              fields: [
                {
                  name: "First Paragraph",
                  value: first
                },
                {
                  name: "Second Paragraph",
                  value: second
                }
              ],
              image: {
                url: image
              }
            }});
          });
        });
      })
    });
  } else if (lower.startsWith(prefix + 'eval')) {
    if (message.author.id !== '163434302758060033') return;
    const input = message.content.split(' ').slice(1).join(' ');
    try {
      const evaled = eval(input);
      return message.channel.send({embed: {
        description: "**__Success!__**",
        color: 3332109,
        fields: [
          {
            name: "Input",
            value: '```' + input + '```'
          },
          {
            name: "Output",
            value: '```' + evaled + '```'
          }
        ]
      }});
    } catch (err) {
        const error = err.toString();
        if(err) return message.channel.send({embed: {
          description: "**__Error!__**",
          color: 14169103,
          fields: [
            {
              name: "Input",
              value: '```' + input + '```'
            },
            {
              name: "Output",
              value: '```' + error + '```'
            }
          ]
        }});
    }
  } else if (lower.startsWith(prefix + 'test')) {
    message.channel.send('Test!')
    .then(message => {
      message.react('☑');
      message.awaitReactions(reaction => {
        if (reaction.count > 1) {
          if (reaction._emoji.name == '☑') return message.channel.send('You chosed ☑');
        }
      },{
        time: 10000,
        errors: ['time']
      }).catch(err => {
        message.channel.send("Timed out!");
      });
    });
  } else if (lower.startsWith(prefix + 'change')) {
    if (message.author.id !== '163434302758060033') return;
    const input = message.content.split(' ').slice(1).join(' ');
    fs.writeFileSync('./test.txt',input);
  } else if (lower.startsWith(prefix + 'read')) {
    message.channel.send(fs.readFileSync('./test.txt','utf-8'));
  }
});
