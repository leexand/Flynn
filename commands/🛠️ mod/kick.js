const { Message, EmbedBuilder } = require("discord.js");
module.exports = {
    name: 'kick',
    description: 'Expulsar a un usuario',
    aliases: ['sacar','softban','expulsar'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        const user = message.mentions.users.first();
        if(!user) return await message.reply({ content: 'Debes mencionar a un usuario' });
        const razon = args.slice(1).join(' ') || 'Sin motivo';
        const member = await message.guild.members.fetch(user.id).catch(console.error);
        if(user.id === message.author.id) return await message.reply({ content: `No puedes expulsarte a ti` });
        if(user.id === client.user.id) return await message.reply({ content: `No puedes expulsarme!!` });
        if(member.roles.highest.position >= message.member.roles.highest.position) return await message.reply({ content: `No puedes expulsar a alguien con un rol igual o superior al tuyo` });
        if(!member.kickable) return await message.reply({ content: `No puedo expulsar a alguien con un rol superior al mio` });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        await user.send({ embeds: [embed.setTitle(`❕Fuiste expulsado en **${message.guild.name}**`).setDescription(`**Razón:** ${razon}`).setFooter({ text: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` }).setTimestamp()]}).catch(err => console.log(`No se pudo enviar el mensaje\n${err}`));
        await member.kick(razon).catch(console.error);
        await message.reply({ embeds: [embed.setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` }).setTitle(`**${user.username}** ha sido expulsado del servidor`).setThumbnail(`${user.displayAvatarURL()}`).addFields({ name: `Motivo`, value: `${razon}`}, {name: `Moderador: `, value: `**${message.author.username}**`}).setTimestamp()] });
    }
}
