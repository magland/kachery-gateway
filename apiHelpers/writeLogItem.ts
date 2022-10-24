import { LogItem } from '../src/types/LogItem'
import firestoreDatabase from './common/firestoreDatabase'

// const adminBucket = getAdminBucket()

const writeLogItem = async (logItem: LogItem) => {
    // const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)
    // const ts = new Date().toISOString()
    // const r = randomAlphaString(10)
    // const k = `logItems/${ts}.${r}`
    // await putObject(adminBucket, {
    //     Key: k,
    //     Body: JSONStringifyDeterministic(logItem),
    //     Bucket: adminBucketName
    // })
    const db = firestoreDatabase()
    const logItemsCollection = db.collection('kachery-gateway.logItems')
    await logItemsCollection.add(logItem)
}

export default writeLogItem