const { ActivityType } = require("discord.js");
const mongoose = require('mongoose');
const config = require('../../config.json');
module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`${client.user.username} en marcha!`);
        await mongoose.connect(config.mongopass, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        if(mongoose.connect){
            console.log(`${client.user.username} está conectado a mongo`);
        } else {
            console.log(`${client.user.username} no pudo conectarse a mongo`);
        }
        client.user.setPresence({
            activities: [
                { name: 'Hospital Psiquiátrico De Batman', type: ActivityType.Watching  }
            ],
        });
    },
};