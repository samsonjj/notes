const fs = require('fs');
const path = require('path');

const TEST_NOTES_DIR = path.join(__dirname, 'notes');

function cleanTestNotesDirectory() {
    if (fs.existsSync(TEST_NOTES_DIR)) {
        fs.rmdirSync(TEST_NOTES_DIR, { recursive: true });
    }
}

module.exports = {
    cleanTestNotesDirectory,
    TEST_NOTES_DIR,
};
