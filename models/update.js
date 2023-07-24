const { model, Schema } = require('mongoose');
let updates = new Schema({
    guild: String,
    canal: String,
    rol: String
});
module.exports = model('actualizacion', updates);