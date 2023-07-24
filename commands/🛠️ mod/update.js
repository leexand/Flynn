const { Message, EmbedBuilder } = require("discord.js");
const updates = require('../../models/update');
module.exports = {
    name: 'update',
    description: 'Manda un mensaje de actualización',
    aliases: ['actualizar','actualizacion'],
    developer: false,
    cooldown: 0,
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        if(message.author.id !== '957058633487765514') return;
        const data = await updates.findOne({ guild: message.guild.id });
        const titulo = args[0];
        const content = args.slice(1).join(' ');
        if(!content) return await message.reply({ content: 'Que me actualizaron que!??\nSintaxis: \`f!update <titulo> <texto>\`' });

        if(!data) return await message.reply({ content: 'No hay un canal de actualizaciones' });
        const channel = message.guild.channels.cache.get(data.canal);
        const rol = message.guild.roles.cache.get(data.rol);
        message.delete();
        const mensaje = await channel.send({ content: `${rol}`, embeds: [
            new EmbedBuilder()
            .setColor(config.color)
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTitle(titulo.replace(/,/g, ' '))
            .setDescription(content)
            .setFooter({ text: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` })
            .setTimestamp()
        ] });
        await mensaje.react("🔺");
        await mensaje.react("🔻");
    }
}