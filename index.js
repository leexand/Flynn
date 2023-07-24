const { Client, Partials, Collection } = require('discord.js');
const { User, Message, GuildMember, ThreadMember } = Partials;
const client = new Client({
    intents: 3276799,
    partials: [User, Message, GuildMember, ThreadMember],
});

const { loadPrefix } = require('./Handlers/prefixHandler');
const { loadEvents } = require('./Handlers/eventHandler');
const { loadModals } = require('./Handlers/modalHandler');
const { loadButtons } = require('./Handlers/buttonHandler');

client.config = require('./config.json');
client.events = new Collection();
client.prefix = new Collection();
client.buttons = new Collection();
client.modals = new Collection();

loadPrefix(client);
loadEvents(client);
loadModals(client);
loadButtons(client);
require(`./Handlers/anti-crash`)(client);

client.on('messageCreate', async message => {
    if(message.content.includes('gacha') && message.content.includes('gif')) await message.delete();
    // if(message.content.includes('@everyone') || message.content.includes('@here')){
    //     await message.delete();
    //     return await message.channel.send({ embeds: [new EmbedBuilder().setColor(client.config.color).setDescription(`**${message.author.username}** habia hecho una mención global, no sé preocupen, ya lo elimine\nEspero no vuelva a hacerlo`)] });
    // }
});

client.login(client.config.token);