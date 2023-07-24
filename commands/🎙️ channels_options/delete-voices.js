const { Message, EmbedBuilder } = require('discord.js');
const schema = require('../../models/temporal');
module.exports = {
    name: 'delete-voices',
    description: 'Crea el sistema para generar canales de voz temporales',
    aliases: ['removevoices','delete-jointocreate'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, config){
        const data = await schema.findOne({ guild: message.guild.id });
        if(!data) return await message.reply({ embeds: [new EmbedBuilder().setColor(config.color).setDescription(`Este servidor no cuenta con el sistema de canales temporales`)] });
        
        const voiceChannel = await client.channels.fetch(data.canal);
        await voiceChannel.delete();

        const categoryChannel = await client.channels.fetch(data.cate);
        await categoryChannel.delete();

        await schema.deleteOne({ guild: message.guild.id });
        await message.reply({ embeds: [new EmbedBuilder().setColor(config.color).setTitle(`Sistema de canales temporales eliminado`)] });
    }
}