import { GetUserInfoRequest, GetUserInfoResponse } from "../../src/types/GuiRequest";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";

const getUserInfoHandler = async (request: GetUserInfoRequest, verifiedUserId?: string): Promise<GetUserInfoResponse> => {
    const {userId} = request
    if (userId !== verifiedUserId) {
        throw Error(`Mismatch in user ID ${userId} <> ${verifiedUserId}`)
    }
    const authorizationSettings = await getAuthorizationSettings(request.zone || 'default')
    const u = authorizationSettings.authorizedUsers.find(a => (a.userId === userId))
    return {
        type: 'getUserInfo',
        userId,
        isAdmin: (u && u.admin) ? true : false
    }
}

export default getUserInfoHandler