#!/usr/bin/env node
const { program } = require('commander');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const moment = require('moment');
const { parse } = require('path');

require('dotenv').config();

const NotesService = require('./NotesServiceMongo');
const { getDateString } = require('./util');

const USER_SETTINGS_PATH = path.join(os.homedir(), '.config', 'notes', 'userSettings.json');

class Settings {
    static defaultSettings = {
        notesPath: path.join(os.homedir(), 'Notes'),
        extension: 'txt',
        template: `# <date> (<filename>)`,
        templateFile: null,
    }

    constructor(options) {
        const s = {
            ...Settings.defaultSettings,
            ...options,
        };

        this.notesPath = s.notesPath;
        this.extension = s.extension;
        this.template = s.template;
        this.templateFile = s.templateFile;
    }
}

/**
 * Open file in vim.
 * @param {String} path 
 */
function openFileInVim(path) {
    spawnSync('vim', [path], { stdio: 'inherit' });
}

function loadUserSettings() {
    if (!fs.existsSync(USER_SETTINGS_PATH)) {
        const parts = USER_SETTINGS_PATH.split('/');
        const dir = parts.slice(0, parts.length - 1).join('/');

        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
            USER_SETTINGS_PATH,
            JSON.stringify(Settings.defaultSettings, null, 2) + '\n'
        );
    }

    return JSON.parse(
        String(fs.readFileSync(USER_SETTINGS_PATH))
    );
}

/**
 * Parse input date from command line.
 * @param {String} date 
 * @returns {moment.Moment} momentDate
 */
function parseDateOrDefault(date, _default) {
    try {
        return moment(date);
    } catch {
        return _default
    }
}

function parseIntOrDefault(offset, _default) {
    const n = parseInt(offset);
    if (Number.isNaN(n)) return _default;
    return n;
}

/**
 * 
 * @param {Object} options
    * @param {string} options.title
    * @param {moment.Moment} options.date
    * @param {number} options.offset
 */
async function openNote({ title = 'default', date, offset }) {
    const settings = new Settings(loadUserSettings());
    const notesService = new NotesService({
        mongoUri: process.env['MONGO_URI'],
        dbname: process.env['MONGO_DBNAME'],
    });
    try {
        await notesService.init();

        date.add(offset, 'day');

        let note = await notesService.getNote({ title, date });
        if (!note) {
            let template = settings.template;
            if (settings.templateFile) {
                try {
                    template = String(fs.readFileSync(settings.templateFile));
                } catch (e) {
                    console.error(e.message);
                }
            }

            note = await notesService.createNote({
                title,
                date,
                template,
            });
        }

        const updatedText = editInTempFile(
            `${getDateString(date)}-${title}`,
            note.text
        );

        await notesService.updateNote({ title, date }, {
            ...note,
            text: updatedText,
        });

        console.log('note saved to mongo 😇');
    } finally {
        notesService.close();
    }
}

function editInTempFile(filename, data) {
    const tempDir = path.join(__dirname, 'temp');
    const tempFilename = filename;
    const tempFilepath = path.join(tempDir, tempFilename);

    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(tempFilepath, data);

    openFileInVim(tempFilepath);

    const updatedText = String(fs.readFileSync(tempFilepath));
    fs.unlinkSync(tempFilepath);
    return updatedText;
}

/**
 * 
 * @param {moment.Moment} date 
 * @param {Number} offset 
 */
async function list({date, offset}) {
    const settings = new Settings(loadUserSettings());

    const notesService = new NotesService({
        mongoUri: process.env['MONGO_URI'],
        dbname: process.env['MONGO_DBNAME'],
    });
    try {
        await notesService.init();

        date.add(offset, 'day');

        const notes = await notesService.getNotes({ date });
        console.log(`--- ${getDateString(date)} ---`);
        if (notes.length === 0) {
            console.log('<none>');
        } else {
            console.log(notes.map(note => `${note.title}`).join('\n'));
        }
    } finally {
        notesService.close();
    }
}

program
    .version('0.1.0')
    .description('A simple cli for taking daily notes')

program
    .arguments('[title]')
    .option("-d --date <date>", "provide a date", (date) => parseDateOrDefault(date, moment()), moment())
    .option("-o --offset <offset>", "number of days ago (-) or in future (+)", (offset) => parseIntOrDefault(offset, 0), 0)
    .action(async (title, cmdObj) => {
        await openNote({
            title,
            date: cmdObj.date,
            offset: cmdObj.offset,
        });
    });

program
    .command('list')
    .description('lists the notes for a given date')
    .action(async (cmdObj) => {
        await list({ date: cmdObj.parent.date, offset: cmdObj.parent.offset })
    });

// TODO
// command that will compile all notes for a given day (or for all time) together into one text file
// probably output to console

program.parse(process.argv);