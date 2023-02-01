import { SetAuthorizationSettingsYamlRequest, SetAuthorizationSettingsYamlResponse } from "../../src/types/GuiRequest";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";
import { getBucket } from '../gatewayRequestHandlers/getBucket';
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const setAuthorizationSettingsYamlHandler = async (request: SetAuthorizationSettingsYamlRequest, verifiedUserId?: string): Promise<SetAuthorizationSettingsYamlResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        const authorizationSettings = await getAuthorizationSettings(request.zone || 'default')
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === verifiedUserId))
        if ((!u) || (!u.admin)) {
            throw Error('User not authorized on this zone')
        }
    }

    const { zone } = request

    const {authorizationSettingsYaml} = request

    const bucket = await getBucket(zone || 'default')
    const {bucketName} = parseBucketUri(bucket.uri)

    await putObject(bucket, {
        Bucket: bucketName,
        Key: 'settings/authorizationSettings.yaml',
        Body: authorizationSettingsYaml
    })
    
    return {
        type: 'setAuthorizationSettingsYaml'
    }
}

export default setAuthorizationSettingsYamlHandler