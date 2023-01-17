import axios from "axios";
import { AdminActionRequest, AdminActionResponse } from "../../src/types/GuiRequest";
import getS3Client from "../gatewayRequestHandlers/getS3Client";
import { getBucket } from "../gatewayRequestHandlers/getBucket";
import { parseBucketUri } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const corsXmlBody = `<?xml version="1.0" encoding="UTF-8"?>  
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">  
    <CORSRule>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>`

const adminActionHandler = async (request: AdminActionRequest, verifiedUserId?: string): Promise<AdminActionResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const { actionType, zone } = request

    let success: boolean

    if (actionType === 'setBucketCORS') {
        const bucket = await getBucket(zone || 'default')
        const {bucketName} = parseBucketUri(bucket.uri)
        const client = getS3Client(bucket)

        await new Promise((resolve, reject) => {
            client.putBucketCors({
                Bucket: bucketName,
                CORSConfiguration: {
                    CORSRules: [
                        {
                            AllowedHeaders: ["*"],
                            AllowedMethods: ["GET", "HEAD", "PUT"],
                            AllowedOrigins: ["*"],
                            ExposeHeaders: [] // this might be crucial
                        }
                    ]
                }
            }, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
        
        success = true
    }
    else {
        throw Error(`Unexpected action type: ${actionType}`)
    }
    
    return {
        type: 'adminAction',
        success
    }
}

export default adminActionHandler