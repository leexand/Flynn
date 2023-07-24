const { Message, EmbedBuilder } = require('discord.js');
const sugerencia = require('../../models/sugerencias');
module.exports = {
    name: 'setsugerencia',
    description: 'Define el canal de sugerencia del servidor',
    aliases: ['createsugerencia','setupsugerencia'],
    developer: false,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const data = await sugerencia.findOne({ guild: message.guild.id });
        const embed = new EmbedBuilder()
        .setColor(config.color)
        
        if(!data){
            const msg = await message.reply({ content: 'Menciona el canal' });
            const filter = (m) => m.author.id === message.author.id && m.mentions.channels.first();
            const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
            if(!response.size) return await msg.edit({ content: `${message.author} se acabó el tiempo de espera, intentalo de nuevo` });
            const channel = response.first().mentions.channels.first();
            client.channels.cache.get(message.channel.id).messages.fetch({ limite: 1 }).then(message => message.first().delete());
            await sugerencia.create({
                guild: message.guild.id,
                canal: channel.id
            });
            return await msg.edit({ content: '', embeds: [embed.setTitle('Canal de sugerencias creado').setDescription(`El canal de sugerencias ahora es ${channel}`)] });    
        }

        const request = await message.reply({ embeds: [embed.setTitle('Ya hay un canal de sugerencia creado').setDescription('- 📝 cambiar\n- 🗑️ Borrar\n- ❌ cancelar')] });
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
                await sugerencia.findOneAndUpdate({ guild: message.guild.id }, { canal: channel.id });
                await request.edit({ content: '', embeds: [embed.setTitle('Canal de sugerencias cambiado').setDescription(`El canal de sugerencias ahora es ${channel}`)] });
                return await request.reactions.removeAll();
            }
            if(reaction.emoji.name === '🗑️'){
                await sugerencia.deleteOne({ guild: message.guild.id });
                await request.edit({ embeds: [embed.setTitle('Canal de sugerencias eliminado').setDescription('Para definir otro canal de sugerencias usa \`/setup-sugerencia\` o \`f!setsugerencia\`')] })
                return request.reactions.removeAll();
            }
            if(reaction.emoji.name === '❌'){
                await request.edit({ embeds: [new EmbedBuilder().setColor(config.color).setTitle('Cancelado')] });
                return await request.reactions.removeAll();
            }
        });
    }
}