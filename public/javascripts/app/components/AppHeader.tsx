/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css, Global } from '@emotion/react';
import { TopBar, TopBarToolName } from '@guardian/stand/TopBar';
import type { TopBarToolNameProps } from '@guardian/stand/TopBar';


const faviconCss = css({
    padding: '4px',
});


type FaviconWithImage = Extract<
    TopBarToolNameProps['favicon'],
    { src: string }
>;

const favicon: FaviconWithImage = {
    src: '/assets/images/restorer-white-38.svg',
    alt: 'Flexible Restorer',
    letter: 'R',
    cssOverrides: faviconCss,
};

const AppHeader: FunctionComponent = () => (
    
    <TopBar>
        <TopBarToolName 
            name="Restorer" 
            favicon={favicon}  
        />
    </TopBar>

);

export { AppHeader };