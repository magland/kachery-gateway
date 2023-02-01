import { GetAuthorizationSettingsYamlRequest, GetAuthorizationSettingsYamlResponse } from "../../src/types/GuiRequest";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";
import { getBucket } from '../gatewayRequestHandlers/getBucket';
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

    const bucket = await getBucket(zone || 'default')
    
    let authorizationSettingsYaml: string
    try {
        authorizationSettingsYaml = (await getObjectContent(bucket, `settings/authorizationSettings.yaml`)).toString()
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