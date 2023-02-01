import { GetUsageRequest, GetUsageResponse, isUsageRequestUsage, UsageRequestUsage } from "../../src/types/GuiRequest";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";
import { getBucket } from '../gatewayRequestHandlers/getBucket';
import { getObjectContent, objectExists } from "../gatewayRequestHandlers/s3Helpers";
import getUserInfoHandler from "./getUserInfoHandler";
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
        const authorizationSettings = await getAuthorizationSettings(request.zone || 'default')
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === verifiedUserId))
        if ((!u) || (!u.admin)) {
            throw Error('Not authorized to get usage for zone')
        }
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