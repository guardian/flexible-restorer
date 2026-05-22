import { Grid, Item } from "@guardian/stand/grid";
import { MainLayout } from "./components/MainLayout";
import { ComposerFileSearch } from "./components/ComposerFileSearch";
import { useUser } from "./useUser";

function App() {
    const { user, loading, error } = useUser();

    return (
        <MainLayout>
            <Grid>
                <Item size={{ sm: 12 }}>
                    <ComposerFileSearch submit={console.log} />
                </Item>
                <Item size={{ sm: 12 }}>
                    {loading && <p>Loading user details…</p>}
                    {error && <p>Error loading user: {error.message}</p>}
                    {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
                </Item>
            </Grid>
        </MainLayout>
    );
}

export default App;
