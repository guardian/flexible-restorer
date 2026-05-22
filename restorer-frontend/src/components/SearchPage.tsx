import { Grid, Item } from "@guardian/stand/Grid";
import { ComposerFileSearch } from "./ComposerFileSearch";
import { useState } from "react";

const idRegex = /^[a-zA-Z0-9_-]{24}$/;

const getContentPageRoute = (contentId: string) =>
    `/react/content/${contentId}/versions`;

const parseContentId = (input: string) => {
    const segments = input.split("/");
    const id = segments.find((segment) => idRegex.test(segment));
    return id;
};

export const SearchPage = () => {
    const [errorMessage, setErrorMessage] = useState<string>();

    const navigate = (input: string) => {
        setErrorMessage(undefined);
        const contentId = parseContentId(input);

        if (!contentId) {
            setErrorMessage("could not parse input");
            return;
        }

        window.open(getContentPageRoute(contentId));
    };

    return (
        <Grid>
            <Item size={{ sm: 12 }}>
                <ComposerFileSearch
                    submit={navigate}
                    errorMessage={errorMessage}
                />
            </Item>
        </Grid>
    );
};
