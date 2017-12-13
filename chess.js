const chessGame = require('chess.js').Chess;
const jimp = require('jimp');
const imgur = require('imgur');

const chess = new chessGame();
const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';



client.on('message', function(message) {
  if (message.content == 'test') {
    chess.move('Nc3')
    console.log(chess.fen());
  }
  if (message.author.id == client.user.id) return;
  if (!message.content.toLowerCase().startsWith(prefix + 'chess')) return;
  if (message.content.toLowerCase().startsWith(prefix + 'chess')) {
    const input = message.content.toLowerCase().split(' ').slice(1);
    var start = false;
    if (input[0] == 'help') {
      message.channel.send('Help Function!');
    } else if (input[0] == 'start') {
      var imagePlayers;
      var player1 = [];
      var player2 = [];
      message.channel.send('You have requested a game!\nReact 1⃣to be **Player One**\nReact 2⃣ to be **Player Two**')
      .then(message => {
        message.react('1⃣').then(() => {
          message.react('2⃣');
        });
        message.awaitReactions(reaction => {
          if(reaction.count > 1) {
            if (reaction._emoji.name == '1⃣') {
              reaction.users.array().map(ele => {
                player1.push(ele.id);
              });
              if (player1[1] == player2[1]) {
                reaction.remove(message.guild.members.get(player1[1]));
                player1 = [];
              } else if (player1[1] !== undefined && player2[1] !== undefined) {
                start = true;
                return message.delete();
              }
            } else if (reaction._emoji.name == '2⃣') {
              reaction.users.array().map(ele => {
                player2.push(ele.id);
              });
              if (player2[1] == player1[1]) {
                reaction.remove(message.guild.members.get(player2[1]));
                player2 = [];
              } else if (player1[1] !== undefined && player2[1] !== undefined) {
                start = true;
                return message.delete();
              }
            }
          }
        },{
          time: 120000,
          errors: ['time']
        }).catch(err => {
          if (err) {
            return message.delete();
          }
        });
        var check = setInterval(() => {
          if (start) {
            clearInterval(check);
            player1 = player1[1];
            player2 = player2[1];
            function chessFunc(id1,id2,fen,channel) {
              const ava1 = channel.guild.members.get(id1).user.avatarURL;
              const ava2 = channel.guild.members.get(id2).user.avatarURL;
              jimp.read('./images/canvas.png', function(err, canvas) {
                jimp.read(ava1, function(err, ava1) {
                  jimp.read(ava2, function(err, ava2) {
                    ava1.resize(256,256);
                    ava2.resize(256,256);
                    canvas.composite(ava1,19,74);
                    canvas.composite(ava2,421,74);
                    canvas.write('./images/output.png');
                  });
                });
              });
                const check = setInterval(() => {
                  if (fs.existsSync('./images/output.png')) {
                    clearInterval(check);
                    if (!imagePlayers) {
                      imgur.uploadFile('./images/output.png')
                      .then(function (json) {
                        fs.unlinkSync('./images/output.png');
                        imagePlayers = json.data.link;
                        channel.send({embed: {
                          thumbnail:{
                            url: imagePlayers
                          },
                          color: 2805992,
                          title: 'Game Created Successfully!',
                          image: {
                            url: `http://www.fen-to-image.com/image/36/double/coords/${fen}`
                          },
                          footer: {
                            text: 'Please specify your moves, either by standard (Example: Nb5) or squares (Example: e4-e5)'
                          }
                        }});
                      })
                      .catch(function (err) {
                        console.error(err.message);
                      });
                    } else {
                      channel.send({embed: {
                        thumbnail:{
                          url: imagePlayers
                        },
                        color: 2805992,
                        title: 'Move Successfully!',
                        image: {
                          url: `http://www.fen-to-image.com/image/36/double/coords/${fen}`
                        }
                      }});
                    }
                    channel.awaitMessages(mess => {
                      return mess.author.id == player1 || mess.author.id == player2
                    },{
                      max: 1,
                      time: 300000,
                      errors: ['time']
                    }).then(col => {
                      const input = col.first().content;
                      chess.move(input, {sloppy: true});
                      chessFunc(player1,player2,chess.fen().replace(/\ /g,''),message.channel);
                    }).catch(err => {
                      return channel.send("Inactive game, stopping!");
                    });
                  }
                },1000);
            }
            chessFunc(player1,player2,defaultFen,message.channel);
          }
        },1000);
      });
    }
  }
});
