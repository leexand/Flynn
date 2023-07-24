const { Message, EmbedBuilder } = require('discord.js');
const reaction = require('../../models/roles');
module.exports = {
    name: 'removerol',
    description: 'Elimine un rol de los autoroles',
    aliases: ['deleterol'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const rol = message.mentions.roles.first();
        if(!rol) return await message.reply({ content: 'Debes mencionar un rol' });

        const data = await reaction.findOne({ guild: message.guild.id, rolid: rol.id });
        if(!data) return await message.reply({ content: 'Este emoji no a sido agredado' });

        await reaction.deleteOne({ guild: message.guild.id, rolid: rol.id });
        await client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
        await message.channel.send({ embeds: [new EmbedBuilder().setColor(config.color).setDescription(`${rol} eliminado`)] });
    }
}