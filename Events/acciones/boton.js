const { InteractionType } = require('discord.js');
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client){
        if(interaction.isButton()){
            const { buttons } = client;
            const { customId } = interaction;
            const button = buttons.get(customId);
            if(!button) return interaction.reply({ content: 'Este boton no tiene código' });
            try{
                await button.execute(interaction, client);
            } catch(err){
                console.error(err);
            }

        } else if(interaction.type === InteractionType.ModalSubmit){
            const { modals } = client;
            const { customId } = interaction;
            const modal = modals.get(customId);
            if(!modal) return;
            try{
                await modal.execute(interaction, client);
            } catch(err){
                console.error(err);
            }

        } else {
            return;
        }
    }
}