#!/usr/bin/env node
const { program } = require('commander');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os')

class Settings {
    static defaultSettings = {
        notesPath: path.join(os.homedir(), 'Notes'),
    }

    constructor(options) {
        const s = {
            ...Settings.defaultSettings,
            ...options,
        };

        this.notesPath = s.notesPath;
    }
}

/**
 * Get the date string used for folder naming.
 * @param {Date} date 
 */
function getDateString(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Open file in vim.
 * @param {String} path 
 */
function openFileInVim(path) {
    spawn('vim', [path], { stdio: 'inherit' });
}

function mkdirSafe(path) {
    spawnSync('mkdir', ['-p', path]);
}

function main() {
    const settings = new Settings();

    // Use the current date as the folder name
    const dateString = getDateString(new Date());

    mkdirSafe(path.join(
        settings.notesPath,
        dateString
    ));

    const filename = 'default.txt';

    // we just write to defaut.txt for now
    const file = path.join(
        settings.notesPath,
        dateString,
        filename
    );

    // create notes file with auto-generated first line
    if (!fs.existsSync(file)) {
        const data = `#${dateString} - ${filename}`;
        fs.writeFileSync(file, data);
    }

    // open file in vim
    spawn('vim', [file], { stdio: 'inherit' });
}

main();