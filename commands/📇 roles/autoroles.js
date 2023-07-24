const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const reaction = require('../../models/roles');
module.exports = {
    name: 'autoroles',
    description: 'Muestra el panel de los autoroles',
    aliases: ['roles','listroles'],
    developer: true,
    cooldown: 10,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await reaction.find({ guild: message.guild.id });
        if(!data || data.length === 0) return await message.reply({ content: 'No hay roles guardados' });
        const dev = await client.users.fetch(config.developer[0]);
        
        const info = data.map(data => {
            const emoji = client.emojis.cache.find(emoji => emoji.name === data.emoji.name);
            const dates = `> ${emoji || data.emoji} | **${data.rolname}**: *${data.info}*`
            return dates;
        });

        const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`Autoroles de ${message.guild.name}`)
        .setThumbnail(message.guild.iconURL())
        .setDescription(`Escoge un rol del menú\nEl rol se te agregará si no lo tienes o se te quitara si lo tienes\n\n${info.join('\n')}`)
        .setFooter({ text: `© ${dev.username}` })

        const buttons = data.map(data => {
            const emoji = client.emojis.cache.find(emoji => emoji.name === data.emoji.name);
            const button = new ButtonBuilder()
            .setCustomId(data.rolid)
            .setLabel(data.rolname)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emoji || data.emoji)
            return button;
        });

        const btns = new ActionRowBuilder().addComponents(buttons);
        await message.channel.send({ embeds: [embed], components: [btns] });
    }
}