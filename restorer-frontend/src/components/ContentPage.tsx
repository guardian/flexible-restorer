import { Grid, Item } from "@guardian/stand/Grid";
import { RestoreList } from "./RestoreList";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    return (
        <Grid>
            <Item size={{ sm: 12 }}>
                <p>contentId = {contentId}</p>
            </Item>
            <Item>
                <RestoreList
                    isLoading={false}
                    models={[
                        {
                            isSecondary: false,
                            activeState: true,
                            revisionId: 42,
                            createdDateHtml: "last month",
                            relativeDate: "soonish",
                            userEmail: "test.user@example.com",
                            snapshotReason: "saved on purpose",
                            isLegallySensitive: false,
                            commentsEnabled: { on: true, defined: true },
                            publishedState: "broken",
                            isBecauseOfLaunch: false,
                        },
                    ]}
                    articleTitle="some title"
                    articleURL={`composer/content/${contentId}`}
                    headline="some headline"
                    standfirst="some standfirst"
                    trailText="some trailtext"
                    htmlContent="<p>contents</p>"
                    jsonContent="[]"
                    contentId={contentId}
                />
            </Item>
        </Grid>
    );
};
