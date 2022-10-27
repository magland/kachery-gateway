import validateObject, { isNumber, optional } from "./validateObject"

export type LogItem = {
    request: any
    response: any
    requestTimestamp: number
    elapsed: number
    requestHeaders: any
}

export const isLogItem = (x: any): x is LogItem => {
    return validateObject(x, {
        request: () => (true),
        response: () => (true),
        requestTimestamp: isNumber,
        elapsed: isNumber,
        requestHeaders: optional(() => (true))
    })
}