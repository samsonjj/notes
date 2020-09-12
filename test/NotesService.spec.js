
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
        notesService = new NotesService({
            notesPath: TEST_NOTES_DIR,
        });
    });

    afterEach(function() {
        cleanTestNotesDirectory();
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
        
        it('can set initial note text using template', function() {
            notesService.createNote({ name: 'shoppingList', date: moment('2011-12-13'), template: 'hello' });
            const buffer = fs.readFileSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList'));
            assert(JSON.parse(String(buffer)).text === 'hello');
        });
        
        it('sets text to blank when there is no template', function() {
            notesService.createNote({ name: 'shoppingList', date: moment('2011-12-13') });
            const buffer = fs.readFileSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList'));
            assert(JSON.parse(String(buffer)).text === '');
        });
    });
    
    describe('getNote()', function() {
        const name = 'myNote';
        const date = moment();

        beforeEach(function() {
            notesService.createNote({ name, date, template: 'foo' });
            notesService.createNote({ name, template: 'bar' });
        });

        it('can get a note by name and date', function() {
            const note = notesService.getNote({ name, date });
            assert(note.text === 'foo');
        });
        
        it('can get a global note by passing falsy date', function() {
            const note = notesService.getNote({ name });
            assert(note.text === 'bar');
        });
    });
    
    describe('updateNote()', function() {
        const name = 'myNote';
        const date = moment();

        beforeEach(function() {
            notesService.createNote({ name, date, template: 'test' });
            notesService.createNote({ name, template: 'test' });
        });

        it('can update a note by name and date', function() {
            notesService.updateNote({ name, date }, { text: 'foo' });
            
            assert(notesService.getNote({ name, date}).text === 'foo');
        });
        
        it('can update a global note by passing in falsy date', function() {
            notesService.updateNote({ name }, { text: 'bar' });
            assert(notesService.getNote({ name }).text === 'bar');
        });
    });
    
    describe('deleteNote()', function() {
        it('can delete a note by name and date', function() {
            notesService.createNote({ name: 'shoppingList', date: moment('2011-12-13') });
            notesService.deleteNote({ name: 'shoppingList', date: moment('2011-12-13') });
            assert(!fs.existsSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList')));
        });
        it('can delete a global note by passing in a falsy date', function() {
            notesService.createNote({ name: 'shoppingList' });
            notesService.deleteNote({ name: 'shoppingList' });
            assert(!fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList')));
        });
    });
});