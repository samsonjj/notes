
const assert = require('assert');
const path = require('path');
const NotesService = require('../NotesService');

describe('NotesService', function() {
    let notesService;

    beforeEach(function() {
        notesService = new NotesService({
            notesPath: path.join(__dirname, 'testNotesPath');
        })
    });

    describe('createNote', function() {
        
    });
});