const { Message, ChannelType, EmbedBuilder } = require('discord.js');
const schema = require('../../models/temporal');
module.exports = {
    name: 'setup-voices',
    description: 'Crea el sistema para generar canales de voz temporales',
    aliases: ['createvoices','setup-jointocreate'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await schema.findOne({ guild: message.guild.id });
        if(data) return await message.reply({ embeds: [new EmbedBuilder().setColor(config.color).setDescription(`Ya este servidor cuenta con el sistema de canales temporales\n<#${data.canal}>`)] });

        const category = await message.guild.channels.create({
            name: 'Temporary channels',
            type: ChannelType.GuildCategory
        });
        const channel = await message.guild.channels.create({
            name: '🎙️ | Canales Temporales',
            type: ChannelType.GuildVoice,
            parent: category.id
        });
        await schema.create({
            guild: message.guild.id,
            canal: channel.id,
            cate: category.id,
            limit: 1
        });
        await message.reply({ embeds: [new EmbedBuilder().setColor(config.color).setTitle(`Sistema de canales temporales creado en ${channel}`)] });
    }
}