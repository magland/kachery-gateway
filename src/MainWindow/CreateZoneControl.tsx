import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core'
import useErrorMessage from '../errorMessageContext/useErrorMessage'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { useGithubAuth } from '../GithubAuth/useGithubAuth'

type Props = {
    onClose?: () => void
    onCreate: (zoneName: string, directory: string) => void
}

const CreateZoneControl: FunctionComponent<Props> = ({onClose, onCreate}) => {
    const [editZoneName, setEditZoneName] = useState<string>('')
    const {setErrorMessage} = useErrorMessage()

    const {userId} = useGithubAuth()
    
    const handleCreate = useCallback(() => {
        setErrorMessage('')
        const directoryName = `zones/${editZoneName}`
        onCreate(editZoneName, directoryName)
        onClose && onClose()
    }, [onClose, editZoneName, onCreate, setErrorMessage])
    const okayToAdd = useMemo(() => {
        return isValidZoneName(editZoneName)
    }, [editZoneName])
    const handleChangeZoneName = useCallback((event: any) => {
        setEditZoneName(event.target.value)
    }, [])
    if (!userId) {
        return (
            <div>
                <p>
                    IMPORTANT: you must be signed in to GitHub to add a zone.
                </p>
                {onClose && <Button onClick={onClose}>Cancel</Button>}
            </div>
        )
    }
    return (
        <div>
            <p style={{color: 'red'}}>
                IMPORTANT: if you are not an admin user, then the zone name must be&nbsp;
                "{userId}" or "{userId}.[something]", where {userId} is your GitHub user ID.
            </p>
            <Table style={{maxWidth: 400}}>
                <TableBody>
                    <TableRow>
                        <TableCell>New zone name</TableCell>
                        <TableCell>
                            <input type="text" value={editZoneName} onChange={handleChangeZoneName} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Button onClick={handleCreate} disabled={!okayToAdd}>Add</Button>
            {onClose && <Button onClick={onClose}>Cancel</Button>}
        </div>
    )
}

const isValidZoneName = (x: string) => {
    // must contain only alphanumeric characters, hyphens, underscores, and periods
    // must start with an alphanumeric character
    if (x.length < 3) {
        return false
    }
    if (!x.match(/^[a-z0-9][a-z0-9_.-]*$/i)) {
        return false
    }
    return true
}

export default CreateZoneControl