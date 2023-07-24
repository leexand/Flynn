const { EmbedBuilder, Message } = require('discord.js');
module.exports = {
    name: 'emojis',
    description: 'Mira los emojis del servidor',
    aliases: ['emojilist','serveremojis'],
    developer: false,
    cooldown: 5,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const emojis = message.guild.emojis.cache.map((e) => `> ${e}  |  **:${e.name}:**`);
        const emojispage = 10;
        const pages = Math.ceil(emojis.length / emojispage);
        let current = 1;

        const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`Lista de emojis de ${message.guild.name}`)
        .setThumbnail(`${message.guild.iconURL({ dynamic: true })}`)
        .setDescription(`${emojis.slice(0, emojispage).join('\n')}`)

        if(emojis.length <= 10) return await message.channel.send({ embeds: [embed] });
        else embed.setFooter({ text: `Página ${current} de ${pages}` })

        const messages = await message.channel.send({ embeds: [embed] });
        await messages.react('⬅️');
        await messages.react('➡️');

        const collector = messages.createReactionCollector({
            filter: (reaction, user) => ['⬅️','➡️'].includes(reaction.emoji.name) && user.id === message.author.id,
            time: 120000
        });

        collector.on('collect', async reaction => {
            const chose = reaction.emoji.name;
            if(chose === '⬅️' && current !== 1){
                current--;
            } else if(chose === '➡️' && current !== pages){
                current++;
            } else {
                return;
            }
            const currentstart = (current - 1) * emojispage;
            const currentend = currentstart + emojispage;

            embed.setDescription(`${emojis.slice(currentstart, currentend).join('\n')}`)
            embed.setFooter({ text: `Página ${current} de ${pages}` });

            await messages.edit({ embeds: [embed] });
            await reaction.users.remove(message.author);
        });
    }
}