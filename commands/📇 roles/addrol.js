const { Message, EmbedBuilder } = require('discord.js');
const reaction = require('../../models/roles');
module.exports = {
    name: 'addrol',
    description: 'Agrega un nuevo rol para los autoroles',
    aliases: ['newrole','agregar-rol'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const rol = message.mentions.roles.first();
        if(!rol) return await message.reply({ content: 'Debes mencionar el rol' });
        const data = await reaction.findOne({ guild: message.guild.id, rolid: rol.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        if(!data){
            await client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            // PEDIR EMOJI
            await msg.edit({ content: 'El emoji para el rol' });
            const filter2 = (m) => m.author.id === message.author.id && m.content !== ' ';
            const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
            if(!response2.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            let emoji = response2.first().content;
            const emojival = client.emojis.cache.find(e => e.name === emoji.name ) || emoji;
            await client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            // PEDIR DESCRIPCCIÓN
            await msg.edit({ content: 'Escribe la info del emoji' });
            const filter3 = (m) => m.author.id === message.author.id && m.content !== ' ';
            const response3 = await message.channel.awaitMessages({ filter3, max: 1, time: 120000 });
            if(!response3.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const info = response3.first().content;
            await client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());    
            // GUARDAR EL EMOJI Y MANDAR MENSAJE DE ACEPTACIÓN
            await reaction.create({
                guild: message.guild.id,
                rolname: rol.name,
                rolid: rol.id,
                emoji: emojival,
                info: info
            });
            return await msg.edit({ content: '', embeds: [embed.setDescription(`${rol} agregado`)] });
        }

        await message.reply({ embeds: [embed.setTitle('Ese rol ya fue agregado')] });
    }
}