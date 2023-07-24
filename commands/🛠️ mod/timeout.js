const { Message, EmbedBuilder } = require("discord.js");
module.exports = {
    name: 'timeout',
    description: 'Dar mute a un usuario',
    aliases: ['mute','mutear','silenciar'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        const user = message.mentions.users.first();
        const tiempo = args[1] || 0;
        const razon = args.slice(2).join(' ') || 'Sin motivo';
        const member = await message.guild.members.fetch(user.id).catch(console.error);

        if(user.id === message.author.id) return await message.reply({ content: `No puedes mutearte a ti` });
        if(user.id === client.user.id) return await message.reply({ content: `No puedes mutearme!!` });
        if(member.roles.highest.position >= message.member.roles.highest.position) return await message.reply({ content: `No puedes mutear a alguien con un rol igual o superior al tuyo` });
        if(!member.kickable) return await message.reply({ content: `No puedo mutear a alguien con un rol superior al mio` });
        if(tiempo > 10000) return await message.reply({ content: "El tiempo no puede superar los 10.000 minutos" });

        const embed = new EmbedBuilder()
        .setColor(config.color)

        await user.send({ embeds: [embed.setTitle(`🕒 Fuiste muteado en **${message.guild.name}** durante **${tiempo}** minutos`).setDescription(`**Razón:** ${razon}`).setFooter({ text: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` }).setTimestamp()]}).catch(err => console.log(`No se pudo enviar el mensaje\n${err}`));
        await member.timeout(tiempo * 60 * 1000, razon).catch(console.error);
        await message.reply({embeds: [embed.setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` }).setTitle(`**${user.username}** ha sido muteado`).setThumbnail(`${user.displayAvatarURL()}`).setTimestamp().addFields({ name: `Motivo`, value: `${razon}`, inline: true }, {name: `Tiempo`, value: `${tiempo} minutos`, inline: true}, {name: `Moderador: `, value: `**${message.author.username}**`})]});
    }
}
