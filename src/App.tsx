import { AppRouter } from './app/router'
import { AppStateProvider } from './app/providers/AppStateProvider'
import './styles/app.css'

function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <AppRouter />
    </AppStateProvider>
  )
}

export default App
