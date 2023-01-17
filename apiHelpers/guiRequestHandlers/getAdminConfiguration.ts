import { AdminConfiguration, GetAdminConfigurationRequest, GetAdminConfigurationResponse } from "../../src/types/GuiRequest";
import isAdminUser from "./helpers/isAdminUser";

const getAdminConfigurationHandler = async (request: GetAdminConfigurationRequest, verifiedUserId?: string): Promise<GetAdminConfigurationResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    // const {zone} = request

    const adminConfiguration: AdminConfiguration = {
        mongoUri: replaceWithStars(process.env['MONGO_URI']),
        githubClientId: process.env['REACT_APP_GITHUB_CLIENT_ID'],
        githubClientSecret: replaceWithStars(process.env['GITHUB_CLIENT_SECRET']),
        adminUsers: process.env['REACT_APP_ADMIN_USERS'],
        zoneDirectory: process.env['ZONE_DIRECTORY'],
        reCaptchaKey: process.env['REACT_APP_RECAPTCHA_KEY'],
        reCaptchaSecretKey: replaceWithStars(process.env['RECAPTCHA_SECRET_KEY'])
    }
    
    return {
        type: 'getAdminConfiguration',
        adminConfiguration
    }
}

// hide secrets for security
const replaceWithStars = (x?: string) => {
    if (!x) return ''
    const a: string[] = []
    for (let i = 0; i < x.length; i ++) {
        a.push('*')
    }
    return a.join('')
}

export default getAdminConfigurationHandler