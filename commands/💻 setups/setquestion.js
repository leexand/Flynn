const { Message, EmbedBuilder } = require('discord.js');
const questions = require('../../models/question');
module.exports = {
    name: 'setquestion',
    description: 'Define el canal donde se mandarán las preguntas del qotd',
    aliases: ['setupquestion','createquestion'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await questions.findOne({ guild: message.guild.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        if(!data){
            // PEDIR CANAL DE PREGUNTAS
            const msg = await message.reply({ content: 'Menciona el canal donde se mandaran las preguntas' });
            const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
            if(!response.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const channel1 = response.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            // PEDIR CANAL DE RESPUESTAS
            await msg.edit({ content: 'Menciona el canal donde se responderá a las preguntas' });
            const filter2 = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
            if(!response2.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const channel2 = response2.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            // PEDIR EL ROL
            await msg.edit({ content: 'Menciona el rol de mención' });
            const filter3 = (m) => m.author.id === message.author.id && m.mentions.roles.first();
            const response3 = await message.channel.awaitMessages({ filter3, max: 1, time: 15000 });
            if(!response3.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const rol = response3.first().mentions.roles.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());    
            await questions.create({
                guild: message.guild.id,
                canal: channel1.id,
                respuesta: channel2.id,
                rol: rol.id
            });
            return await msg.edit({ content: '', embeds: [embed.setTitle('Canal de preguntas creado').setDescription(`El canal donde se enviaran las preguntas será ${channel1}\nCanal donde se responderán las preguntas ${channel2}\nEl rol que se mecionará será ${rol}`)] });
        }

        const request = await message.reply({ embeds: [embed.setTitle('Ya hay un canal de preguntas seleccionado').setDescription('- 📝 cambiar\n- 🗑️ Borrar\n- ❌ cancelar')] })
        await request.react('📝');
        await request.react('🗑️');
        await request.react('❌');

        const collector = request.createReactionCollector({
            filter: (reaction, user) => ['📝','🗑️','❌'].includes(reaction.emoji.name) && user.id === message.author.id,
            time: 60000
        });
        collector.on('collect', async reaction => {
            if(reaction.emoji.name === '📝'){
                 // PEDIR CANAL DE PREGUNTAS
                await request.edit({ content: 'Menciona el nuevo canal', embeds: [] });
                const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
                const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
                if(!response.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const channel1 = response.first().mentions.channels.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                // PEDIR CANAL DE RESPUESTAS
                await request.edit({ content: 'Menciona el nuevo canal de respuestas' });
                const filter2 = (m) => m.author.id === message.author.id && m.mentions.channels.first();
                const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
                if(!response2.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const channel2 = response2.first().mentions.channels.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                // PEDIR EL ROL
                await msg.edit({ content: 'Rol a mencionar' });
                const filter3 = (m) => m.author.id === message.author.id && m.mentions.roles.first();
                const response3 = await message.channel.awaitMessages({ filter3, max: 1, time: 15000 });
                if(!response3.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const rol = response3.first().mentions.roles.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                await questions.findOneAndUpdate({ guild: message.guild.id }, {
                    canal: channel1.id,
                    respuesta: channel2.id,
                    rol: rol.id
                });
                await request.edit({ content: '', embeds: [embed.setTitle('Canal de preguntas actualizado').setDescription(`Canal donde se mandarán las preguntas ${channel1}\nCanal donde se mandaarán las respuestas ${channel2}\nEl rol que se mecionará será ${rol}`)] });
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '🗑️'){
                await questions.deleteOne({ guild: message.guild.id });
                await request.edit({ embeds: [embed.setTitle('Canal de preguntas eliminado').setDescription('Para definir otro canal de preguntas usa \`/setup-question\` o \`f!setquestion\`')] })
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '❌'){
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setDescription('Cancelado')] });
                return await request.reactions.removeAll();
            }
        })
    }
}