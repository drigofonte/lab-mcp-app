import { createRoot } from 'react-dom/client';
import '@assistant-ui/react-ui/styles/index.css';
import '@assistant-ui/react-ui/styles/markdown.css';
import '@assistant-ui/react-ui/styles/themes/default.css';
import './styles.css';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
