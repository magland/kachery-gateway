import guiApiRequest from "../common/guiApiRequest"
import { useSignedIn } from "../components/googleSignIn/GoogleSignIn"
import useErrorMessage from "../errorMessageContext/useErrorMessage"
import { useCallback, useEffect, useState } from "react"
import { DeleteClientRequest, GetClientsRequest, isDeleteClientResponse, isGetClientsResponse, isAddClientResponse, AddClientRequest } from "../types/GuiRequest"
import { Client } from "../types/Client"
import { createKeyPair, privateKeyToHex, publicKeyHexToNodeId, publicKeyToHex, signMessage } from "../types/crypto/signatures"
import useRoute from "./useRoute"
import { NodeId, PrivateKeyHex, Signature } from "../types/keypair"

const useClients = () => {
    const [clients, setClients] = useState<Client[] | undefined>(undefined)
    const { userId, googleIdToken } = useSignedIn()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshClients = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()

    useEffect(() => {
        ; (async () => {
            setErrorMessage('')
            setClients(undefined)
            if (!userId) return
            let canceled = false
            const req: GetClientsRequest = {
                type: 'getClients',
                userId,
                auth: { userId, googleIdToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetClientsResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setClients(resp.clients)
            return () => { canceled = true }
        })()
    }, [userId, googleIdToken, refreshCode, setErrorMessage])

    const addClient = useCallback((clientId: NodeId, label: string, verificationDocument: {type: 'addClient'}, verificationSignature: Signature, o: {privateKeyHex?: PrivateKeyHex}={}) => {
        if (!userId) return
            ; (async () => {
                const req: AddClientRequest = {
                    type: 'addClient',
                    clientId,
                    ownerId: userId,
                    label,
                    auth: { userId, googleIdToken },
                    verificationDocument,
                    verificationSignature
                }
                if (o.privateKeyHex) {
                    req.privateKeyHex = o.privateKeyHex
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isAddClientResponse(resp)) {
                    throw Error('Unexpected response')
                }
                refreshClients()
            })()
    }, [userId, googleIdToken, refreshClients, setErrorMessage])

    const {setRoute} = useRoute()

    const createClient = useCallback((label: string, o: {navigateToClientPage?: boolean}={}) => {
        ;(async () => {
            const keyPair = await createKeyPair()
            const clientId = publicKeyHexToNodeId(publicKeyToHex(keyPair.publicKey))
            const verificationDocument = {type: 'addClient' as 'addClient'}
            const verificationSignature = await signMessage(verificationDocument, keyPair)
            addClient(clientId, label, verificationDocument, verificationSignature, {privateKeyHex: privateKeyToHex(keyPair.privateKey)})
            if (o.navigateToClientPage) {
                setRoute({page: 'client', clientId})
            }
        })()
    }, [addClient, setRoute])

    const deleteClient = useCallback((clientId: NodeId) => {
        if (!userId) return
            ; (async () => {
                const req: DeleteClientRequest = {
                    type: 'deleteClient',
                    clientId,
                    ownerId: userId,
                    auth: { userId, googleIdToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isDeleteClientResponse(resp)) {
                    throw Error('Unexpected response')
                }
                refreshClients()
            })()
    }, [userId, googleIdToken, refreshClients, setErrorMessage])

    return { clients, refreshClients, addClient, createClient, deleteClient }
}

export default useClients