#!/usr/bin/env node
const { program } = require('commander');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const moment = require('moment');

const USER_SETTINGS_PATH = path.join(os.homedir(), '.notes_config');
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

/**
 * Get the date string used for folder naming.
 * @param {moment.Moment} date 
 */
function getDateString(date) {
    return date.toISOString().slice(0, 10);
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
        fs.writeFileSync(
            USER_SETTINGS_PATH,
            JSON.stringify(Settings.defaultSettings, null, 2) + '\n'
        );
    }

    return JSON.parse(
        String(fs.readFileSync(USER_SETTINGS_PATH))
    );
}


function main(filename = 'default.txt', {
    date,
    offset,
}) { 
    const settings = new Settings(loadUserSettings());

    filename = correctExtension(filename, settings.extension);

    console.log(offset);
    
    offset = Number(offset);
    if (Number.isNaN(offset)) offset = 0;

    // use the current date as the folder name
    const dateString = getDateString(moment(date).add(offset, 'day'));

    console.log(dateString, date, offset);

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
        const data = fromTemplate(settings.template, {
            date: dateString,
            filename,
            filepath: file,
        });
        fs.writeFileSync(file, data);
    }

    openFileInVim(file)
}

program
    .version('0.1.0')
    .description('A simple cli for taking daily notes.')
    .arguments('[filename]')
    .option("-d --date <date>", "provide a date", getDateString(moment()))
    .option("-o --offset <offset>", "number of days ago (-) or in future (+)", 0)
    .action((filename, cmdObj) => {
        main(filename, {
            date: cmdObj.date,
            offset: cmdObj.offset,
        });
    });

program.parse(process.argv);