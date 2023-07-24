const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const nivel = require('../../models/niveles');
const validate = require('../../models/validate');
const frs = [
    'Creo que hay que llevarte al manicomio',
    'Cada dia más esquizo, joder que bendición, para ti..',
    'Si yo soy Batman, tu eres el Guasón',
    'Ay no puede ser, otro loco',
    'Que ganas de golpear personas esquizofrenicas',
    'Por ahí escuche que a las personas como tú les gusta el reguetton, con razón sos severa loca'
];
module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message){
        if(message.author.bot) return;
        const data = await nivel.findOne({ guild: message.guild.id, user: message.author.id });
        const data1 = await validate.findOne({ guild: message.guild.id });
        const frases = frs[Math.floor(Math.random() * frs.length)];
        const embed = new EmbedBuilder()
        .setColor(config.color)

        if(!data1 || data1.set.toLowerCase() === 'desactivar') return;
        const xp = Math.floor(Math.random() * 29) + 1;
        const channel = message.guild.channels.cache.get(data1.canal);

        if(!data) return await nivel.create({ guild: message.guild.id, user: message.author.id, xp: xp });
        if(data.xp >= data.limite){
            await nivel.findOneAndUpdate({ guild: message.guild.id, user: message.author.id }, {
                xp: 0,
                nivel: data.nivel + 1,
                limite: data.limite + 10
            });
            return channel.send({ content: `${message.author}`, embeds: [embed.setTitle(`Felicidades ${message.author.username}`).setThumbnail(`${message.author.displayAvatarURL()}`).setDescription(`Ahora eres ${data.nivel + 1}% más esquizofrénic@\n${frases}`)] });
        }
        await nivel.findOneAndUpdate({ guild: message.guild.id, user: message.author.id }, {
            xp: data.xp + xp
        });
    }
}