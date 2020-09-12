#!/usr/bin/env node
const { program } = require('commander');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const moment = require('moment');
const { parse } = require('path');

const { getDateString } = require('./util');

const USER_SETTINGS_PATH = path.join(os.homedir(), '.config', 'notes', 'userSettings.json');
const DATE_FLAG = '<date>';
const FILENAME_FLAG = '<filename>';

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

function fromTemplate(template, { date, filename }) {
    template = template.replace(DATE_FLAG, date);
    template = template.replace(FILENAME_FLAG, filename);
    return template;
}

function correctExtension(filename, extension) {
    const parts = filename.split('.');
    if (parts.length < 2)
        return `${filename}.${extension}`;
    return filename;
}

/**
 * Open file in vim.
 * @param {String} path 
 */
function openFileInVim(path) {
    spawn('vim', [path], { stdio: 'inherit' });
}

function loadUserSettings() {
    if (!fs.existsSync(USER_SETTINGS_PATH)) {
        const parts = USER_SETTINGS_PATH.split('/');
        const dir = parts.slice(0, parts.length-1).join('/');

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

function open(filename = 'default.txt', {
    date,
    offset,
}) { 
    const settings = new Settings(loadUserSettings());

    filename = correctExtension(filename, settings.extension);

    // use the current date as the folder name
    const dateString = getDateString(date.add(offset, 'day'));

    // create directories
    fs.mkdirSync(
        path.join(settings.notesPath, dateString),
        { recursive: true }     
    );

    const file = path.join(
        settings.notesPath,
        dateString,
        filename
    );

    // create notes file
    if (!fs.existsSync(file)) {
        let template = settings.template;
        if (settings.templateFile) { 
            try { template = String(fs.readFileSync(settings.templateFile)) }
            catch (err) { console.error(`Could not read template file at ${settings.templateFile}.`) }
        }

        const data = fromTemplate(template, {
            date: dateString,
            filename,
            filepath: file,
        });
        fs.writeFileSync(file, data);
    }

    openFileInVim(file)
}

/**
 * 
 * @param {moment.Moment} date 
 * @param {Number} offset 
 */
function list(date, offset) {
    const settings = new Settings(loadUserSettings());

    const notesDir = fs.readdirSync(settings.notesPath);
    const dateString = getDateString(date.add(offset));
    if (notesDir.findIndex(value => value === dateString) === -1) {
        console.log(`No notes for date ${dateString}`);
        return
    } else if (fs.statSync(path.join(settings.notesPath, dateString)).isFile()) {
        console.log(`Path ${path.join(settings.notesPath, dateString)} describes a file, not a directory`); 
        return
    }
    
    const dateDir = fs.readdirSync(path.join(settings.notesPath, dateString));
    console.log(`--- ${dateString} ---`);
    console.log(dateDir.join('\n'));
}

program
    .version('0.1.0')
    .description('A simple cli for taking daily notes')

program
    .command('open', { isDefault: true })
    .description('default action which opens a note in vim.')
    .arguments('[filename]')
    .option("-d --date <date>", "provide a date", (date) => parseDateOrDefault(date, moment()), moment())
    .option("-o --offset <offset>", "number of days ago (-) or in future (+)", (offset) => parseIntOrDefault(offset, 0), 0)
    .action((filename, cmdObj) => {
        open(filename, {
            date: cmdObj.date,
            offset: cmdObj.offset,
        });
    });

program
    .command('list')
    .description('lists the notes for a given date')
    .option("-d --date <date>", "provide a date", (date) => parseDateOrDefault(date, moment()), moment())
    .option("-o --offset <offset>", "number of days ago (-) or in future (+)", (offset) => parseIntOrDefault(offset, 0), 0)
    .action((cmdObj) => {
        list(cmdObj.date, cmdObj.offset)
    });

program
    .command('test')
    .description('test command for development')
    .arguments('[title]')
    .option("-d --date <date>", "provide a date", (date) => parseDateOrDefault(date, moment()), moment())
    .option("-o --offset <offset>", "number of days ago (-) or in future (+)", (offset) => parseIntOrDefault(offset, 0), 0)
    .action((filename, cmdObj) => {
        openNoteInVim(filename, {
            date: cmdObj.date,
            offset: cmdObj.offset,
        });
    });

// TODO
// command that will compile all notes for a given day (or for all time) together into one text file
// probably output to console

program.parse(process.argv);