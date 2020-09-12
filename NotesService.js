const fs = require('fs');
const path = require('path');

const { getDateString } = require('./util');

const DATE_FLAG = '<date>';
const NAME_FLAG = '<filename>'

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
        * @param {string} options.name
        * @param {moment.Moment} options.date
        * @param {string} options.template
     */
    createNote({name, date, template}) {
        fs.mkdirSync(getDir(date), { recursive: true });
        
        if (fs.existsSync(file)) {
            throw 'note already exists';
        }

        const data = JSON.stringify({
            text: fromTemplate(template, { name, date }),
        });

        fs.writeFileSync(getPath(name, date), data);
    }

    /**
     * Update a note.
     */
    updateNote() {}
    deleteNote() {}
    
    getNote({name, date}) {
        const path = getPath(name, date);
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path);
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

    getNotes() {}
}

/**
 * @param {string} template
 * @param {Object} values
 * @param {string} values.name
 * @param {moment.Moment} values.date
 */
function fromTemplate(template, { name, date }) {
    template = template.replace(DATE_FLAG, getDateString(date));
    template = template.replace(NAME_FLAG, name);
    return template;
}

/**
 * @param {moment.Moment} date
 */
function getDir(date) {
    return path.join(this.notesPath, getDateString(date));
}

/**
 * @param {string} name
 * @param {moment.Moment} date
 */
function getPath(name, date) {
    return path.join(getDir(date), name);
}

module.exports = NotesServiceFS;