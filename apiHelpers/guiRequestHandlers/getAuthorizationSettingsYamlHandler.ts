import { GetAuthorizationSettingsYamlRequest, GetAuthorizationSettingsYamlResponse } from "../../src/types/GuiRequest";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";
import { getObjectContent } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const getAuthorizationSettingsYamlHandler = async (request: GetAuthorizationSettingsYamlRequest, verifiedUserId?: string): Promise<GetAuthorizationSettingsYamlResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        const authorizationSettings = await getAuthorizationSettings(request.zone || 'default')
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === verifiedUserId))
        if ((!u) || (!u.admin)) {
            throw Error('User not authorized on this zone')
        }
    }

    const { zone } = request

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    
    let authorizationSettingsYaml: string
    const key = joinKeys(zoneData.directory, `settings/authorizationSettings.yaml`)
    try {
        authorizationSettingsYaml = (await getObjectContent(bucket, key)).toString()
    }
    catch(err) {
        return {
            type: 'getAuthorizationSettingsYaml',
            authorizationSettingsYaml: undefined
        }
    }
    
    return {
        type: 'getAuthorizationSettingsYaml',
        authorizationSettingsYaml
    }
}

export default getAuthorizationSettingsYamlHandler