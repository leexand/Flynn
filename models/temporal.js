const { model, Schema } = require('mongoose');
let schema = new Schema({
    guild: String,
    canal: String,
    cate: String,
    limit: Number
});
module.exports = model('join-to-create', schema);