import { Grid, Item } from "@guardian/stand/Grid";
import { MainLayout } from "./components/MainLayout";
import { ComposerFileSearch } from "./components/ComposerFileSearch";
import { useUser } from "./useUser";

function App() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <Grid>
                <Item size={{ sm: 12 }}>
                    <ComposerFileSearch submit={console.log} />
                </Item>
            </Grid>
        </MainLayout>
    );
}

export default App;
