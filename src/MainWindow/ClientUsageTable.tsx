import { FunctionComponent, useMemo } from "react";
import NiceTable from "../components/NiceTable/NiceTable";
import formatByteCount from "../misc/formatByteCount";

type Props ={
	clientUsage: {[key: string]: {count: number, size: number, ownerId: string}}
}

const columns = [
	{key: 'clientId', label: 'Client'},
	{key: 'ownerId', label: 'Owner'},
	{key: 'numFiles', label: 'Num. files'},
	{key: 'size', label: 'Size'}
]

const ClientUsageTable: FunctionComponent<Props> = ({clientUsage}) => {
	const clientIds = useMemo(() => (Object.keys(clientUsage).sort()), [clientUsage])
	const rows = useMemo(() => (
		clientIds.map(clientId => ({
			key: clientId,
			columnValues: {
				clientId,
				ownerId: clientUsage[clientId].ownerId,
				numFiles: clientUsage[clientId].count,
				size: formatByteCount(clientUsage[clientId].size)
			}
		}))
	), [clientUsage, clientIds])
	return (
		<NiceTable
			columns={columns}
			rows={rows}
		/>
	)
}

export default ClientUsageTable
