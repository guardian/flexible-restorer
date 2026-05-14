import { Favicon } from "@guardian/stand/favicon";
import { Layout } from "@guardian/stand/layout";
import { TopBar, TopBarToolName } from "@guardian/stand/TopBar";
import { type ReactNode } from "react";
import { RestorerIcon } from "./RestorerIcon";

interface Props {
    children: ReactNode;
}

export const MainLayout = ({ children }: Props) => {
    return (
        <Layout>
            <TopBar>
                <TopBarToolName
                    name="Flexible Restorer"
                    favicon={{ icon: <Favicon icon={<RestorerIcon />} /> }}
                />
            </TopBar>
            {children}
        </Layout>
    );
};
