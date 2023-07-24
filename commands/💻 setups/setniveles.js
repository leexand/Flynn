const { Message, EmbedBuilder } = require('discord.js');
const validate = require('../../models/validate');
module.exports = {
    name: 'setniveles',
    description: 'Define los niveles y el canal de niveles',
    aliases: ['setupniveles','nivelset'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await validate.findOne({ guild: message.guild.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        if(!data){
            const msg = await message.reply({ content: 'Vas a activar el sistema de niveles\nMenciona el canal' });
            const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
            if(!response.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const channel = response.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(messages => messages.first().delete());
            await msg.edit({ content: 'Deseas activarlo o dejarlo desactivado?\n(Activar o Desactivar)' });
            const filter2 = (m) => m.author.id === message.author.id && (m.content.toLowerCase() === 'activar' || m.content.toLowerCase() === 'desactivar');
            const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
            if(!response2.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const option = response2.first().content;
            if(option.toLowerCase() !== 'activar' && option.toLowerCase() !== 'desactivar') return await msg.edit({ content: `${message.author} tienes que decir si vas a activar o desactivar el sistema\n(Activar o Desactivar)` });
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(messages => messages.first().delete());
            await validate.create({
                guild: message.guild.id,
                set: option,
                canal: channel.id
            });
            if(option.toLowerCase() === 'activar'){
                return await msg.edit({ content: '', embeds: [embed.setTitle('Sistema de niveles activado').setDescription(`Canal donde se mostrarán las actualizaciones de los niveles de cada usuario ${channel}`)] })
            } else if(option.toLowerCase() === 'desactivar'){
                return await msg.edit({ content: '', embeds: [embed.setTitle('Sistema de niveles definido').setDescription(`El sistema de aún no está activado\nPara activarlo usa "/setup-niveles" o "f!setniveles"`)] });
            }
        }

        const request = await message.reply({ embeds: [embed.setTitle('Este server cuenta con sistema de niveles definido').setDescription('- 📝 cambiar canal\n- ✏️ cambiar estado de sistema\n- 🗑️ Borrar\n- ❌ cancelar')] });
        await request.react('📝');
        await request.react('✏️');
        await request.react('🗑️');
        await request.react('❌');

        const collector = request.createReactionCollector({
            filter: (reaction, user) => ['📝','✏️','🗑️','❌'].includes(reaction.emoji.name) && user.id === message.author.id,
            time: 60000
        });
        collector.on('collect', async reaction => {
            if(reaction.emoji.name === '📝'){
                await request.edit({ content: 'Menciona el canal', embeds: [] });
                const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
                const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
                if(!response.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const channel = response.first().mentions.channels.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(messages => messages.first().delete());
                await validate.findOneAndUpdate({ guild: message.guild.id }, { canal: channel.id });
                await request.edit({ content: '', embeds: [embed.setTitle('Canal de actualizaciones de niveles cambiado').setDescription(`El nuevo canal ahora es ${channel}`)] });
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '✏️'){
                await request.edit({ content: 'Activa o desactiva el canal', embeds: [] });
                const filter = (m) => m.author.id === message.author.id && (m.content.toLowerCase() === 'activar' || m.content.toLowerCase() === 'desactivar');
                const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
                if(!response.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const option = response.first().content;
                if(option.toLowerCase() !== 'activar' || option.toLowerCase() !== 'desactivar') return await msg.edit({ content: `${message.author} tienes que decir si vas a activar o desactivar el sistema\n(Activar o Desactivar)` });
                client.channels.cache.get(message.author.id).messages.fetch({ limite: 1 }).then(messages => messages.first().delete());
                await validate.findOneAndUpdate({ guild: message.guild.id }, { set: option });
                if(option.toLowerCase() === 'activar'){
                    await request.edit({ content: '', embeds: [embed.setTitle('El sistema de niveles ahora está activado')] });
                    return await request.reactions.removeAll();
                } else if(option.toLowerCase() === 'desactivar'){
                    await request.edit({ content: '', embeds: [embed.setTitle('El sistema de niveles ahora está en desactivado')] });
                    return await request.reactions.removeAll();
                }
            }
            if(reaction.emoji.name === '🗑️'){
                await validate.deleteOne({ guild: message.guild.id });
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Sistema de niveles desactivado').setDescription('Si quieres volver a activarlo usa "/setup-niveles" o "f!setniveles"')] });
                return request.reactions.removeAll();
            }
            if(reaction.emoji.name === '❌'){
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Cancelado')] });
                return request.reactions.removeAll();
            }
        })
    }
}