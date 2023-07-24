const { Message, EmbedBuilder } = require('discord.js');
const bienvenida = require('../../models/bienvenidas');
module.exports = {
    name: 'setbienvenida',
    description: 'Define el canal donde se mandarán las bienvenidas',
    aliases: ['setupwelcome','welcomes','setwelcome'],
    developer: true,
    cooldown: 5,
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        const data = await bienvenida.findOne({ guild: message.guild.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        if(!data){
            const msg = await message.reply({ content: `menciona el canal donde se mandarán las bienvenidas` });
            const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response = await message.channel.awaitMessages({filter,  max: 1, time: 15000 });
            if(!response.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const canal = response.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            await bienvenida.create({
                guild: message.guild.id, 
                channel: canal.id
            });
            return await msg.edit({ content: '', embeds: [embed.setTitle('Canal de bienvenidas definido!').setDescription(`El canal de bienvenidas ahora es ${canal}`)] });
        }

        const request = await message.reply({ embeds: [embed.setTitle('Ya hay canal de bienvenidas definido').setDescription('- cambiarlo 📝\n- eliminarlo  🗑️\n- cancelar ❌')] });
        await request.react('📝');
        await request.react('🗑️');
        await request.react('❌');

        const collector = request.createReactionCollector({
            filter: (reaction, user) => ['📝','🗑️','❌'].includes(reaction.emoji.name) && user.id === message.author.id,
            time: 15000
        });
        collector.on('collect', async reaction => {
            if(reaction.emoji.name === '📝'){
                await request.edit({ content: 'menciona el canal donde se mandarán las bienvenidas', embeds: [] });
                const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
                const response = await message.channel.awaitMessages({filter,  max: 1, time: 15000 });
                if(!response.size) return await request.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
                const canal = response.first().mentions.channels.first();
                client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
                await bienvenida.create({
                    guild: message.guild.id, 
                    channel: canal.id
                });
                await request.edit({ content: '', embeds: [embed.setTitle('Canal de bienvenidas cambiado!').setDescription(`El canal de bienvenidas ahora es ${canal}`)] });
                return await request.reactions.removeAll(); 
            }
            if(reaction.emoji.name === '🗑️'){
                await bienvenida.deleteOne({ guild: message.guild.id });
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Canal de bienvenidas eliminado!')] });
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '❌'){
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Cancelado')] });
                return await request.reactions.removeAll();
            }
        });
    }
}