import { TestConfigurationRequest, TestConfigurationResponse } from "../../src/types/GuiRequest";
import { getMongoClient } from "../common/getMongoClient";
import randomAlphaString from "../common/randomAlphaString";
import { getZoneData, joinKeys } from "../gatewayRequestHandlers/getZoneInfo";
import getAuthorizationSettings from "../gatewayRequestHandlers/getAuthorizationSettings";
import { getObjectContent, parseBucketUri, putObject } from "../gatewayRequestHandlers/s3Helpers";
import isAdminUser from "./helpers/isAdminUser";

const testConfigurationHandler = async (request: TestConfigurationRequest, verifiedUserId?: string): Promise<TestConfigurationResponse> => {
    if (!isAdminUser(verifiedUserId)) {
        const authorizationSettings = await getAuthorizationSettings(request.zone || 'default')
        const u = authorizationSettings.authorizedUsers.find(a => (a.userId === verifiedUserId))
        if ((!u) || (!u.admin)) {
            throw Error('User not authorized on this zone')
        }
    }

    const { testType, zone } = request

    const zoneData = await getZoneData(zone || 'default')

    const bucket = zoneData.bucket
    const {bucketName} = parseBucketUri(bucket.uri)

    let passed: boolean
    let result: any

    if (testType === 'bucketReadWrite') {
        const x = randomAlphaString(10)
        const k = joinKeys(zoneData.directory, 'tests/testReadWrite.txt')
        await putObject(bucket, {
            Key: k,
            Bucket: bucketName,
            Body: x
        })

        const a = (await getObjectContent(bucket, k)).toString()
        passed = a === x
        result = passed ? 'passed' : 'failed'
    }
    else if (testType === 'mongoReadWrite') {
        const x = randomAlphaString(10)
        const client = await getMongoClient()
        const testCollection = client.db('kachery-gateway').collection('test')
        await testCollection.replaceOne({
            _id: 'test'
        }, {
            _id: 'test',
            x
        }, {upsert: true})
        const a = await testCollection.findOne({_id: 'test'})
        if (a) {
            passed = a['x'] === x
            result = passed ? 'passed' : 'failed'
        }
        else {
            passed = false
            result = 'Unable to find document'
        }
    }
    else {
        throw Error(`Unexpected test type: ${testType}`)
    }
    
    return {
        type: 'testConfiguration',
        result,
        passed
    }
}

export default testConfigurationHandler