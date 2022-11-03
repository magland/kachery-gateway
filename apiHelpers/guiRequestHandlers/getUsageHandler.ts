import { GetUsageRequest, GetUsageResponse, isUsageRequestUsage } from "../../src/types/GuiRequest";
import { getBucket } from '../gatewayRequestHandlers/initiateFileUploadHandler';
import { getObjectContent } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const getUsageHandler = async (request: GetUsageRequest, verifiedUserId?: string): Promise<GetUsageResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const bucket = getBucket()
    
    const usageJson = await getObjectContent(bucket, `usage/usage.json`)
    const usage = JSON.parse(usageJson)
    if (!isUsageRequestUsage(usage)) {
        console.warn(usage)
        throw Error('Invalid usage in bucket')
    }
    
    return {
        type: 'getUsage',
        usage
    }
}

export default getUsageHandler