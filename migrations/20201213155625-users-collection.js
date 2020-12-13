/* eslint-disable */
const fbworker = require('../build/src/dbWorker').default;
console.log('migration - users-collection');
module.exports.up = () => {
    console.log('UP');
    fbworker.users.doc('userID=MD5').set({
        email: 'user@email',
        username: 'username',
        id: 'md5 of user meail',
        password: 'md5 of user password',
    }).then(() => {
        console.log('users collection has been created');
    });
};

module.exports.down = () => {
    console.log('DOWN');
    fbworker.users.get().then(res => {
        res.forEach(element => {
            element.ref.delete();
        });
    console.log('user collection has been deleted');
    });
};

require('make-runnable');