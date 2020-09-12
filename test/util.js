const fs = require('fs');
const path = require('path');

const TEST_NOTES_DIR = path.join(__dirname, notes);

function cleanTestNotesDirectory() {
    fs.readdir(TEST_NOTES_DIR, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      }
    });
}

module.exports = { cleanTestNotesDirectory };
