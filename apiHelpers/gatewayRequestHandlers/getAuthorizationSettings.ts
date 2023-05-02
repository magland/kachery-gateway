import YAML from 'yaml'
import { AuthorizationSettings, isAuthorizationSettings } from '../../src/types/AuthorizationSettings'
import { getBucket } from "./getBucket"
import ObjectCache from "./ObjectCache"
import { getObjectContent } from "./s3Helpers"

const authorizationSettingsCache = new ObjectCache<AuthorizationSettings>(1000 * 60 * 3)

const getAuthorizationSettings = async (zone: string): Promise<AuthorizationSettings> => {
    const a = authorizationSettingsCache.get(zone)
    if (a) return a
    const bucket = await getBucket(zone)
    let x = (await getObjectContent(bucket, 'settings/authorizationSettings.yaml')).toString()
    const authorizationSettings = YAML.parse(x)
    if (!isAuthorizationSettings(authorizationSettings)) {
        throw Error('Invalid authorization settings')
    }
    authorizationSettingsCache.set(zone, authorizationSettings)
    return authorizationSettings
}

export default getAuthorizationSettings