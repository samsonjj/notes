const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { getDateString } = require('./util');

const GLOBAL_SUBDIR = 'global';

const DATE_FLAG = '<date>';
const TITLE_FLAG = '<title>'

/**
 * NotesServiceFS is a class containing methods to perform CRUD operations on notes.
 * This particular implementation uses the file system to store notes.
 * Intent is for the cli to grab notes using this interface, and then edit them using a temporary file and text editor.
 */
class NotesServiceFS {

    constructor({
        notesPath
    }) {
        this.notesPath = notesPath;
    }
    
    /**
     * Create a note on the user's file system
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
        * @param {string} options.template
     */
    createNote({ title = 'default', date, template = '' }) {
        fs.mkdirSync(this._getDir(date), { recursive: true });
        
        if (fs.existsSync(this._getPath(title, date))) {
            throw 'note already exists';
        }

        const data = JSON.stringify({
            title,
            text: fromTemplate(template, { title, date }),
        });

        fs.writeFileSync(this._getPath(title, date), data);
    }

    /**
     * Update a note
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
     * @param {Object} note - data to overwrite the note with
     */
    updateNote({ title, date }, note) {
        const path = this._getPath(title, date);
        assert(fs.existsSync(path), 'note does not exist');

        const data = JSON.stringify(note);
        fs.writeFileSync(path, data);
    }

    /**
     * Create a note on the user's file system
     * @param {Object} options
        * @param {string} options.title
        * @param {moment.Moment} options.date - the date of the note. Can be falsy, in which case a global/permanent note is created.
     */
    deleteNote({ title, date }) {
        const path = this._getPath(title, date);
        assert(fs.existsSync(path), 'note does not exist');
        
        fs.unlinkSync(path);
    }
    
    /**
     * Retrieve a note based on 
     * @param {*} param0 
     */
    getNote({ title, date }) {
        const file = this._getPath(title, date);
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file);
            try {
                const note = JSON.parse(data);
                return note;
            } catch (e) {
                console.error(e);
                throw 'note file is corrupted';
            }
        }
        return null;
    }

    getNotes({ date }) {
        const dir = this._getDir(date);
        const files = fs.readdirSync(dir);
        return files.map(file => {
            return this.getNote({ title: file, date });
        });
    }

    /**
     * @param {moment.Moment} date
     */
    _getDir(date) {
        return path.join(this.notesPath, date ? getDateString(date) : GLOBAL_SUBDIR);
    }

    /**
     * @param {string} title 
     * @param {moment.Moment} date
     */
    _getPath(title, date) {
        return path.join(this._getDir(date), title);
    }
}

/**
 * @param {string} template
 * @param {Object} values
 * @param {string} values.title
 * @param {moment.Moment} values.date
 */
function fromTemplate(template, { title, date }) {
    if (date) template = template.replace(DATE_FLAG, getDateString(date));
    template = template.replace(TITLE_FLAG, title);
    return template;
}

module.exports = NotesServiceFS;
