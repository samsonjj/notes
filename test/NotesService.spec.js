
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
                title: 'shoppingList',
                date: moment('2011-12-13'),
            });
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList')));
        });

        it('can create a global note by passing falsy values for date', function() {
            notesService.createNote({ title: 'shoppingList1' });
            notesService.createNote({ title: 'shoppingList2', date: false });
            notesService.createNote({ title: 'shoppingList3', date: '' });
            notesService.createNote({ title: 'shoppingList4', date: null });
            notesService.createNote({ title: 'shoppingList5', date: undefined });
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList1')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList2')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList3')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList4')));
            assert(fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList5')));
        });
        
        it('can set initial note text using template', function() {
            notesService.createNote({ title: 'shoppingList', date: moment('2011-12-13'), template: 'hello' });
            const buffer = fs.readFileSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList'));
            assert(JSON.parse(String(buffer)).text === 'hello');
        });
        
        it('sets text to blank when there is no template', function() {
            notesService.createNote({ title: 'shoppingList', date: moment('2011-12-13') });
            const buffer = fs.readFileSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList'));
            assert(JSON.parse(String(buffer)).text === '');
        });
    });
    
    describe('getNote()', function() {
        const title = 'myNote';
        const date = moment();

        beforeEach(function() {
            notesService.createNote({ title, date, template: 'foo' });
            notesService.createNote({ title, template: 'bar' });
        });

        it('can get a note by title and date', function() {
            const note = notesService.getNote({ title, date });
            assert(note.text === 'foo');
        });
        
        it('can get a global note by passing falsy date', function() {
            const note = notesService.getNote({ title });
            assert(note.text === 'bar');
        });
    });
    
    describe('getNotes()', function() { 
        it('can get all notes for a date', function() {
            const date = moment('2011-12-13');

            notesService.createNote({ title: 'shoppingList', date, template: 'foo' });
            notesService.createNote({ title: 'meetingNotes', date, template: 'bar' });
            
            const notes = notesService.getNotes({ date });
            assert(notes.length === 2);
            assert(notes.find(note => note.title === 'shoppingList').text === 'foo');
        });
    });
    
    describe('updateNote()', function() {
        const title = 'myNote';
        const date = moment();

        beforeEach(function() {
            notesService.createNote({ title, date, template: 'test' });
            notesService.createNote({ title, template: 'test' });
        });

        it('can update a note by title and date', function() {
            notesService.updateNote({ title, date }, { text: 'foo' });
            
            assert(notesService.getNote({ title, date}).text === 'foo');
        });
        
        it('can update a global note by passing in falsy date', function() {
            notesService.updateNote({ title }, { text: 'bar' });
            assert(notesService.getNote({ title }).text === 'bar');
        });
    });
    
    describe('deleteNote()', function() {
        it('can delete a note by title and date', function() {
            notesService.createNote({ title: 'shoppingList', date: moment('2011-12-13') });
            notesService.deleteNote({ title: 'shoppingList', date: moment('2011-12-13') });
            assert(!fs.existsSync(path.join(TEST_NOTES_DIR, '2011-12-13', 'shoppingList')));
        });
        it('can delete a global note by passing in a falsy date', function() {
            notesService.createNote({ title: 'shoppingList' });
            notesService.deleteNote({ title: 'shoppingList' });
            assert(!fs.existsSync(path.join(TEST_NOTES_DIR, 'global', 'shoppingList')));
        });
    });
});