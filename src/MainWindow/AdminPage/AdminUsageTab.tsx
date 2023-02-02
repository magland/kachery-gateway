import { IconButton } from "@material-ui/core";
import { Refresh } from "@material-ui/icons";
import { FunctionComponent, useEffect } from "react";
import ClientUsageTable from "./ClientUsageTable";
import useUsage from "./useUsage";

type Props ={
	width: number
	height: number
}

const AdminUsageTab: FunctionComponent<Props> = ({width, height}) => {
	const {usage, refreshUsage} = useUsage()
	useEffect(() => {
		console.info("USAGE saved as window['admin-usage']")
		console.info(usage)
		;(window as any)['admin-usage'] = usage
	}, [usage])
	return (
		<div style={{overflowY: 'auto', position: 'absolute', width, height}}>
			<p>
				Usage statistics are updated every few hours.
			</p>
			<p>
				Download numbers only reflect the newly-issued pre-signed download URLs.
				Since those URLs are cached for up to 30 minutes, the actual download
				numbers could be much higher.
			</p>
			<IconButton onClick={refreshUsage} title="Refresh usage"><Refresh /></IconButton>
			{
				usage && (
					<div>
						<h3>Total</h3>
						<ClientUsageTable
							clientUsage={usage.totalUsage.clientUsage}
						/>
						{
							[...usage.dailyUsage].reverse().map((x, ii) => (
								<div key={ii}>
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

export default AdminUsageTab
