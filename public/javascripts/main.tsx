import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { App } from './components/App';
import { store } from './store/store';
import '@guardian/stand/fonts/OpenSans.css';
import '@guardian/stand/fonts/MaterialSymbolsOutlined.css';
import '../gu-noting.css';
import './fonts.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root');
createRoot(root).render(<Provider store={store}><BrowserRouter><App /></BrowserRouter></Provider>);