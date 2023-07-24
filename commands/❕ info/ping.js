const { Message, EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'ping',
    description: 'Mira mi latencia',
    aliases: ['latencia','ms','latency'],
    developer: false,
    cooldown: 5,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                .setColor(config.color)
                .setDescription(`Mi ping actual es ${client.ws.ping} ms`)
            ]
        });
    }
}