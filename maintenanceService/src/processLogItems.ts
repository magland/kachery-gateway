import sleepMsec from "./sleepMsec"
import * as fs from 'fs'
import getS3Client from "./getS3Client"
import firestoreDatabase from "./firestoreDatabase"
import { copyObject, deleteObject, headObject, parseBucketUri, putObject } from "./s3Helpers"
import { isLogItem, LogItem } from "../../src/types/LogItem"
import { JSONStringifyDeterministic } from "../../src/types/keypair"

const main = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const bucket = {uri: 'wasabi://kachery-cloud?region=us-east-1', credentials: wasabiCredentials}
    await sleepMsec(500)

    const {bucketName} = parseBucketUri(bucket.uri)

    const logItemsCollection = db.collection('kachery-gateway.logItems')
    const result = await logItemsCollection.orderBy('requestTimestamp', 'asc').limit(10000).get()
    const logItems: LogItem[] = []
    for (let doc of result.docs) {
        const logItem = doc.data()
        if (!isLogItem(logItem)) {
            console.warn(logItem)
            throw Error('Invalid log item in database')
        }
        console.info(new Date(logItem.requestTimestamp).toISOString())
        logItems.push(logItem)
    }
    console.info('=================================================')
    console.info(`Processing ${logItems.length} log items.`)
    const logItemsJson = JSONStringifyDeterministic(logItems)
    const ts = new Date().toISOString()
    const fname = `log-${ts}.json`
    const objectKey = `logs/${fname}`
    console.info(`Writing ${fname}`)
    fs.writeFileSync(fname, logItemsJson)
    console.info(`Uploading log to bucket ${objectKey}`)
    await putObject(bucket, {
        Body: logItemsJson,
        Key: objectKey,
        Bucket: bucketName
    })
    console.info('Deleting log items')
    const docBatches = splitIntoBatches(result.docs)
    for (let i = 0; i < docBatches.length; i++) {
        const docBatch = docBatches[i]
        console.info(`Processing batch ${i} / ${docBatches.length}`)
        const deleteBatch = db.batch()
        for (let doc of docBatch) {
            deleteBatch.delete(doc.ref)
        }
        await deleteBatch.commit()
    }
    console.info(`Processed ${logItems.length} log items.`)
    console.info('done')
}

function splitIntoBatches(x: any[]): any[][] {
    const batchSize = 400
    const ret: any[][] = []
    let i = 0
    while (i < x.length) {
        ret.push(x.slice(i, i + batchSize))
        i += batchSize
    }
    return ret
}

main()