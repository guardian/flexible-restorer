import { useEffect, useState } from "react";
import { ContentPage } from "./components/ContentPage";
import { MainLayout } from "./components/MainLayout";
import { SearchPage } from "./components/SearchPage";
import { useUser } from "./useUser";
import '@guardian/stand/fonts/MaterialSymbolsOutlined.css';

const getPage = (path: string | undefined) => {
    if (!path) {
        return undefined;
    }

    if (!path.includes("content")) {
        return {
            id: undefined,
        };
    }

    //path format = /react/content/6a01c9df8f0896e9229358d4/versions

    return {
        id: path.split("/")[3],
    };
};

function App() {
    const { user } = useUser();

    const [path, setPath] = useState<string>();
    useEffect(() => {
        setPath(window.location.pathname);
    }, []);

    const page = getPage(path);

    return (
        <MainLayout user={user} contentId={page?.id}>
            {page && !page.id && <SearchPage />}
            {page?.id && <ContentPage contentId={page.id} />}
        </MainLayout>
    );
}

export default App;
