const { Message, EmbedBuilder } = require('discord.js')
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: '' });
const openai = new OpenAIApi(configuration);
module.exports = {
    name: 'imagengenerator',
    description: 'Genera una imagen por medio de una IA',
    aliases: ['imagenia'],
    developer: false,
    cooldown: 15,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const prompt = args.join(' ');
        if(!prompt) return await message.reply({ content: 'Debes agregar lo que quieras que genere la IA' });
        const msg = await message.reply({ content: '<a:_:1110331515147128882> Generando tu imagen' });
        const embed = new EmbedBuilder()
        .setColor(config.color)

        try{
            const response = await openai.createImage({
                prompt: `${prompt}`,
                n: 1,
                size: '1024x1024',
            });
            const image = response.data.data[0].url;
            await msg.delete();
            await message.reply({ embeds: [embed.setTitle(`Imagen \`\`\`${prompt}\`\`\``).setImage(image)] });

        }catch(e){
            await msg.delete();
            if(e.response.status === 400) return await message.reply({ embeds: [embed.setDescription(`Lo siento, no pude generar \`\`\`${prompt}\`\`\``)] });
            await message.reply({ embeds: [embed.setDescription(`Error de solicitud con código de estado **${e.response.status}**`)] });
        }
    }
}
