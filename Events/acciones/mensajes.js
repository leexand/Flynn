const { Collection, EmbedBuilder } = require('discord.js');
const cooldowns = new Collection();
const config = require('../../config.json');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client){
        const prefix = 'f!';
        if(!message.content.startsWith(prefix) || message.author.bot) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const comando = client.prefix.get(command) || client.prefix.find((cmd) => cmd.aliases && cmd.aliases.includes(command));
        if(!comando) return;
        if(comando.developer && !config.developer.includes(message.author.id)){
            return await message.reply({ content: 'Comando solo para developers' });
        }
        if(!cooldowns.has(comando.name)){
            cooldowns.set(comando.name, new Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(comando.name);
        const cooldownAmount = (comando.cooldown || 0) * 1000;
        if(timestamps.has(message.author.id)){
            const expired = timestamps.get(message.author.id) + cooldownAmount;
            if(now < expired){
                const timeleft = (expired - now) / 1000;
                return message.reply({ embeds: [new EmbedBuilder().setColor(config.color).setTitle(`${message.author.username} espera ${timeleft.toFixed()} segundos para usar el comando nuevamente`)] })
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    
        await comando.execute(message, client, args, config);
    }
}