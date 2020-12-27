const fbworker = require('../build/src/dbWorker').default;
const fieldValue = require('../build/src/dbWorker').fieldValue;

console.log('migration - create-rooms-fields');
module.exports.up = (fieldToRename, newName) => {
    console.log('UP');
    if (field === "" || field === undefined || field === null
    || newName === "" || newName === undefined || newName === null) {
      console.log('error - script need a field name as first parameter and the new name as second parameter');
      return;
    }
    fbworker.rooms.get().then(res => {
      var tmp;
      res.forEach(room => {
          tmp = room[fieldToRename];
          room.ref.update({
            [fieldToRename]: fieldValue.delete(),
            [newName]: tmp
          })
      });
  console.log('rooms fields has been updated');
  });
};

require('make-runnable');