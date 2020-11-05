
/**
 * Get the date string used for folder naming.
 * @param {moment.Moment} date 
 */
function getDateString(date) {
    const month = `0${date.month()+1}`.slice(-2);
    const day = `0${date.date()}`.slice(-2);
    return `${date.year()}-${month}-${day}`;
}

module.exports = {
    getDateString
};