import { SetAuthorizationSettingsYamlRequest, SetAuthorizationSettingsYamlResponse } from "../../src/types/GuiRequest";
import { getBucket } from '../gatewayRequestHandlers/initiateFileUploadHandler';
import { parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const setAuthorizationSettingsYamlHandler = async (request: SetAuthorizationSettingsYamlRequest, verifiedUserId?: string): Promise<SetAuthorizationSettingsYamlResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const {authorizationSettingsYaml} = request

    const bucket = getBucket()
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