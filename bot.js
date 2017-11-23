const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./settings.json'));
const prefix = config.prefix;
const role = JSON.parse(fs.readFileSync('./roles.json'));
const discord = require('discord.js');
const client = new discord.Client();

client.login(config.token);

client.on('ready', function(){
  console.log("I am Ready!");
});

client.on('guildMemberAdd', function(member) {
  const channel = client.guilds.get('327610489871925249').channels.get('327610489871925249');
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
              description: `<@${member.id}>, you have successfully joined **${team}**`
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
    message.channel.bulkDelete(input);
  }
});
