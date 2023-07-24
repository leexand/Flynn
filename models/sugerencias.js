const { model, Schema } = require('mongoose');
let sugerencia = new Schema({
    guild: String,
    canal: String
});
module.exports = model('sugerencia', sugerencia);