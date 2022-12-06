import { GetAuthorizationSettingsYamlRequest, GetAuthorizationSettingsYamlResponse } from "../../src/types/GuiRequest";
import { getBucket } from '../gatewayRequestHandlers/initiateFileUploadHandler';
import { getObjectContent } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const getAuthorizationSettingsYamlHandler = async (request: GetAuthorizationSettingsYamlRequest, verifiedUserId?: string): Promise<GetAuthorizationSettingsYamlResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const bucket = getBucket()
    
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