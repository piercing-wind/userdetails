const { query } = require('../aurora-db.js');
const { version } = require('../package.json');
const getRegion = require('./getRegion');


async function getLocality(request){
    try {
        const {meta, data} = await getRegion();

        const result = await query(
            `SELECT 
             region_code, 
             locality_code,
             juvex_id, 
             ca_atexor_id, 
             ca_firm_id,
             ca_addr_qualifier,
             locality_name, 
             address_line1, 
             address_line2, 
             city, 
             state, 
             zip_code, 
             phone_number, 
             assess_email, 
             local_clerix_email, 
             assess_email2, 
             create_datetime, 
             maint_datetime, 
             create_user_id, 
             maint_user_id
            FROM userdetaildev_schema."Locality"`
        );

        if (result.count === 0) {
             return errorResponse(404, 'NOT_FOUND', 'Locality not found.');
        }

        // Map the result to include region object within each locality
        const localitiesData = Array.isArray(result.data)
            ? result.data.map(locality => {
                const region = data.regions.find(r => r.regionCode === locality.region_code);
                return mapLocalityData(locality, region)
                })
            : [];

        const customResult = {
            meta:{
                statusCode: 200,
                apiVersion: version,
                timeStamp: new Date().toISOString(),
                count: localitiesData.length,
            },
            data: { localities: localitiesData }
 
        }

        return customResult;


    } catch (error) {
        console.error('Database error:', error);

        if (error.code === 'ECONNREFUSED') {
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Database unavailable');
        }
        if (error.code === 'ETIMEDOUT') {
            return errorResponse(504, 'REQUEST_TIMEOUT', 'Database query timeout');
        }

        return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred. Please try again later.');
    }
    

}

module.exports = getLocality;


function errorResponse(statusCode, code, message) {
    return {
        statusCode,
        error: true,
        body: { error: { code, message } }
    };
}


function mapLocalityData(locality, region) {
    return {
        region,
        locality: {
            localityCode: locality?.locality_code,
            localityName: locality?.locality_name,
            address: {
                addressLine1: locality?.address_line1,
                addressLine2: locality?.address_line2,
                city: locality?.city,
                phoneNumber: locality?.phone_number,
                state: locality?.state,
                zipCode: locality?.zip_code
            },
            emails:{
                assessorEmailPrimary: locality?.assess_email || null,
                assessorEmailSecondary: locality?.assess_email2 || null,
                localityclerixEmail: locality?.local_clerix_email || null,
                ctbEmail: locality?.ctb_email || null,
            },
            localityClerix:{
                name: locality?.local_clerix_name || null,
                title: locality?.local_clerix_title || null,
            },
            juvex: {
                juvexId: locality?.juvex_id || null,
                name: {
                    firstName: locality?.juvex_first_name || null,
                    middleName: locality?.juvex_middle_name || null,
                    lastName: locality?.juvex_last_name || null
                }
            },
            atexor: {
                id: locality?.ca_atexor_id || null,
                firmId: locality?.ca_firm_id || null,
                camdsLink: {
                    addressQualifier:  locality?.ca_addr_qualifier ||null
                }
            }
        }
    }
}