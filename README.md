# notes
A simple nodejs cli to write daily notes from your local machine.

# Compatability
Works on Linux and Mac

# Installation
```
git clone https://github.com/samsonjj/notes
cd notes
npm install -g
```

# How to Use
Type `notes --help` for a list of all different options.

Typing `notes` will open up a note in vim for the current day, with title 'default'.

You can open up a different note by typing `notes <title>`. For example, if you want to open a blank note for a shopping list, type `notes shopping-list`.

To open up a note for a different date (say, yesterday's note), type `notes -d <YYYY-MM-DD>`. Or, to use relative dates, you can type `notes -o <offset>`, for example, `notes -o -1` to get yesterday's note.

# Advanced Features
You can set the save path, template for note files, and default file extension by editing the config file located at `~/.config/notes/userSettings.json`.