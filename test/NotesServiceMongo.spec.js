const moment = require('moment');
const mongodb = require('mongodb');
const expect = require('chai').expect;

require('dotenv').config();

const NotesService = require('../src/NotesServiceMongo');

async function cleanDatabase(uri, dbname) {
  const client = await mongodb.connect(uri, { useUnifiedTopology: true });
  const db = client.db(dbname);
  await db.dropDatabase();
  await client.close();
}

describe('NotesService', function () {
  /** @type {NotesService} */
  let notesService;
  /** @type {mongodb.MongoClient} */
  let testClient;
  /** @type {mongodb.Db} */
  let testDB;
  /** @type {mongodb.Collection} */
  let testCollection;

  beforeEach(async function () {
    await cleanDatabase(process.env['MONGO_URI'], 'testDB');

    notesService = new NotesService({
      mongoUri: process.env['MONGO_URI'],
      dbname: 'testDB',
    });
    await notesService.init();

    testClient = await mongodb.connect(process.env['MONGO_URI'], { useUnifiedTopology: true });
    testDB = testClient.db('testDB');
    testCollection = testDB.collection('notes');
  });

  afterEach(async function () {
    Promise.all([
      notesService.close(),
      testClient.close(),
    ]);
  });

  describe('createNote()', function () {
    it('can create a note for 2011-12-13', async function () {
      // Arrange
      const stubNote = {
        title: 'shoppingList',
        date: moment('2011-12-13'),
      }

      const expected = {
        title: 'shoppingList',
        date: '2011-12-13',
      };

      // Act
      await notesService.createNote(stubNote);
      const actual = await testCollection.findOne({ title: 'shoppingList', date: '2011-12-13' });

      // Assert
      expect(actual).to.include(expected);
    });

    it('can create a global note by passing falsy values for date', async function () {
      // Act
      await notesService.createNote({ title: 'shoppingList1' });
      await notesService.createNote({ title: 'shoppingList2', date: false });
      await notesService.createNote({ title: 'shoppingList3', date: '' });
      await notesService.createNote({ title: 'shoppingList4', date: null });
      await notesService.createNote({ title: 'shoppingList5', date: undefined });

      const actual = await testCollection.find({}).toArray();

      // Assert
      expect(actual.length === 5);
    });

    it('can set initial note text using template', async function () {
      // Act
      await notesService.createNote({ title: 'shoppingList', date: moment('2011-12-13'), template: 'hello' });
      const actual = await testCollection.findOne({ title: 'shoppingList' });

      // Assert 
      expect(actual).to.include({ text: 'hello' });
    });

    it('sets text to blank when there is no template', async function () {
      // Act
      await notesService.createNote({ title: 'shoppingList', date: moment('2011-12-13') });
      const actual = await testCollection.findOne({ title: 'shoppingList' });

      // Assert
      expect(actual).to.include({ text: '' });
    });
  });

  describe('getNote()', function () {
    const title = 'myNote';
    const date = moment();

    beforeEach(async function () {
      await notesService.createNote({ title, date, template: 'foo' });
      await notesService.createNote({ title, template: 'bar' });
    });

    it('can get a note by title and date', async function () {
      // Arrange
      const expected = { text: 'foo' };
      const query = { title, date };

      // Act
      const actual = await notesService.getNote(query);

      // Assert
      expect(actual).to.include(expected);
    });

    it('can get a global note by passing falsy date', async function () {
      // Arrange
      const expected = { text: 'bar' };
      const query = { title };

      // Act
      const actual = await notesService.getNote(query);

      // Assert
      expect(actual).to.include(expected);
    });
  });

  describe('getNotes()', function () {
    it('can get all notes for a date', async function () {
      // Arrange
      const date = moment('2011-12-13');
      const note1 = { title: 'shoppingList', date, template: 'foo' };
      const note2 = { title: 'meetingNotes', date, template: 'bar' };
      await notesService.createNote(note1);
      await notesService.createNote(note2);

      // Act
      const actual = await notesService.getNotes({ date });

      // Assert
      expect(actual).to.have.length(2);
    });
  });

  describe('updateNote()', function () {
    const title = 'myNote';
    const date = moment('2011-12-13');

    beforeEach(async function () {
      await notesService.createNote({ title, date, template: 'test' });
      await notesService.createNote({ title, template: 'test' });
    });

    it('can update a note by title and date', async function () {
      // Arrange
      const query = { title, date };
      const update = { text: 'foo' };

      // Act
      await notesService.updateNote(query, update);

      // Assert
      const actual = await notesService.getNote(query);
      expect(actual).to.include(update);
    });

    it('can update a global note by passing in falsy date', async function () {
      // Arrange
      const query = { title };
      const update = { text: 'bar' };

      // Act
      await notesService.updateNote(query, update);

      // Assert
      const actual = await notesService.getNote(query);
      expect(actual).to.include(update);
    });

    describe('deleteNote()', function () {
      it('can delete a note by title and date', async function () {
        // Arrange
        const note = { title: 'shoppingList', date: moment('2011-12-13') };
        await notesService.createNote(note);

        // Act
        await notesService.deleteNote(note);

        // Assert
        const actual = await notesService.getNote(note);
        expect(actual).to.be.null;
      });

      it('can delete a global note by passing in a falsy date', async function () {
        // Arrange
        const note = { title: 'shoppingList' };
        await notesService.createNote(note);

        // Act
        await notesService.deleteNote(note);

        // Assert
        const actual = await notesService.getNote(note);
        expect(actual).to.be.null
      });
    });
  });
});