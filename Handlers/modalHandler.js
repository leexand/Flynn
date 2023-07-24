async function loadModals(client){
    const { loadFiles } = require('../Functions/fileLoader');
    await client.modals.clear();
    const files = await loadFiles('components');
    files.forEach((file) => {
        const modal = require(file);
        client.modals.set(modal.data.name, modal);
    });
    return console.log('Modals cargados');
}
module.exports = { loadModals };