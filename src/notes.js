
const { getDateString } = require('./util');

const DATE_FLAG = '<date>';
const TITLE_FLAG = '<title>'

/**
 * @param {string} template
 * @param {Object} values
 * @param {string} values.title
 * @param {moment.Moment} values.date
 */
function fromTemplate(template, { title, date }) {
    if (date) template = template.replace(DATE_FLAG, typeof date === 'string' ? date : getDateString(date));
    template = template.replace(TITLE_FLAG, title);
    return template;
}

module.exports = {
    fromTemplate,
};
