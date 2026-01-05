// XML
const { version } = require('../package.json');
const xml2js = require('xml2js');
const getRegion = require('./getRegion');

async function getLocality(event){
    try {
  
        const result = await fetch('https://4bd411ca8d98.ngrok-free.app/v1/locality',{
            method: 'POST',
        });
        
        const {meta, data} = await getRegion();

        const localitiesData = await result.text();
        const parser = new xml2js.Parser({ explicitArray: false });
        const localitiesJson = await parser.parseStringPromise(localitiesData);

        const localityArray = localitiesJson["soapenv:Envelope"]['soapenv:Body']['ns2:getLocalityListResponse']['return']['LocalitierPerRegionList'];
        
        if (localityArray.length === 0) {
             return errorResponse(404, 'NOT_FOUND', 'Locality not found.');
        }

        // Map the result to include region object within each locality
        const localities = Array.isArray(localityArray)
            ? localityArray.map(locality => {
                const region = data.regions.find(r => r.regionCode === locality.region);
                return mapLocalityData(locality, region)
            }) : [];



        const customResult = {
            meta:{
                statusCode: 200,
                apiVersion: version,
                timeStamp: new Date().toISOString(),
                count: localities.length,
            },
            data: { localities }
 
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
        region: {
            regionCode: region?.regionCode || null,
            regionName: region?.regionName || null,
            address: {
                addressLine1: region?.address?.addressLine1 || null,
                addressLine2: region?.address?.addressLine2 || null,
                addressLine3: region?.address?.addressLine3 || null,
                city: region?.address?.city || null,
                state: region?.address?.state || null,
                zipCode: region?.address?.zipCode || null,
                phoneNumber: region?.address?.phoneNumber || null
            },
            assessor: {
                name: region?.assessor?.name || null,
                title: region?.assessor?.title || null,
            },
            regionBoard: region?.regionBoard || null,
            ctbEmail: region?.ctbEmail || null
        },
        locality: {
            localityCode: locality?.locality,
            localityName: locality?.localityName,
            address: locality?.address,
            emails:{
                assessorEmailPrimary: locality?.assessor_email_primary || null,
                assessorEmailSecondary: locality?.assessor_email_secondary || null,
                localityclerixEmail: locality?.localityclerix_email || null,
                cbtEmail: locality?.cbtEmail || null,
            },
            localityClerix:{
                name: locality?.localityclerix_name || null,
                title: locality?.localityclerix_title || null,
            },
            juvex: {
                juvexId: locality?.juvex?.crtOfflId || null,
                name: {
                    firstName: locality?.juvex?.name?.firstName || null,
                    middleName: locality?.juvex?.name?.middleInitial || null,
                    lastName: locality?.juvex?.name?.lastName || null
                }
            },
            atexor: {
                id: locality?.atexor?.id ||null,
                firmId:  locality?.atexor?.camsLink?.firmID ||null,
                camdsLink: {
                    addressQualifier:  locality?.atexor?.camsLink?.addrQualifier ||null
                }
            }
        }
    }
}