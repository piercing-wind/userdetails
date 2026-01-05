const { query } = require('../aurora-db.js');
const { version } = require('../package.json');

async function getRegion(request){
    try {
        // Read from path params first, then query params for backward compatibility
        const regionCode = request?.pathParameters?.id;

        if(!regionCode){
            const result = await query(`SELECT 
                region_code, 
                region_name, 
                address_line1, 
                address_line2,
                city, 
                state, 
                zip_code, 
                phone_number, 
                assessor_name, 
                assessor_title, 
                region_board, 
                ctb_email FROM regiondatadev_schema."Region"`);

            // Map each region object in result.data to custom format
            const regionsData = Array.isArray(result.data)
                ? result.data.map(region => (
                    mapRegionData(region)
                    ))
                : [];

            const customResult = {
                meta: {
                    statusCode: 200,
                    apiVersion: version,
                    timeStamp: new Date().toISOString(),
                    count: regionsData.length,
                },
                data: { regions: regionsData }
            };
            return customResult;
        }

        if(regionCode && regionCode.length !== 2){
             return errorResponse(400, 'VALIDATION_ERROR', 'Region code must be a 2 digit number.');
        }

        const result = await query(
          `SELECT 
            region_code, 
            region_name, 
            address_line1, 
            address_line2,
            city, 
            state, 
            zip_code, 
            phone_number, 
            assessor_name, 
            assessor_title, 
            region_board, 
            ctb_email 
            FROM regiondatadev_schema."Region" WHERE region_code = $1`,
            [regionCode]
        );
        
        if(result.count === 0){
            return errorResponse(404, 'NOT_FOUND', `County not found.`);
        }


        const customResult = {
            meta: {
                statusCode: 200,
                apiVersion: version,
                timeStamp: new Date().toISOString(),
                count: result.count,
            },
            data: { regions: mapRegionData(result.data[0]) }
        }
        
        return customResult;


    } catch (error) {
        console.error('Error', error);

        if (error.code === 'ECONNREFUSED') {
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Database unavailable');
        }
        if (error.code === 'ETIMEDOUT') {
            return errorResponse(504, 'REQUEST_TIMEOUT', 'Database query timeout');
        }

        return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred. Please try again later.');
    }

}

module.exports = getRegion;




function errorResponse(statusCode, code, message) {
    return {
        statusCode,
        error: true,
        body: { error: { code, message } }
    };
}

function mapRegionData(region) {
    return {
        regionCode: region.region_code,
        regionName: region.region_name,
        address: {
            addressLine1: region.address_line1,
            addressLine2: region.address_line2,
            city: region.city,
            state: region.state,
            zipCode: region.zip_code,
            phoneNumber: region.phone_number
        },
        assessor: {
            name: region.assessor_name || null,
            title: region.assessor_title || null,
        },
        regionBoard: region.region_board || null,
        ctbEmail: region.ctb_email || null,
        audit: {
            createDateAndTime: region.create_date_and_time || null,
            createUserId: region.create_user_id || null,
            maintUserId: region.maint_user_id || null,
        }
    }
}