import YAML from 'yaml'
import { AuthorizationSettings, isAuthorizationSettings } from '../../src/types/AuthorizationSettings'
import ObjectCache from "./ObjectCache"
import { getObjectContent, objectExists } from "./s3Helpers"
import { getZoneData, joinKeys } from './getZoneInfo'

const authorizationSettingsCache = new ObjectCache<AuthorizationSettings>(1000 * 60 * 3)

const getAuthorizationSettings = async (zone: string): Promise<AuthorizationSettings> => {
    const a = authorizationSettingsCache.get(zone)
    if (a) return a
    const zoneData = await getZoneData(zone)
    const bucket = zoneData.bucket
    const authorizationSettingsKey = joinKeys(zoneData.directory, 'settings/authorizationSettings.yaml')
    if (!await objectExists(bucket, authorizationSettingsKey)) {
        return {
            allowPublicUpload: false,
            allowPublicDownload: true,
            authorizedUsers: []
        }
    }
    let x = (await getObjectContent(bucket, authorizationSettingsKey)).toString()
    const authorizationSettings = YAML.parse(x)
    if (!isAuthorizationSettings(authorizationSettings)) {
        throw Error('Invalid authorization settings')
    }
    authorizationSettingsCache.set(zone, authorizationSettings)
    return authorizationSettings
}

export default getAuthorizationSettings