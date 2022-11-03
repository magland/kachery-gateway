import { getBucket } from './getBucket'
import { getObjectContent, listObjects, parseBucketUri, putObject } from "./s3Helpers"
import { FinalizeFileUploadRequest } from './types/GatewayRequest'
import { AddClientRequest } from './types/GuiRequest'

const analyzeLogs = async () => {
    const bucket = getBucket()
    const { bucketName } = parseBucketUri(bucket.uri)

    const clients: {[key: string]: {clientId: string, ownerId: string}} = {}
    const totalClientUsage: {[key: string]: {size: number, count: number, ownerId: string}} = {}
    const clientUsageByDay: {[key: string]: {[key: string]: {size: number, count: number, ownerId: string}}} = {}

    const processUpload = (upload: {
        clientId: string
        hashAlg: string
        hash: string
        size: number
        timestamp: number
    }) => {
        if (!(upload.clientId in clients)) {
            clients[upload.clientId] = {clientId: upload.clientId, ownerId: ''}
        }
        if (!(upload.clientId in totalClientUsage)) {
            totalClientUsage[upload.clientId] = {size: 0, count: 0, ownerId: ''}
        }
        const date = new Date(upload.timestamp)
        const dateString = date.toISOString().split('T')[0] // yyyy-mm-dd
        if (!(dateString in clientUsageByDay)) {
            clientUsageByDay[dateString] = {}
        }
        if (!(upload.clientId in clientUsageByDay[dateString])) {
            clientUsageByDay[dateString][upload.clientId] = {size: 0, count: 0, ownerId: ''}
        }
        totalClientUsage[upload.clientId].count += 1
        totalClientUsage[upload.clientId].size += upload.size
        clientUsageByDay[dateString][upload.clientId].count += 1
        clientUsageByDay[dateString][upload.clientId].size += upload.size
    }
    const processAddClient = (clientId: string, ownerId: string) => {
        if (!(clientId in clients)) {
            clients[clientId] = {clientId: clientId, ownerId: ''}
        }
        clients[clientId].ownerId = ownerId
    }

    let continuationToken: string | undefined = undefined
    while (true) {
        const {objects: logFiles, continuationToken: newContinuationToken} = await listObjects(bucket, 'logs/', {continuationToken, maxObjects: 500})
        for (let a of logFiles) {
            console.info(`Loading ${a.Key} (${a.Size})`)
            console.info('Downloading')
            const logItemsJson = await getObjectContent(bucket, a.Key)
            const logItems = JSON.parse(logItemsJson)
            for (let logItem of logItems) {
                const type0 = logItem.request.type || (logItem.request.payload || {}).type
                if (type0 === 'finalizeFileUpload') {
                    const req = logItem.request as FinalizeFileUploadRequest
                    processUpload({
                        clientId: req.fromClientId.toString(),
                        hash: req.payload.hash,
                        hashAlg: req.payload.hashAlg,
                        size: req.payload.size,
                        timestamp: logItem.requestTimestamp
                    })
                }
                else if (type0 === 'addClient') {
                    const req = logItem.request as AddClientRequest
                    const clientId = req.clientId
                    const ownerId = req.ownerId
                    processAddClient(clientId.toString(), ownerId)
                }
                else if (type0 === 'migrateClient') {
                    const req = logItem.request
                    const clientId = req.client.clientId
                    const ownerId = req.client.ownerId
                    processAddClient(clientId, ownerId)
                }
            }
        }
        if (!newContinuationToken) {
            break
        }
        else {
            continuationToken = newContinuationToken as string
        }
    }

    const dateStrings = Object.keys(clientUsageByDay).sort()
    const dailyUsage: {date: string, clientUsage: {[key: string]: {size: number, count: number, ownerId: string}}}[] = []
    for (let dateString of dateStrings) {
        dailyUsage.push({
            'date': dateString,
            'clientUsage': clientUsageByDay[dateString]
        })
    }
    const totalUsage = {
        'clientUsage': totalClientUsage
    }

    for (let uu of dailyUsage) {
        console.info('')
        console.info(`====================== ${uu.date}`)
        const clientUsage = uu.clientUsage
        for (let clientId in clientUsage) {
            const client = clients[clientId]
            const {count, size} = clientUsage[clientId]
            clientUsage[clientId].ownerId = client.ownerId
            console.info(`${clientId.slice(0, 6)}... ${client.ownerId} ${count} ${size}`)
        }
    }
    console.info('')
    console.info('====================== total')
    for (let clientId in clients) {
        const client = clients[clientId]
        if (clientId in totalClientUsage) {
            const {count, size} = totalClientUsage[clientId]
            totalClientUsage[clientId].ownerId = client.ownerId
            console.info(`${clientId.slice(0, 6)}... ${client.ownerId} ${count} ${size}`)
        }
    }
    
    const usage = {
        timestamp: Date.now(),
        dailyUsage: dailyUsage,
        totalUsage: totalUsage
    }

    putObject(bucket, {
        Key: `usage/usage.json`,
        Bucket: bucketName,
        Body: JSON.stringify(usage, null, 4)
    })
}
analyzeLogs()