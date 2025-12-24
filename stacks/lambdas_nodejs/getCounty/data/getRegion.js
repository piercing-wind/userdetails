const { query } = require('../aurora-db.js');

async function getRegionById(regionCode) {
    const selectQuery = `
        SELECT * FROM regiondatadev_schema."Region"
    `;
    
    // If regionCode is provided, filter by it
    if (regionCode) {
        const result = await query(
            selectQuery + ' WHERE region_code = $1',
            [regionCode]
        );
        return result;
    }
    
    // Otherwise return all regions
    const result = await query(selectQuery + ' ORDER BY region_code');
    return result; 
}

module.exports = { getRegionById };