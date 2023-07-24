const { Message } = require("discord.js");
module.exports = {
    name: 'clear',
    description: 'Elimina mensajes de un canal.',
    aliases: ['limpiar','borrar','eliminar'],
    developer: true,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const cant = args[0] || 0;
        const user = message.mentions.users.first() || null;
        if(cant === 0) return;
        const a = validate(cant);
        if(a === 1) return message.reply({ content: 'Debes agregar unicamente numeros' });

        const mensajes = await message.channel.messages.fetch();
        if(user){
            let i = 0;
            let clear = [];
            mensajes.filter((msg) => {
                if(msg.author.id === user.id && cant > i){
                    clear.push(msg);
                    i++
                }
            });
            message.delete();
            message.channel.bulkDelete(clear, true);
        } else {
            message.delete();
            message.channel.bulkDelete(cant, true);
        }
    }
}
function validate(date){
    let filters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','ñ','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    for(let filter of filters){
        if(date.search(filter) !== -1){
            return 1;
        }
    }
    return 0;
}
