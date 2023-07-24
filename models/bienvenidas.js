const { model, Schema } = require('mongoose');

let bienvenida = new Schema({
    guild: String,
    channel: String
});

module.exports = model("bienvenida", bienvenida);