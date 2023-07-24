const { Message, EmbedBuilder } = require("discord.js");
const sugerencia = require('../../models/sugerencias');
module.exports = {
    name: 'sugerencia',
    description: 'Sugiere algo al servidor',
    aliases: ['sugerir'],
    developer: false,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await sugerencia.findOne({ guild: message.guild.id });
        const description = args.join(' ');
        
        if(!data) return;
        const canal = message.guild.channels.cache.get(data.canal);
        const mensaje = await canal.send({ 
            embeds: [
                new EmbedBuilder()
                .setAuthor({ name: `Suguerencia de ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setColor(config.color)
                .setDescription(`${description}`)
                .setFooter({ text: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` })
                .setTimestamp()
            ]
        });
        await mensaje.react("✅");
        await mensaje.react("⛔");
    }
}