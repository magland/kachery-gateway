import { getBucket, getFallbackBucket } from './getBucket'
import { getObjectContent, listObjects, parseBucketUri, putObject } from "./s3Helpers"
import { FinalizeFileUploadRequest, FindFileRequest, FindFileResponse } from './types/GatewayRequest'
import { AddClientRequest } from './types/GuiRequest'

type HeaderInfo = {userAgent: string, ip: string, ipCity: string, ipCountry: string, ipCountryRegion: string, referer: string}

const analyzeLogs = async () => {
    const bucket = getBucket()
    const { bucketName } = parseBucketUri(bucket.uri)

    const clients: {[key: string]: {clientId: string, ownerId: string, headerInfo: HeaderInfo | undefined}} = {}
    const totalClientUsage: {[key: string]: {uploadSize: number, uploadCount: number, downloadSize: number, downloadCount: number, fallbackDownloadSize: number, fallbackDownloadCount: number, ownerId: string}} = {}
    const clientUsageByDay: {[key: string]: {[key: string]: {uploadSize: number, uploadCount: number, downloadSize: number, downloadCount: number, fallbackDownloadSize: number, fallbackDownloadCount: number, ownerId: string}}} = {}

    const processUpload = (upload: {
        clientId: string
        hashAlg: string
        hash: string
        size: number
        timestamp: number
    }, headerInfo: HeaderInfo) => {
        if (!(upload.clientId in clients)) {
            clients[upload.clientId] = {clientId: upload.clientId, ownerId: '', headerInfo: undefined}
        }
        if (!clients[upload.clientId].headerInfo) {
            clients[upload.clientId].headerInfo = headerInfo
        }
        if (!(upload.clientId in totalClientUsage)) {
            totalClientUsage[upload.clientId] = {uploadSize: 0, uploadCount: 0, downloadSize: 0, downloadCount: 0, fallbackDownloadSize: 0, fallbackDownloadCount: 0, ownerId: ''}
        }
        const date = new Date(upload.timestamp)
        const dateString = date.toISOString().split('T')[0] // yyyy-mm-dd
        if (!(dateString in clientUsageByDay)) {
            clientUsageByDay[dateString] = {}
        }
        if (!(upload.clientId in clientUsageByDay[dateString])) {
            clientUsageByDay[dateString][upload.clientId] = {uploadSize: 0, uploadCount: 0, downloadSize: 0, downloadCount: 0, fallbackDownloadSize: 0, fallbackDownloadCount: 0, ownerId: ''}
        }
        totalClientUsage[upload.clientId].uploadCount += 1
        totalClientUsage[upload.clientId].uploadSize += upload.size
        clientUsageByDay[dateString][upload.clientId].uploadCount += 1
        clientUsageByDay[dateString][upload.clientId].uploadSize += upload.size
    }
    const processFindFile = (x: {
        clientId: string
        hashAlg: string
        hash: string
        size: number
        timestamp: number
        fallback: boolean
    }, headerInfo: HeaderInfo) => {
        if (!(x.clientId in clients)) {
            clients[x.clientId] = {clientId: x.clientId, ownerId: '', headerInfo: undefined}
        }
        if (!clients[x.clientId].headerInfo) {
            clients[x.clientId].headerInfo = headerInfo
        }
        if (!(x.clientId in totalClientUsage)) {
            totalClientUsage[x.clientId] = {uploadSize: 0, uploadCount: 0, downloadSize: 0, downloadCount: 0, fallbackDownloadSize: 0, fallbackDownloadCount: 0, ownerId: ''}
        }
        const date = new Date(x.timestamp)
        const dateString = date.toISOString().split('T')[0] // yyyy-mm-dd
        if (!(dateString in clientUsageByDay)) {
            clientUsageByDay[dateString] = {}
        }
        if (!(x.clientId in clientUsageByDay[dateString])) {
            clientUsageByDay[dateString][x.clientId] = {uploadSize: 0, uploadCount: 0, downloadSize: 0, downloadCount: 0, fallbackDownloadSize: 0, fallbackDownloadCount: 0, ownerId: ''}
        }
        if (!x.fallback) {
            totalClientUsage[x.clientId].downloadCount += 1
            totalClientUsage[x.clientId].downloadSize += x.size
            clientUsageByDay[dateString][x.clientId].downloadCount += 1
            clientUsageByDay[dateString][x.clientId].downloadSize += x.size
        }
        else {
            totalClientUsage[x.clientId].fallbackDownloadCount += 1
            totalClientUsage[x.clientId].fallbackDownloadSize += x.size
            clientUsageByDay[dateString][x.clientId].fallbackDownloadCount += 1
            clientUsageByDay[dateString][x.clientId].fallbackDownloadSize += x.size
        }
    }
    const processAddClient = (clientId: string, ownerId: string) => {
        if (!(clientId in clients)) {
            clients[clientId] = {clientId: clientId, ownerId: '', headerInfo: undefined}
        }
        clients[clientId].ownerId = ownerId
    }

    for (let logsDirName of ['fallback-logs', 'logs']) {
        let continuationToken: string | undefined = undefined
        while (true) {
            const {objects: logFiles, continuationToken: newContinuationToken} = await listObjects(bucket, `${logsDirName}/`, {continuationToken, maxObjects: 500})
            for (let a of logFiles) {
                console.info(`Loading ${a.Key} (${a.Size})`)
                if (a.Size > 0) { // ignore empty files
                    console.info('Downloading')
                    const logItemsJson = await getObjectContent(bucket, a.Key)
                    const logItems = JSON.parse(logItemsJson)
                    for (let logItem of logItems) {
                        const type0 = logItem.request.type || (logItem.request.payload || {}).type
                        if (type0 === 'finalizeFileUpload') {
                            const req = logItem.request as FinalizeFileUploadRequest
                            const headerInfo = getHeaderInfoFromRequestHeaders(logItem.requestHeaders)
                            processUpload({
                                clientId: req.fromClientId.toString(),
                                hash: req.payload.hash,
                                hashAlg: req.payload.hashAlg,
                                size: req.payload.size,
                                timestamp: logItem.requestTimestamp
                            }, headerInfo)
                        }
                        else if (type0 === 'findFile') {
                            const req = logItem.request as FindFileRequest
                            const resp = logItem.response as FindFileResponse
                            const headerInfo = getHeaderInfoFromRequestHeaders(logItem.requestHeaders)
                            processFindFile({
                                clientId: req.fromClientId.toString(),
                                hash: req.payload.hash,
                                hashAlg: req.payload.hashAlg,
                                size: resp.size || 0,
                                timestamp: logItem.requestTimestamp,
                                fallback: logItem.response.fallback || (logsDirName === 'fallback-logs')
                            }, headerInfo)   
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
            }
            if (!newContinuationToken) {
                break
            }
            else {
                continuationToken = newContinuationToken as string
            }
        }
    }

    const dateStrings = Object.keys(clientUsageByDay).sort()
    const dailyUsage: {date: string, clientUsage: {[key: string]: {uploadSize: number, uploadCount: number, downloadSize: number, downloadCount: number, fallbackDownloadSize: number, fallbackDownloadCount: number, ownerId: string}}}[] = []
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
            const {uploadCount, uploadSize, downloadCount, downloadSize, fallbackDownloadCount, fallbackDownloadSize} = clientUsage[clientId]
            clientUsage[clientId].ownerId = client.ownerId
            console.info(`${clientId.slice(0, 6)}... ${client.ownerId} ${uploadCount} ${uploadSize} ${downloadCount} ${downloadSize} ${fallbackDownloadCount} ${fallbackDownloadSize}`)
        }
    }
    console.info('')
    console.info('====================== total')
    for (let clientId in clients) {
        const client = clients[clientId]
        if (clientId in totalClientUsage) {
            const {uploadCount, uploadSize, downloadCount, downloadSize, fallbackDownloadCount, fallbackDownloadSize} = totalClientUsage[clientId]
            totalClientUsage[clientId].ownerId = client.ownerId
            console.info(`${clientId.slice(0, 6)}... ${client.ownerId} ${uploadCount} ${uploadSize} ${downloadCount} ${downloadSize} ${fallbackDownloadCount} ${fallbackDownloadSize}`)
        }
    }
    
    const usage = {
        timestamp: Date.now(),
        clients,
        dailyUsage,
        totalUsage
    }

    putObject(bucket, {
        Key: `usage/usage.json`,
        Bucket: bucketName,
        Body: JSON.stringify(usage, null, 4)
    })
}

const getHeaderInfoFromRequestHeaders = (requestHeaders: any): HeaderInfo => {
    return {
        userAgent: requestHeaders['user-agent'] || '',
        ip: requestHeaders['x-real-ip'],
        ipCity: requestHeaders['x-vercel-ip-city'],
        ipCountry: requestHeaders['x-vercel-ip-country'],
        ipCountryRegion: requestHeaders['x-vercel-ip-country-region'],
        referer: requestHeaders['referer']
    }
}

analyzeLogs()