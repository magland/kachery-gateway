import { Client, isClient } from "../../src/types/Client"
import { getBucket } from "../gatewayRequestHandlers/initiateFileUploadHandler"
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
// const allClientsObjectCache = new ObjectCache<Client[]>(5 * 60 * 1000)
const userObjectCache = new ObjectCache<{[key: string]: any}>(expirationMSec)

export const getClient = async (clientId: string, o: {includeSecrets?: boolean}={}) => {
    const x = clientObjectCache.get(clientId.toString())
    if (x) {
        if (!o.includeSecrets) x.privateKeyHex = undefined
        return x
    }
    // const adminBucket = getAdminBucket()
    // const clientJson = await getObjectContent(adminBucket, `clients/${clientId}`)
    // const client = JSON.parse(clientJson)
    // if (!isClient(client)) throw Error('Invalid client in bucket')
    // clientObjectCache.set(clientId.toString(), {...client})
    // if (!o.includeSecrets) client.privateKeyHex = undefined
    // return client

    // const db = firestoreDatabase()
    // const clientsCollection = db.collection('kachery-gateway.clients')
    // const clientSnapshot = await clientsCollection.doc(clientId.toString()).get()
    // if (!clientSnapshot.exists) throw Error('Client not registered. Use kachery-cloud-init to register this kachery-cloud client.')
    // const client = clientSnapshot.data()
    // if (!isClient(client)) throw Error('Invalid client in database')

    const bucket = getBucket()
    const key = `clients/${clientId}`
    const exists = await objectExists(bucket, key)
    if (!exists) throw Error('Client not registered. Use kachery-cloud-init to register this kachery-cloud client.')
    const client = JSON.parse(await getObjectContent(bucket, key))
    if (!isClient(client)) throw Error('Invalid client in bucket')

    clientObjectCache.set(clientId.toString(), {...client})
    if (!o.includeSecrets) client.privateKeyHex = undefined
    return client
}

export const invalidateClientInCache = (clientId: string) => {
    clientObjectCache.delete(clientId)
}

export const getUser = async (userId: string) => {
    const x = userObjectCache.get(userId.toString())
    if (x) {
        return x
    }

    const bucket = getBucket()
    const key = `users/${userId}`
    const exists = await objectExists(bucket, key)
    if (!exists) throw Error('User not found.')
    const user = JSON.parse(await getObjectContent(bucket, key))

    userObjectCache.set(userId, {...user})
    return user
}

export const invalidateUserInCache = (userId: string) => {
    userObjectCache.delete(userId)
}

// export const getAllClients = async (): Promise<Client[]> => {
//     const x = allClientsObjectCache.get('all')
//     if (x) {
//         return x
//     }
    
//     const db = firestoreDatabase()
//     const clientsCollection = db.collection('kachery-gateway.clients')
//     const a = await clientsCollection.get()
//     const clients: Client[] = []
//     for (let doc of a.docs) {
//         const client = doc.data()
//         if (!isClient(client)) throw Error('Invalid client in database')
//         clients.push(client)
//     }
    
//     allClientsObjectCache.set('all', clients)
//     return clients

//     // const ret: Client[] = []
//     // const adminBucket = getAdminBucket()
//     // const a = await listObjects(adminBucket, 'clients/')
//     // for (let c of a) {
//     //     const clientJson = await getObjectContent(adminBucket, c.Key)
//     //     const client = JSON.parse(clientJson)
//     //     if (!isClient(client)) throw Error('Invalid client in bucket')
//     //     ret.push(client)
//     // }
//     // allClientsObjectCache.set('all', ret)
//     // return ret
// }

// export const invalidateAllClients = () => {
//     allClientsObjectCache.delete('all')
// }