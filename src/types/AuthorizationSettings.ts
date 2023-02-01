import validateObject, { isArrayOf, isBoolean, isString, optional } from "./validateObject"

export type AuthorizationSettings = {
    allowPublicUpload: boolean
    authorizedUsers: {
        userId: string
        upload?: boolean
        admin?: boolean
    }[]
}

export const isAuthorizationSettings = (x: any): x is AuthorizationSettings => {
    return validateObject(x, {
        allowPublicUpload: isBoolean,
        authorizedUsers: isArrayOf(y => (validateObject(y, {
            userId: isString,
            upload: optional(isBoolean),
            admin: optional(isBoolean)
        })))
    })
}