import { MuiThemeProvider } from '@material-ui/core';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import GoogleSignInSetup from './components/googleSignIn/GoogleSignInSetup';
import ErrorMessageSetup from './errorMessageContext/ErrorMessageSetup';
import MainWindow from './MainWindow/MainWindow';
import theme from './theme';

function App() {
  return (
    <div className="App">
      <GoogleSignInSetup>
        <MuiThemeProvider theme={theme}>
          <BrowserRouter>
            <ErrorMessageSetup>
              <MainWindow />
            </ErrorMessageSetup>
          </BrowserRouter>
        </MuiThemeProvider>
      </GoogleSignInSetup>
    </div>
  );
}

export default App;
