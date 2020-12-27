const fbworker = require('../build/src/dbWorker').default;
console.log('migration - rooms-collection');
module.exports.up = () => {
    console.log('UP');
    fbworker.rooms.doc('roomID=firebaseID').set({
        admin: 'id of user who create the room',
        id: 'the firebase id',
        max: 8,
        messages: [],
        name: 'room name',
        password: 'md5 of the room password',
        players: [
          {
            role: 'none',
            state: 'waiting-in-lobby',
            userId: 'userId'
          },
        ],
        private: true,
        state:'lobby',
    }).then(() => {
        console.log('rooms collection has been created');
    });
};

module.exports.down = () => {
    console.log('DOWN');
    fbworker.rooms.get().then(res => {
        res.forEach(element => {
            element.ref.delete();
        });
    console.log('rooms collection has been deleted');
    });
};

require('make-runnable');