import validateObject, { isNumber, isString } from "./validateObject"

export type FileRecord = {
    hashAlg: string
    hash: string
    size: number
    bucketUri: string
    timestamp: number
}

export const isFileRecord = (x: any): x is FileRecord => {
    return validateObject(x, {
        hashAlg: isString,
        hash: isString,
        size: isNumber,
        bucketUri: isString,
        timestamp: isNumber
    })
}