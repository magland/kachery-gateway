import { AdminConfiguration, GetAdminConfigurationRequest, GetAdminConfigurationResponse } from "../../src/types/GuiRequest";
import isAdminUser from "./helpers/isAdminUser";

const getAdminConfigurationHandler = async (request: GetAdminConfigurationRequest, verifiedUserId?: string): Promise<GetAdminConfigurationResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        throw Error('Not admin user.')
    }

    const adminConfiguration: AdminConfiguration = {
        bucketUri: process.env['BUCKET_URI'],
        bucketCredentials: replaceWithStars(process.env['BUCKET_CREDENTIALS']),
        fallbackBucketUri: process.env['FALLBACK_BUCKET_URI'],
        fallbackBucketCredentials: replaceWithStars(process.env['FALLBACK_BUCKET_CREDENTIALS']),
        mongoUri: replaceWithStars(process.env['MONGO_URI']),
        githubClientId: process.env['REACT_APP_GITHUB_CLIENT_ID'],
        githubClientSecret: replaceWithStars(process.env['GITHUB_CLIENT_SECRET']),
        adminUsers: process.env['REACT_APP_ADMIN_USERS'],
        kacheryZones: process.env['KACHERY_ZONES'],
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