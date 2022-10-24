import * as fs from 'fs'
import { JSONStringifyDeterministic } from "../../src/types/keypair"
import { isLogItem, LogItem } from "../../src/types/LogItem"
import firestoreDatabase from "./firestoreDatabase"
import { getAdminBucket } from './getBucket'
import { parseBucketUri, putObject } from "./s3Helpers"
import sleepMsec from "./sleepMsec"

const main = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    // const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const adminBucket = getAdminBucket()
    await sleepMsec(500)

    const {bucketName: adminBucketName} = parseBucketUri(adminBucket.uri)

    const logItemsCollection = db.collection('kachery-gateway.logItems')
    const result = await logItemsCollection.orderBy('requestTimestamp', 'asc').limit(10000).get()
    const logItems: LogItem[] = []
    for (let doc of result.docs) {
        const logItem = doc.data()
        if (!isLogItem(logItem)) {
            console.warn(logItem)
            throw Error('Invalid log item in database')
        }
        // console.info(new Date(logItem.requestTimestamp).toISOString())
        logItems.push(logItem)
    }
    if (logItems.length === 0) {
        console.info('No log items to process. Exiting.')
        return
    }
    console.info('=================================================')
    console.info(`Processing ${logItems.length} log items.`)
    const logItemsJson = JSONStringifyDeterministic(logItems)
    const ts = new Date().toISOString()
    const fname = `log-${ts}.json`
    const objectKey = `logs/${fname}`
    console.info(`Writing ${fname}`)
    fs.writeFileSync(fname, logItemsJson)
    console.info(`Uploading log to admin bucket ${objectKey}`)
    await putObject(adminBucket, {
        Body: logItemsJson,
        Key: objectKey,
        Bucket: adminBucketName
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