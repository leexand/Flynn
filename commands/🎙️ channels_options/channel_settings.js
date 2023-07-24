const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    name: 'settings',
    description: 'Configuración de los canales de voz temporales',
    aliases: ['tempsettings','ajustesvoz'],
    developer: false,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const dev = await client.users.fetch(config.developer[0]);

        const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle('Configuración de canales temporales')
        .setThumbnail(message.guild.iconURL())
        .setDescription('**🎙️ Panel para configuración de canales**\n\nUtiliza los botones aqui abajo para dar configuraciones a los canales de tú propiedad\n\n**NOTA:** Es importante que estes en un canal de voz al momento de usar estos botones\n\n- 🔒 Poner el canal privado\n- 🔓 Poner el canal publico\n- 🔢 Editar la cantidad de usuarios que pueden ingresar\n- 🛠️ Agregar un administrador al canal\n- 🙎 Usuario que puede ver el canal de voz\n- 🚪 Usuario que no puede ver el canal de voz')
        .setFooter({ text: `© ${dev.username}` })

        const btn = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('block')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('unblock')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('cant')
            .setEmoji('🔢')
            .setStyle(ButtonStyle.Secondary)
        )
        const btn2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('mod')
            .setEmoji('🛠️')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('add')
            .setEmoji('🙎')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('remove')
            .setEmoji('🚪')
            .setStyle(ButtonStyle.Secondary)
        )

        await message.channel.send({ embeds: [embed], components: [btn,btn2] });
    }
}