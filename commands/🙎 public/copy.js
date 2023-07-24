const { Message } = require("discord.js");
module.exports = {
    name: 'copy',
    description: 'Manda un mensaje como si fueses otro usuario',
    aliases: ['replace','copiar','clonar'],
    developer: false,
    cooldown: 10,
    /**
     * 
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        const user = message.mentions.users.first();
        if(!user) return await message.reply({ content: 'Debes mencionar a un usuario' });
        if(user.id === '1087195042399141898'){
            await message.delete();
            return await message.reply({ content: 'No puedes usarme para tus mañas' });
        }
        const mensaje = args.slice(1).join(' ');
        if(!mensaje) return await message.reply({ content: 'Que quieres que diga?' });
        const member = message.guild.members.cache.get(user.id);

        await message.delete(); 
        const webhook = await message.channel.createWebhook({
            name: member.nickname || member.username,
            avatar: member.displayAvatarURL(),
        });

        await webhook.send({ content: mensaje });
        await webhook.delete();
    }
}