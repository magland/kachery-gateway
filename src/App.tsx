import { MuiThemeProvider } from '@material-ui/core';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import ErrorMessageSetup from './errorMessageContext/ErrorMessageSetup';
import GithubAuthSetup from './GithubAuth/GithubAuthSetup';
import MainWindow from './MainWindow/MainWindow';
import theme from './theme';

function App() {
  return (
    <div className="App">
      <GithubAuthSetup>
        <MuiThemeProvider theme={theme}>
          <BrowserRouter>
            <ErrorMessageSetup>
              <MainWindow />
            </ErrorMessageSetup>
          </BrowserRouter>
        </MuiThemeProvider>
      </GithubAuthSetup>
    </div>
  );
}

export default App;
