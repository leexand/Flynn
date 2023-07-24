const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    name: 'avatar',
    description: 'Ver el avatar y/o banner de un usuario.',
    aliases: ['imagen','banner','perfil'],
    developer: false,
    cooldown: 5,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const user = message.mentions.users.first() || message.author;
        const banner = await (await client.users.fetch(user.id, { force: true })).bannerURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
        .setColor(config.color)
        .setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` })
    
        const cmp = new ActionRowBuilder()

        .addComponents(
            new ButtonBuilder()
            .setCustomId('avatar')
            .setLabel('Avatar')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('banner')
            .setLabel('Banner')
            .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
            .setCustomId('eliminar')
            .setLabel('Eliminar')
            .setStyle(ButtonStyle.Danger)
        )
        const cmp2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('avatar')
            .setLabel('Avatar')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId('banner')
            .setLabel('Banner')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('eliminar')
            .setLabel('Eliminar')
            .setStyle(ButtonStyle.Danger)
        )

        const mensaje = await message.channel.send({ embeds: [embed.setURL(user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' })).setImage(user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' }))], components: [cmp] });
        const collector = await mensaje.createMessageComponentCollector();

        collector.on('collect', async i => {
            if(i.customId === 'avatar'){
                if(i.user.id !== message.author.id) return;
                await i.update({ embeds: [new EmbedBuilder().setColor(config.color).setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` }).setURL(user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' })).setImage(user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' }))], components: [cmp] });
            }
            if(i.customId === 'banner'){
                if(i.user.id !== message.author.id) return;
                await i.update({ embeds: [new EmbedBuilder().setColor(config.color).setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` }).setDescription(banner ? " " : 'el usuario no tienen banner').setTitle('Descargar').setURL(banner).setImage(banner)], components: [cmp2] });
            }
            if(i.customId === 'eliminar'){
                if(i.user.id !== message.author.id) return;
                mensaje.delete();
            }
        });
    }
}