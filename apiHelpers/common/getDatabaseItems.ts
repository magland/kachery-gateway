import { Client, isClient } from "../../src/types/Client"
import firestoreDatabase from "./firestoreDatabase"

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

export const getClient = async (clientId: string, o: {includeSecrets?: boolean}={}) => {
    const x = clientObjectCache.get(clientId.toString())
    if (x) {
        if (!o.includeSecrets) x.privateKeyHex = undefined
        return x
    }
    const db = firestoreDatabase()
    const clientsCollection = db.collection('kachery-gateway.clients')
    const clientSnapshot = await clientsCollection.doc(clientId.toString()).get()
    if (!clientSnapshot.exists) throw Error('Client not registered. Use kachery-cloud-init to register this kachery-cloud client.')
    const client = clientSnapshot.data()
    if (!isClient(client)) throw Error('Invalid client in database')
    clientObjectCache.set(clientId.toString(), {...client})
    if (!o.includeSecrets) client.privateKeyHex = undefined
    return client
}

export const invalidateClientInCache = async (clientId: string) => {
    clientObjectCache.delete(clientId)
}