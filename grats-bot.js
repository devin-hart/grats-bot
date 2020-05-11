const Discord = require('discord.js');
const client = new Discord.Client();
const {
    JSDOM
} = require("jsdom");
const {
    window
} = new JSDOM("");
const $ = require("jquery")(window);
const axios = require('axios');

require('dotenv').config();

client.login(process.env.API_KEY);

console.log('Grats Bot Initialized');

let timesUsed = 0;
let count = 0;

client.on('message', async message => {
    timesUsed = timesUsed + 1;
    
    switch (message.content) {
        case '!grats':
            if (message.member.voice.channel) {
                const connection = await message.member.voice.channel.join();

                connection.play(require("path").join(__dirname, './blow-it-out.mp3'));
                console.log('Playing the Duke');

                connection.on('error', error => {
                    console.log(error)
                });

                connection.on('finish', () => {
                    console.log('Finished playing!');
                });

                setTimeout(() => {
                    message.member.voice.channel.leave();
                }, 3000);

                timesUsed = timesUsed + 1;

                console.log("timesUsed ", timesUsed);
            } else {
                message.reply("Only works if you're in a voice channel.");
            }
            break;

        case '!leave':
            if (message.member.voice.channel) {
                message.member.voice.channel.leave();
            }
            break;

        case '!time':
            let today = new Date();
            let cmas = new Date(today.getFullYear(), 04, 27);

            if (today.getMonth() == 11 && today.getDate() > 27) {
                cmas.setFullYear(cmas.getFullYear() + 1);
            }

            var one_day = 1000 * 60 * 60 * 24;

            message.channel.send(`Days left until Aradune: ${Math.ceil((cmas.getTime() - today.getTime()) / (one_day))}`);

            break;

        case '!help':
            message.channel.send(`List of commands:

    !time - display time until Aradune launch 
    !grats - congratulates player in voice channel on achievement
    !leave - tell grats-bot to leave voice channel
    !item - !item + item name for specific item stats
    !fuzzy - !fuzzy + item name for fuzzy search of items. Only displays 10 results
            `);
            break;

        default:
            break;
    }

    if (message.content.match(/!item\s(.*)/) && message.member.user.bot === false) {
        console.log('Initialize Item Search');
        let itemName = message.content.split('!item ')[1].toLowerCase();
        let searchQuery = itemName.replace(/\s/g, '+')
        const searchUrl = `https://everquest.allakhazam.com/search.html?q=${searchQuery}#Items`;

        let itemLinks = [];

        const noItems = () => {
            message.channel.send(`No results for ${itemName}`);
        }

        axios(searchUrl)
            .then(response => {
                const html = response.data;

                if ($(html).find('#col-main-inner-3 b').text() === `Nothing found for "${itemName}"`) {
                    noItems();
                    return false;
                } else {
                    const queryItems = $(html).find('#Items_t tr td a').toArray();

                    queryItems.forEach(item => {
                        if ($(item).text().toLowerCase() === itemName) {
                            itemLinks.push(Number($(item).attr('href').split('/db/item.html?item=')[1]));
                        }
                    })
                }
            })
            .then(() => {
                console.log('###---NEXT AXIOS REQUEST---###');

                if (itemLinks.length) {
                    axios(`https://everquest.allakhazam.com/db/item.html?item=${itemLinks}`).then(response => {
                        const html = response.data;
                        let itemTitle = $(html).find('h1').text().trim();
                        let itemDesc = $(html).find('.nobgrd').text();
                        let itemImg = $(html).find('.itemicon').attr('src');

                        message.channel.send({
                            embed: {
                                color: 3447003,
                                author: {
                                    name: itemTitle,
                                    icon_url: itemImg
                                },
                                description: `${itemDesc}\nhttps://everquest.allakhazam.com/db/item.html?item=${itemLinks}`
                            }
                        });
                    })
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    if (message.content.match(/!fuzzy\s(.*)/) && message.member.user.bot !== true) {
        console.log(message.member.user);

        console.log('Initialize Fuzzy Search');

        let itemName = message.content.split('!fuzzy ')[1].toLowerCase();
        let searchQuery = itemName.replace(/\s/g, '+')

        const searchUrl = `https://everquest.allakhazam.com/search.html?q=${searchQuery}`;

        axios(searchUrl)
            .then(response => {
                const html = response.data;

                if ($(html).find('b').text() === `Nothing found for "${itemName}"`) {
                    message.channel.send(`No results for "${itemName}".`);
                    return false;
                } else {
                    const fuzzySearchItems = $(html).find('#Items_t tr td a').toArray();

                    let fuzzyArr = [];

                    fuzzySearchItems.forEach((item, index) => {
                        if ($(item).text().length && index < 20) {
                            fuzzyArr.push($(item).text())
                        }
                    });

                    fuzzyArr = fuzzyArr.toString().replace(/,/g, '\n');

                    message.channel.send({
                        embed: {
                            color: 3447003,
                            description: `Top 10 results for "${itemName}":\n\n${fuzzyArr}\n\n${searchUrl} for all results.`
                        }
                    });
                }
            })
            .catch(console.error);
    }
});

