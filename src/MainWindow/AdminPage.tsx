import { FunctionComponent } from "react";
import AdminConfigurationTab from "./AdminConfigurationTab/AdminConfigurationTab";
import AdminUsageTab from "./AdminUsageTab";
import TabWidget from "./TabWidget";

type Props ={
	width: number
	height: number
}

const tabs = [
	{label: 'Usage'},
	{label: 'Configuration'}
]

const AdminPage: FunctionComponent<Props> = ({width, height}) => {
	return (
		<TabWidget
			tabs={tabs}
			width={width}
			height={height}
		>
			<AdminUsageTab
				width={0}
				height={0}
			/>
			<AdminConfigurationTab
				width={0}
				height={0}
			/>
		</TabWidget>
	)
}

export default AdminPage
