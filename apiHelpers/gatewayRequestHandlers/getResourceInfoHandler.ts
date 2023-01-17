import { Resource } from "../../src/types/Resource";
import { GetResourceInfoRequest, GetResourceInfoResponse } from "../../src/types/GatewayRequest";
import { NodeId } from "../../src/types/keypair";
import { getResource } from "../common/getDatabaseItems";

const getResourceInfoHandler = async (request: GetResourceInfoRequest, verifiedClientId?: NodeId): Promise<GetResourceInfoResponse> => {
    const { resourceName, zone } = request.payload

    let resource: Resource
    try {
        resource = await getResource(zone || 'default', resourceName.toString())
    }
    catch {
        return {
            type: 'getResourceInfo',
            found: false
        }
    }

    return {
        type: 'getResourceInfo',
        found: true,
        resource
    }
}

export default getResourceInfoHandler