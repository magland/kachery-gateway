import { IconButton } from "@material-ui/core";
import { Refresh } from "@material-ui/icons";
import { FunctionComponent } from "react";
import ClientUsageTable from "./ClientUsageTable";
import useUsage from "./useUsage";

type Props ={
	width: number
	height: number
}

const AdminPage: FunctionComponent<Props> = () => {
	const {usage, refreshUsage} = useUsage()
	return (
		<div>
			<IconButton onClick={refreshUsage} title="Refresh usage"><Refresh /></IconButton>
			{
				usage && (
					<div>
						<h3>Total</h3>
						<ClientUsageTable
							clientUsage={usage.totalUsage.clientUsage}
						/>
						{
							[...usage.dailyUsage].reverse().map(x => (
								<div>
									<h3>{x.date}</h3>
									<ClientUsageTable
										clientUsage={x.clientUsage}
									/>
								</div>
							))
						}
					</div>
				)
			}
		</div>
	)
}

export default AdminPage
