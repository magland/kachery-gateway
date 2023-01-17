import { Client, isClient } from "../../src/types/Client"
import { isResource, Resource } from "../../src/types/Resource"
import { getBucket } from "../gatewayRequestHandlers/getBucket"
import { getObjectContent, objectExists } from "../gatewayRequestHandlers/s3Helpers"

export class ObjectCache<ObjectType> {
    #cache: {[key: string]: {object: ObjectType, timestamp: number}} = {}
    constructor(private expirationMsec: number) {
    }
    set(key: string, object: ObjectType) {
        this.#cache[key] = {
            object,
            timestamp: Date.now()
        }
    }
    get(key: string) {
        const a = this.#cache[key]
        if (!a) return undefined
        const elapsed = Date.now() - a.timestamp
        if (elapsed > this.expirationMsec) {
            delete this.#cache[key]
            return undefined
        }
        return a.object
    }
    delete(key: string) {
        if (this.#cache[key]) {
            delete this.#cache[key]
        }
    }
}

const expirationMSec = 60 * 1000
const clientObjectCache = new ObjectCache<Client>(expirationMSec)
const resourceObjectCache = new ObjectCache<Resource>(expirationMSec)
// const allClientsObjectCache = new ObjectCache<Client[]>(5 * 60 * 1000)
const userObjectCache = new ObjectCache<{[key: string]: any}>(expirationMSec)

export const getClient = async (zone: string, clientId: string, o: {includeSecrets?: boolean}={}) => {
    const kk = `${zone}:${clientId}`
    const x = clientObjectCache.get(kk)
    if (x) {
        if (!o.includeSecrets) x.privateKeyHex = undefined
        return x
    }

    const bucket = await getBucket(zone)
    const key = `clients/${clientId}`
    const exists = await objectExists(bucket, key)
    if (!exists) throw Error('Client not registered. Use kachery-cloud-init to register this kachery-cloud client.')
    const client = JSON.parse(await getObjectContent(bucket, key))
    if (!isClient(client)) throw Error('Invalid client in bucket')

    clientObjectCache.set(kk, {...client})
    if (!o.includeSecrets) client.privateKeyHex = undefined
    return client
}

export const invalidateClientInCache = (zone: string, clientId: string) => {
    const kk = `${zone}:${clientId}`
    clientObjectCache.delete(kk)
}

export const getResource = async (zone: string, resourceName: string, o: {includeSecrets?: boolean}={}) => {
    const kk = `${zone}:${resourceName}`
    const x = resourceObjectCache.get(kk)
    if (x) {
        return x
    }

    const bucket = await getBucket(zone)
    const key = `resources/${resourceName}`
    const exists = await objectExists(bucket, key)
    if (!exists) throw Error('Resource not found.')
    const resource = JSON.parse(await getObjectContent(bucket, key))
    if (!isResource(resource)) throw Error('Invalid resource in bucket')

    resourceObjectCache.set(kk, {...resource})
    return resource
}

export const invalidateResourceInCache = (zone: string, resourceName: string) => {
    const kk = `${zone}:${resourceName}`
    resourceObjectCache.delete(kk)
}

export const getUser = async (zone: string, userId: string) => {
    const kk = `${zone}:${userId}`
    const x = userObjectCache.get(kk)
    if (x) {
        return x
    }

    const bucket = await getBucket(zone)
    const key = `users/${userId}`
    const exists = await objectExists(bucket, key)
    if (!exists) throw Error('User not found.')
    const user = JSON.parse(await getObjectContent(bucket, key))

    userObjectCache.set(kk, {...user})
    return user
}

export const invalidateUserInCache = (zone: string, userId: string) => {
    const kk = `${zone}:${userId}`
    userObjectCache.delete(kk)
}