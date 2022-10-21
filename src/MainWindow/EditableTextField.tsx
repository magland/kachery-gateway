import { Button } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import Hyperlink from '../components/Hyperlink/Hyperlink';

type Props = {
    value: string
    clearOnEdit?: boolean
    onChange: (x: string) => void
    onClick?: () => void
    tooltip?: string
    liveUpdating?: boolean
}

const EditableTextField: FunctionComponent<Props> = ({value, clearOnEdit, onChange, onClick, tooltip, liveUpdating}) => {
    const [editing, setEditing] = useState<boolean>(false)
    useEffect(() => {
        if (liveUpdating) {
            setEditing(true)
        }
    }, [liveUpdating])
    if (editing) {
        return (
            <TextInput
                value={clearOnEdit ? '' : value}
                onChange={(x) => {
                    onChange(x)
                    if (!liveUpdating) {
                        setEditing(false)
                    }
                }}
                onCancel={() => {
                    if (!liveUpdating) {
                        setEditing(false)
                    }
                }}
                liveUpdating={liveUpdating}
            />
        )
    }
    else {
        return (
            <span>
                {
                    onClick ? <Hyperlink onClick={onClick}>{value}</Hyperlink> : value
                }
                &nbsp;&nbsp;&nbsp;
                <Hyperlink onClick={() => setEditing(true)}>edit</Hyperlink>
            </span>
        )
    }
}

const TextInput: FunctionComponent<{value: string, onChange: (x: string) => void, onCancel: () => void, liveUpdating?: boolean}> = ({value, onChange, onCancel, liveUpdating}) => {
    const [internalValue, setInternalValue] = useState<string>('')
    useEffect(() => {
        setInternalValue(value)
    }, [value])
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        setInternalValue(e.target.value as string)
        if (liveUpdating) {
            onChange(e.target.value as string)
        }
    }, [liveUpdating, onChange])
    const handleSubmit = useCallback(() => {
        onChange(internalValue)
    }, [onChange, internalValue])
    return (
        <div>
            <input type="text" value={internalValue} onChange={handleChange} />
            {
                !liveUpdating ? (
                    <span>
                        <Button onClick={handleSubmit}>Submit</Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </span>
                ) : <span />
            }
        </div>
    )
}

export default EditableTextField