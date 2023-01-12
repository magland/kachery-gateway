import { GetUsageRequest, GetUsageResponse, isUsageRequestUsage, UsageRequestUsage } from "../../src/types/GuiRequest";
import { getBucket } from '../gatewayRequestHandlers/initiateFileUploadHandler';
import { getObjectContent, objectExists } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const emptyUsage: UsageRequestUsage = {
    timestamp: 0,
    clients: {},
    dailyUsage: [],
    totalUsage: {
        clientUsage: {}
    }
}

const getUsageHandler = async (request: GetUsageRequest, verifiedUserId?: string): Promise<GetUsageResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const {zone} = request

    const bucket = await getBucket(zone || 'default')
    
    const kk = `usage/usage.json`
    const exists = await objectExists(bucket, kk)
    const usageJson = exists ? await getObjectContent(bucket, kk) : JSON.stringify(emptyUsage)
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