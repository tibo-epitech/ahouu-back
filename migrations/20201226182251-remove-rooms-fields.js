const fbworker = require('../build/src/dbWorker').default;
const fieldValue = require('../build/src/dbWorker').fieldValue;

console.log('migration - remove-rooms-fields');
module.exports.up = (field) => {
    console.log('UP');
    if (field === "" || field === undefined || field === null) {
      console.log('error - script need a field name as parameter');
      return;
    }
    fbworker.rooms.get().then(res => {
      res.forEach(room => {
          room.ref.update({
            [field]: fieldValue.delete()
          })
      });
  console.log('rooms fields has been updated');
  });
};

module.exports.down = (field) => {
    console.log('DOWN');
    if (field === "" || field === undefined || field === null) {
      console.log('error - script need a field name as parameter');
      return;
    }
    fbworker.rooms.get().then(res => {
      res.forEach(room => {
          room.ref.update({
            [field]: ""
          })
      });
  console.log('rooms fields has been updated');
  });
};

require('make-runnable');