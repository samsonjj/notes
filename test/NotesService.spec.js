
const assert = require('assert');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

const NotesService = require('../NotesService');
const { cleanTestNotesDirectory, TEST_NOTES_DIR } = require('./testUtil');

describe('NotesService', function() {
    /** @type {NotesService} */
    let notesService;

    beforeEach(function() {
        cleanTestNotesDirectory();
        notesService = new NotesService({
            notesPath: TEST_NOTES_DIR,
        });
    });

    it('createNote()', function() {
        notesService.createNote({
            name: 'shoppingList',
            date: moment('2011-12-13'),
        });
        assert(fs.existsSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList')));
    });
});