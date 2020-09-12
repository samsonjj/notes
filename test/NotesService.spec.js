
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

    describe('createNote()', function() {
        it('can create a note for 2011-12-13', function() {
            notesService.createNote({
                name: 'shoppingList',
                date: moment('2011-12-13'),
            });
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList')));
        });

        it('can create a global note by passing falsy values for date', function() {
            notesService.createNote({ name: 'shoppingList1' });
            notesService.createNote({ name: 'shoppingList2', date: false });
            notesService.createNote({ name: 'shoppingList3', date: '' });
            notesService.createNote({ name: 'shoppingList4', date: null });
            notesService.createNote({ name: 'shoppingList5', date: undefined });
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList1')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList2')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList3')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList4')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList5')));
        });
    });
    
    describe('getNote()', function() {
        const name = 'myNote';
        const date = moment();

        beforeEach(function() {
            notesService.createNote({ name, date, template: 'foo' });
            notesService.createNote({ name, template: 'bar' });
        });

        it('can get a note by name and date', function(){
            const note = notesService.getNote({ name, date });
            assert(note.text === 'foo');
        });
        
        it('can get a global note by passing falsy date', function() {
            const note = notesService.getNote({ name });
            assert(note.text === 'bar');
        });
    });
});