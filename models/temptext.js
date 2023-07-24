const { model, Schema } = require('mongoose');
let schema = new Schema({
    guild: String,
    user: String,
    canal: String
});
module.exports = model('textemp', schema);