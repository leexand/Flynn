const { Message, EmbedBuilder } = require("discord.js");
const questions = require('../../models/question');
module.exports = {
    name: 'question',
    description: 'Has una pregunta para el server',
    aliases: ['pregunta','qotd'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){
        const data = await questions.findOne({ guild: message.guild.id });
        const question = args.join(' ');
        if(!question) return await message.reply({ content: 'Que vas a preguntar que!!?' });

        if(!data) return await message.reply({ content: 'No hay un canal de preguntas, por lo que no puedes mandar la pregunta\nUsa "/setup-question" o "f!setquestion"' });
        const channel = message.guild.channels.cache.get(data.canal);
        const channel2 = message.guild.channels.cache.get(data.respuesta);
        const rol = message.guild.roles.cache.get(data.rol);
        message.delete();
        
        const mensaje = await channel.send({ content: `${rol}`, embeds: [
            new EmbedBuilder()
            .setColor(config.color)
            .setAuthor({name: `${message.author.username}`})
            .setTitle(`Pregunta del día.`)
            .setDescription(`${question}`)
            .addFields({name: `Puedes responder en:`, value: `${channel2}`})
            .setFooter({ text: `${message.guild.name}`, iconURL: `${message.guild.iconURL() || "https://cdn.discordapp.com/attachments/1085999484082855968/1086068616392347719/68cefaa66c01a72e8ac91146cd8bfed7_1.png"}` })
            .setTimestamp()
        ] });
        await mensaje.react("👍");
        await mensaje.react("👎");
    }
}
