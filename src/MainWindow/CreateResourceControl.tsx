import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core'
import useErrorMessage from '../errorMessageContext/useErrorMessage'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'

type Props = {
    onClose?: () => void
    onCreate: (resourceName: string, proxyUrl: string) => void
}

const CreateResourceControl: FunctionComponent<Props> = ({onClose, onCreate}) => {
    const [editProxyUrl, setEditProxyUrl] = useState<string>('')
    const [editResourceName, setEditResourceName] = useState<string>('')
    const {setErrorMessage} = useErrorMessage()
    
    const handleCreate = useCallback(() => {
        setErrorMessage('')
        onCreate(editResourceName, editProxyUrl)
        onClose && onClose()
    }, [onClose, editProxyUrl, editResourceName, onCreate, setErrorMessage])
    const okayToAdd = useMemo(() => {
        return isValidProxyUrl(editProxyUrl) && isValidResourceName(editResourceName)
    }, [editProxyUrl, editResourceName])
    const handleChangeProxyUrl = useCallback((event: any) => {
        setEditProxyUrl(event.target.value)
    }, [])
    const handleChangeResourceName = useCallback((event: any) => {
        setEditResourceName(event.target.value)
    }, [])
    return (
        <div>
            <Table style={{maxWidth: 400}}>
                <TableBody>
                    <TableRow>
                        <TableCell>New resource name</TableCell>
                        <TableCell>
                            <input type="text" value={editResourceName} onChange={handleChangeResourceName} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>New resource proxy URL</TableCell>
                        <TableCell>
                            <input type="text" value={editProxyUrl} onChange={handleChangeProxyUrl} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Button onClick={handleCreate} disabled={!okayToAdd}>Add</Button>
            {onClose && <Button onClick={onClose}>Cancel</Button>}
        </div>
    )
}

const isValidProxyUrl = (x: string) => {
    return x.length >= 3
}

const isValidResourceName = (x: string) => {
    return x.length >= 3
}

export default CreateResourceControl