import { Resource } from "../../src/types/Resource";
import { GetResourcesRequest, GetResourcesResponse } from "../../src/types/GuiRequest";
import { getResource, getUser } from "../common/getDatabaseItems";

const getResourcesHandler = async (request: GetResourcesRequest, verifiedUserId?: string): Promise<GetResourcesResponse> => {
    const { userId } = request
    if (verifiedUserId !== request.userId) {
        throw Error('Not authorized')
    }

    const user = await getUser(userId)
    const resources: Resource[] = []
    for (let resourceName of (user.resourceNames || [])) {
        const resource = await getResource(resourceName)
        resources.push(resource)
    }

    return {
        type: 'getResources',
        resources
    }
}

export default getResourcesHandler