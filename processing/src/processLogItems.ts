// import { DocumentSnapshot } from '@google-cloud/firestore'

import { DocumentSnapshot } from "@google-cloud/firestore"
import * as fs from 'fs'
import firestoreDatabase from "./firestoreDatabase"
import { getBucket } from "./getBucket"
import { getMongoClient } from "./getMongoClient"
import { parseBucketUri, putObject } from "./s3Helpers"
import splitIntoBatches from "./splitIntoBatches"
import { isLogItem, LogItem } from "./types/LogItem"

const processLogItems = async () => {
    const db = firestoreDatabase()

    const bucket = getBucket()
    const {bucketName} = parseBucketUri(bucket.uri)

    {
        // old firestore method
        const logItemsCollection = db.collection('kachery-gateway.logItems')
        let lastSnapshot: DocumentSnapshot | undefined = undefined
        while (true) {
            const logItems: LogItem[] = []
            let qq = logItemsCollection.orderBy('requestTimestamp', 'asc')
            qq = lastSnapshot ? qq.startAfter(lastSnapshot) : qq
            const result = await qq.limit(10000).get()
            if (result.docs.length === 0) {
                console.info('No more log items to process. Exiting.')
                break
            }
            lastSnapshot = result.docs[result.docs.length - 1]
            for (let doc of result.docs) {
                const logItem = doc.data()
                if (!isLogItem(logItem)) {
                    console.warn(logItem)
                    throw Error('Invalid log item in database')
                }
                const type0 = logItem.request.type || (logItem.request.payload || {}).type
                if ([
                    "initiateFileUpload",
                    "finalizeFileUpload",
                    "findFile",
                    "addClient",
                    "deleteClient",
                    "setClientInfo",
                    "migrateClient",
                    "migrateProjectFile"
                ].includes(type0)) {
                    logItems.push(logItem)
                }
                else {
                    if (type0 === 'getZoneInfo') {
                        console.warn(`WARNING: Unexpected log item type: ${type0}`)
                    }
                    else {
                        throw Error(`Unexpected log item type: ${type0}`)
                    }
                }
                // console.info(new Date(logItem.requestTimestamp).toISOString())
            }

            console.info('=================================================')
            console.info(`Processing ${logItems.length} log items.`)
            const logItemsJson = JSON.stringify(logItems) // deterministic stringify can be slow here
            const ts = new Date().toISOString()
            const fname = `log-${ts}.json`
            const objectKey = `logs/${fname}`
            console.info(`Writing ${fname}`)
            fs.writeFileSync(fname, logItemsJson)
            console.info(`Uploading log to admin bucket ${objectKey}`)
            await putObject(bucket, {
                Body: logItemsJson,
                Key: objectKey,
                Bucket: bucketName
            })
            console.info('Deleting log items')
            const docBatches = splitIntoBatches(result.docs, 400)
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
        }
    }

    {
        // new firestore method
        const client = await getMongoClient()
        const logItemsCollection = client.db('kachery-gateway').collection('logItems')
        while (true) {
            const logItems: LogItem[] = []
            let cursor = logItemsCollection.find().sort('requestTimestamp', 1).limit(1000)
            const results = await cursor.toArray()
            if (results.length === 0) {
                console.info('No more mongo log items to process. Exiting.')
                break
            }
            for (let result of results) {
                const logItem = {...result}
                delete logItem['_id']
                if (!isLogItem(logItem)) {
                    console.warn(logItem)
                    throw Error('Invalid log item in database')
                }
                const type0 = logItem.request.type || (logItem.request.payload || {}).type
                if ([
                    "initiateFileUpload",
                    "finalizeFileUpload",
                    "findFile",
                    "addClient",
                    "deleteClient",
                    "setClientInfo",
                    "migrateClient",
                    "migrateProjectFile"
                ].includes(type0)) {
                    logItems.push(logItem)
                }
                else {
                    if (type0 === 'getZoneInfo') {
                        console.warn(`WARNING: Unexpected log item type: ${type0}`)
                    }
                    else {
                        throw Error(`Unexpected log item type: ${type0}`)
                    }
                }
                // console.info(new Date(logItem.requestTimestamp).toISOString())
            }

            console.info('=================================================')
            console.info(`Processing ${logItems.length} mongo log items.`)
            const logItemsJson = JSON.stringify(logItems) // deterministic stringify can be slow here
            const ts = new Date().toISOString()
            const fname = `log-${ts}.json`
            const objectKey = `logs/${fname}`
            console.info(`Writing ${fname}`)
            fs.writeFileSync(fname, logItemsJson)
            console.info(`Uploading log to admin bucket ${objectKey}`)
            await putObject(bucket, {
                Body: logItemsJson,
                Key: objectKey,
                Bucket: bucketName
            })
            console.info('Deleting mongo log items')
            // delete 50 at a time
            const idBatches = splitIntoBatches(results.map(r => (r._id)), 50)
            for (let ids of idBatches) {
                console.info(`Deleting batch of ${ids.length}`)
                await logItemsCollection.deleteMany({
                    _id: {$in: ids}
                })
            }
            console.info(`Processed ${logItems.length} mongo log items.`)
        }
    }
}

processLogItems()