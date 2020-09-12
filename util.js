
/**
 * Get the date string used for folder naming.
 * @param {moment.Moment} date 
 */
function getDateString(date) {
    return `${date.year()}-${date.month()+1}-${date.date()}`;
}

module.exports = {
    getDateString
};