import validateObject, { isString } from "./validateObject";
import * as crypto from 'crypto'

// PublicKey
export interface PublicKey extends String {
    __publicKey__: never // phantom type so that we cannot assign directly to a string
}
export const isPublicKey = (x: any) : x is PublicKey => {
    if (!isString(x)) return false;
    return checkKeyblockHeader(x, 'PUBLIC');
}

// PrivateKey
export interface PrivateKey extends String {
    __privateKey__: never // phantom type
}
export const isPrivateKey = (x: any) : x is PrivateKey => {
    if (!isString(x)) return false;
    return checkKeyblockHeader(x, 'PRIVATE');
}

const checkKeyblockHeader = (key: string, type: 'PUBLIC' | 'PRIVATE') => {
    // note we need to double-escape the backslashes here.
    const pattern = new RegExp(`-----BEGIN ${type} KEY-----[\\s\\S]*-----END ${type} KEY-----\n*$`);
    return (pattern.test(key));
}

// KeyPair
export interface KeyPair {
    publicKey: PublicKey,
    privateKey: PrivateKey
}
export const isKeyPair = (x: any) : x is KeyPair => {
    return validateObject(x, {
        publicKey: isPublicKey,
        privateKey: isPrivateKey
    });
}

export const isHexadecimal = (x: string, length?: number) : boolean => {
    const basePattern: string = '[0-9a-fA-F]';
    let pattern: string = `^${basePattern}*$`;
    if (length !== undefined) {
        pattern = `^${basePattern}{${length}}$`;
    }
    const regex = new RegExp(pattern);

    return (regex.test(x));
}

// PublicKeyHex
export interface PublicKeyHex extends String {
    __publicKeyHex__: never // phantom type so that we cannot assign directly to a string
}
export const isPublicKeyHex = (x: any) : x is PublicKeyHex => {
    if (!isString(x)) return false;
    return isHexadecimal(x, 64);
}

// PrivateKeyHex
export interface PrivateKeyHex extends String {
    __privateKeyHex__: never // phantom type
}
export const isPrivateKeyHex = (x: any) : x is PrivateKeyHex => {
    if (!isString(x)) return false;
    return isHexadecimal(x, 64);
}

// Signature
export interface Signature extends String {
    __signature__: never
}
export const isSignature = (x: any): x is Signature => {
    if (!isString(x)) return false;
    return isHexadecimal(x, 128);
}

// NodeId
export interface NodeId extends String {
    __nodeId__: never // phantom type
}
export const isNodeId = (x: any): x is NodeId => {
    if (!isString(x)) return false;
    return isHexadecimal(x, 64);
}

// Sha1Hash
export interface Sha1Hash extends String {
    __sha1Hash__: never // phantom type
}
export const isSha1Hash = (x: any) : x is Sha1Hash => {
    if (!isString(x)) return false;
    return isHexadecimal(x, 40); // Sha1 should be 40 hex characters
}

export const nodeIdToPublicKeyHex = (nodeId: NodeId): PublicKeyHex => {
    return nodeId.toString() as any as PublicKeyHex;
}

export const sha1OfObject = (x: any): Sha1Hash => {
    return sha1OfString(JSONStringifyDeterministic(x))
}
export const sha1OfString = (x: string): Sha1Hash => {
    const sha1sum = crypto.createHash('sha1')
    sha1sum.update(x)
    return sha1sum.digest('hex') as any as Sha1Hash
}
// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = ( obj: any, space: string | number | undefined =undefined ) => {
    var allKeys: string[] = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}