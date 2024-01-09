import YAML from 'yaml'
import { AuthorizationSettings, isAuthorizationSettings } from '../../src/types/AuthorizationSettings'
import ObjectCache from "./ObjectCache"
import { getObjectContent } from "./s3Helpers"
import { getZoneInfo, joinKeys } from './getZoneInfo'

const authorizationSettingsCache = new ObjectCache<AuthorizationSettings>(1000 * 60 * 3)

const getAuthorizationSettings = async (zone: string): Promise<AuthorizationSettings> => {
    const a = authorizationSettingsCache.get(zone)
    if (a) return a
    const zoneInfo = await getZoneInfo(zone)
    const bucket = zoneInfo.bucket
    const authorizationSettingsKey = joinKeys(zoneInfo.directory, 'settings/authorizationSettings.yaml')
    let x = (await getObjectContent(bucket, authorizationSettingsKey)).toString()
    const authorizationSettings = YAML.parse(x)
    if (!isAuthorizationSettings(authorizationSettings)) {
        throw Error('Invalid authorization settings')
    }
    authorizationSettingsCache.set(zone, authorizationSettings)
    return authorizationSettings
}

export default getAuthorizationSettings