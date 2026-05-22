import { Grid, Item } from "@guardian/stand/Grid";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    return (
        <Grid>
            <Item size={{ sm: 12 }}>
                <p>contentId = {contentId}</p>
            </Item>
        </Grid>
    );
};
