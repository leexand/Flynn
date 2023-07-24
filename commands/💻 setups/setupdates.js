const { Message, EmbedBuilder } = require('discord.js');
const updates = require('../../models/update');
module.exports = {
    name: 'setupdates',
    description: 'Define el canal de actualizaciones del servidor',
    aliases: ['createupdates','setupupdates'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await updates.findOne({ guild: message.guild.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)
        
        if(!data){
            const msg = await message.reply({ content: 'Menciona el canal' });
            const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
            if(!response.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const channel = response.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            await msg.edit({ content: 'Menciona el rol' });
            const filter2 = (m) => m.author.id === message.author.id && m.mentions.roles.first();
            const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
            if(!response2.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const rol = response2.first().mentions.roles.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            await updates.create({
                guild: message.guild.id,
                canal: channel.id,
                rol: rol.id
            });
            return await msg.edit({ content: '', embeds: [embed.setTitle('Canal y rol de actualizaciones creado').setDescription(`El canal de actualizaciones ahora es ${channel}\nRol a mencionar ${rol}`)] });    
        }

        const request = await message.reply({ embeds: [embed.setTitle('Ya hay un canal de actualizaciones creado').setDescription('- 📝 cambiar\n- 🗑️ Borrar\n- ❌ cancelar')] });
        await request.react('📝');
        await request.react('🗑️');
        await request.react('❌');

        const collector = request.createReactionCollector({
            filter: (reaction, user) => ['📝','🗑️','❌'].includes(reaction.emoji.name) && user.id === message.author.id,
            time: 60000
        });
        collector.on('collect', async reaction => {
            if(reaction.emoji.name === '📝'){
                await request.edit({ content: 'Menciona el nuevo canal', embeds: [] });
                const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
                const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
                if(!response.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const channel = response.first().mentions.channels.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                await request.edit({ content: 'Menciona el rol' });
                const filter2 = (m) => m.author.id === message.author.id && m.mentions.roles.first();
                const response2 = await message.channel.awaitMessages({ filter2, max: 1, time: 15000 });
                if(!response2.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const rol = response.first().mentions.roles.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                await updates.findOneAndUpdate({ guild: message.guild.id }, { canal: channel.id, rol: rol.id });
                await request.edit({ content: '', embeds: [embed.setTitle('Canal de actualizaciones cambiado').setDescription(`El canal de actualizaciones ahora es ${channel}\nRol a mencionar ${rol}`)] });
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '🗑️'){
                await updates.deleteOne({ guild: message.guild.id });
                await request.edit({ embeds: [embed.setTitle('Canal de actualizaciones eliminado').setDescription('Para definir otro canal de actualizaciones usa \`/setup-updates\` o \`f!setupdates\`')] })
                return request.reactions.removeAll();
            }
            if(reaction.emoji.name === '❌'){
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Cancelado')] });
                return await request.reactions.removeAll(); 
            }
        });
    }
}