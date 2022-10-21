import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core'
import useErrorMessage from '../errorMessageContext/useErrorMessage'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'

type Props = {
    onClose?: () => void
    onCreate: (label: string) => void
}

const CreateClientControl: FunctionComponent<Props> = ({onClose, onCreate}) => {
    const [editLabel, setEditLabel] = useState<string>('')
    const {setErrorMessage} = useErrorMessage()
    
    const handleCreate = useCallback(() => {
        setErrorMessage('')
        onCreate(editLabel)
        onClose && onClose()
    }, [onClose, editLabel, onCreate, setErrorMessage])
    const okayToAdd = useMemo(() => {
        return isValidLabel(editLabel)
    }, [editLabel])
    const handleChangeLabel = useCallback((event: any) => {
        setEditLabel(event.target.value)
    }, [])
    return (
        <div>
            <Table style={{maxWidth: 400}}>
                <TableBody>
                    <TableRow>
                        <TableCell>New client label (for display)</TableCell>
                        <TableCell>
                            <input type="text" value={editLabel} onChange={handleChangeLabel} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Button onClick={handleCreate} disabled={!okayToAdd}>Add</Button>
            {onClose && <Button onClick={onClose}>Cancel</Button>}
        </div>
    )
}

const isValidLabel = (x: string) => {
    return x.length >= 3
}

export default CreateClientControl