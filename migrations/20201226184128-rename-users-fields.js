const fbworker = require('../build/src/dbWorker').default;
const fieldValue = require('../build/src/dbWorker').fieldValue;

console.log('migration - create-users-fields');
module.exports.up = (fieldToRename, newName) => {
    console.log('UP');
    if (field === "" || field === undefined || field === null
    || newName === "" || newName === undefined || newName === null) {
      console.log('error - script need a field name as first parameter and the new name as second parameter');
      return;
    }
    fbworker.users.get().then(res => {
      var tmp;
      res.forEach(user => {
          tmp = user[fieldToRename];
          user.ref.update({
            [fieldToRename]: fieldValue.delete(),
            [newName]: tmp
          })
      });
  console.log('users fields has been updated');
  });
};

require('make-runnable');