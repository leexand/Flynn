const { Message, EmbedBuilder } = require("discord.js");
module.exports = {
    name: 'addsticker',
    description: 'Agrega un sticker al server\n(la imagen debe ser de 320 x 320 y pesar 512 KB)',
    aliases: ['stickeradd','newsticker'],
    developer: true,
    cooldown: 10,  // ORGANIZAR COMANDOS SETUP Y MOD
    /**
     * @param {Message} message 
     */
    async execute(message, client, args, config){

        const upload =  message.attachments.first();
        if(upload){
            await message.reply({ content: 'Escribe el nombre del sticker' });
            const filter = (msg) => msg.author.id === message.author.id && msg.content !== '';
            const response = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });
            if(!response.size){
                return await message.channel.send({ content: `${message.author}, eh cancelado la solicitud, se acabo el tiempo de 15 segundos` });
            }
            const name = response.first().content;
            if(name.length <= 2) return await message.reply({ content: `El nombre no puede ser menor a dos caracteres` });
            if(upload.contentType === `image/gif`) return await message.reply({ content: `No puedes subir gif's` });
    
            const msg = await message.reply(`Cargando sticker...`);
    
            const sticker = await message.guild.stickers.create({ file: `${upload.attachment}`, name: `${name}`})
            .catch(err => {
                setTimeout(() => {
                    return msg.edit({ content: `${err.rawError.message}`});
                }, 2000);
            });
    
            const embed = new EmbedBuilder()
            .setColor(config.color)
            .setDescription(`El sticker \`${name}\` fue agregado correctamente`)
    
            setTimeout(() => {
                if(!sticker) return;
                msg.edit({ conten: ``, embeds: [embed]});
            }, 3000);

        } else {
            await message.reply({ content: 'Debes enviar una imagen' });
        }
    }
}