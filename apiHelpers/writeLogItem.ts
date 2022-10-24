import { JSONStringifyDeterministic } from '../src/types/keypair'
import { LogItem } from '../src/types/LogItem'
import randomAlphaString from './common/randomAlphaString'
import { getAdminBucket } from "./gatewayRequestHandlers/initiateFileUploadHandler"
import { parseBucketUri, putObject } from './gatewayRequestHandlers/s3Helpers'

const adminBucket = getAdminBucket()

const writeLogItem = async (logItem: LogItem) => {
    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)
    const ts = new Date().toISOString()
    const r = randomAlphaString(10)
    const k = `logItems/${ts}.${r}`
    await putObject(adminBucket, {
        Key: k,
        Body: JSONStringifyDeterministic(logItem),
        Bucket: adminBucketName
    })
    // const db = firestoreDatabase()
    // const logItemsCollection = db.collection('kachery-gateway.logItems')
    // await logItemsCollection.add(logItem)
}

export default writeLogItem