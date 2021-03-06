
const { MongoClient } = require('mongodb');
const assert = require('assert');

const { getDateString } = require('./util');
const { fromTemplate } = require('./notes');

const COLLECTION = 'notes';

const GLOBAL = 'GLOBAL';

/**
 * NotesServiceMongo is a class containing methods to perform CRUD operations on notes.
 * This particular implementation uses mongodb to save notes
 * Intent is for the cli to grab notes using this interface, and then edit them using a temporary file and text editor.
 */
class NotesServiceMongo {

    constructor({ mongoUri, dbname }) {
        this.mongoUri = mongoUri;
        this.dbname = dbname;
        this.client = new MongoClient(this.mongoUri, { useUnifiedTopology: true });
    }
    
    async init() {
        await this.client.connect();
        this.db = this.client.db(this.dbname);
        this.collection = this.db.collection(COLLECTION);
        await this.collection.createIndex({ title: 1, date: 1 }, { sparse: true, unique: true });
    }

    /**
     * Create a note
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
        * @param {string} options.template
     */
    async createNote({ title = 'default', date, template = '' }) {
        date = date ? getDateString(date) : GLOBAL;

        const note = {
            title,
            date,
            text: fromTemplate(template, { title, date }),
        };

        const _id = (await this.collection.insertOne(note)).insertedId;

        return {
            _id,
            ...note,
        };
    }

    /**
     * Update a note
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
     * @param {Object} note - data to overwrite the note with
        * @param {string} note.text - the text of the note
     */
    async updateNote({ title, date }, { text }) {
        assert(title, 'updateNote: missing title');
        date = date ? getDateString(date) : GLOBAL;
        const response = await this.collection.findOneAndUpdate({ title, date }, { $set: { text }});
        return response.value;
    }

    /**
     * Delete a note
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
     */
    async deleteNote({ title, date }) {
        date = date ? getDateString(date) : GLOBAL;
        await this.collection.deleteOne({ title, date });
    }
    
    /**
     * Retrieve a note based on title and date
     */
    async getNote({ title, date }) {
        const query = {};
        if (title) query.title = title;
        query.date = date ? getDateString(date) : GLOBAL;

        return (await this.collection.findOne(query));
    }

    /**
     * Get notes by date
     * @param {*} param0 
     */
    async getNotes({ title, date }) {
        const query = {};
        if (title) query.title = title;
        query.date = date ? getDateString(date) : GLOBAL;
        return (await this.collection.find(query)).toArray();
    }
    
    async close() {
        await this.client.close();
    }
}

module.exports = NotesServiceMongo;
