import { Grid, Item } from "@guardian/stand/grid";
import { MainLayout } from "./components/MainLayout";
import { ComposerFileSearch } from "./components/ComposerFileSearch";

function App() {
    return (
        <MainLayout>
            <Grid>
                <Item size={{ sm: 12 }}>
                    <ComposerFileSearch submit={console.log} />
                </Item>
            </Grid>
        </MainLayout>
    );
}

export default App;
