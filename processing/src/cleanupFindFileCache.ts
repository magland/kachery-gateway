import { closeMongoClient } from "./getMongoClient"
import { getMongoClient } from "./getMongoClient"

const cleanupFindFileCache = async () => {
    // new method using mongo
    const client = await getMongoClient()
    const findFileCacheCollection = client.db('kachery-gateway').collection('findFileCache')
    const result = await findFileCacheCollection.deleteMany({
        timestampCreated: {$lt: Date.now() - 1000 * 60 * 60}
    })
    console.info(`Deleted ${result.deletedCount} mongo documents`)

    closeMongoClient()
}

cleanupFindFileCache()