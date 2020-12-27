const fbworker = require('../build/src/dbWorker').default;

console.log('migration - create-rooms-fields');
module.exports.up = (field, value) => {
    console.log('UP');
    if (field === "" || field === undefined || field === null
    || value === "" || value === undefined || value === null) {
      console.log('error - script need a field name as fisrt parameter and a value as second parameter');
      return;
    }
    fbworker.rooms.get().then(res => {
      res.forEach(room => {
          room.ref.update({
            [field]: value
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