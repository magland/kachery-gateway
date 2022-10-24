import { Client, isClient } from "../../src/types/Client"
import { getAdminBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler"
import { getObjectContent, listObjects } from "../gatewayRequestHandlers/s3Helpers"

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

const expirationMSec = 20000
const clientObjectCache = new ObjectCache<Client>(expirationMSec)
const allClientsObjectCache = new ObjectCache<Client[]>(5 * 60 * 1000)

export const getClient = async (clientId: string, o: {includeSecrets?: boolean}={}) => {
    const x = clientObjectCache.get(clientId.toString())
    if (x) {
        if (!o.includeSecrets) x.privateKeyHex = undefined
        return x
    }
    const adminBucket = getAdminBucket()
    const clientJson = await getObjectContent(adminBucket, `clients/${clientId}`)
    const client = JSON.parse(clientJson)
    if (!isClient(client)) throw Error('Invalid client in bucket')
    clientObjectCache.set(clientId.toString(), {...client})
    if (!o.includeSecrets) client.privateKeyHex = undefined
    return client
    // const db = firestoreDatabase()
    // const clientsCollection = db.collection('kachery-gateway.clients')
    // const clientSnapshot = await clientsCollection.doc(clientId.toString()).get()
    // if (!clientSnapshot.exists) throw Error('Client not registered. Use kachery-cloud-init to register this kachery-cloud client.')
    // const client = clientSnapshot.data()
    // if (!isClient(client)) throw Error('Invalid client in database')
    // clientObjectCache.set(clientId.toString(), {...client})
    // if (!o.includeSecrets) client.privateKeyHex = undefined
    // return client
}

export const invalidateClientInCache = (clientId: string) => {
    clientObjectCache.delete(clientId)
}

export const getAllClients = async (): Promise<Client[]> => {
    const x = allClientsObjectCache.get('all')
    if (x) {
        return x
    }
    const ret: Client[] = []
    const adminBucket = getAdminBucket()
    const a = await listObjects(adminBucket, 'clients/')
    for (let c of a) {
        const clientJson = await getObjectContent(adminBucket, c.Key)
        const client = JSON.parse(clientJson)
        if (!isClient(client)) throw Error('Invalid client in bucket')
        ret.push(client)
    }
    return ret
}

export const invalidateAllClients = () => {
    allClientsObjectCache.delete('all')
}